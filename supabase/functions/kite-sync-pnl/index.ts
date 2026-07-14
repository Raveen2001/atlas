import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { KiteConnect } from "npm:kiteconnect@5.3.0";
import moment from "npm:moment-timezone@0.5.46";

// Untyped client (no generated Database types) — keeps .from() calls loose.
// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, any, any>;

const KITE_API_KEY = Deno.env.get("KITE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TZ = "Asia/Kolkata";
const MFAPI_LOOKBACK_DAYS = 10;

type Holding = {
  tradingsymbol: string;
  quantity: number;
  average_price: number;
  last_price: number;
  close_price: number;
};

type Order = {
  order_id: string;
  tradingsymbol: string;
  product: string;
  transaction_type: string;
  status: string;
  filled_quantity: number;
  average_price: number;
};

type MFHolding = {
  tradingsymbol: string;
  fund?: string;
  quantity: number;
  average_price: number;
  last_price: number;
};

type MFOrder = {
  order_id: string;
  tradingsymbol: string;
  fund?: string;
  transaction_type: string;
  status: string;
  quantity: number;
  average_price: number;
  order_timestamp?: string | Date;
  exchange_timestamp?: string | Date;
};

// mf_units snapshot values: legacy rows are plain unit counts, newer rows
// carry { units, avg_price } so cost basis survives a full redemption.
type MFSnapshotValue = number | { units: number; avg_price: number | null };

type StockSnapshot = Record<string, { qty: number; avg_price: number }>;

type RealisedTradeRow = {
  order_id: string;
  user_id: string;
  kind: "stock" | "mf";
  symbol: string;
  name: string | null;
  quantity: number;
  avg_buy_price: number;
  sell_price: number;
  realised_pnl: number;
  trade_date: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function snapshotUnits(v: MFSnapshotValue | undefined): number {
  if (v == null) return 0;
  const q = typeof v === "number" ? v : Number(v.units);
  return Number.isFinite(q) ? q : 0;
}

// Kite timestamps are IST ("YYYY-MM-DD HH:mm:ss"); kiteconnect may parse
// them into Date objects. Either way, extract the IST calendar date.
function kiteTimestampToISTDate(ts: string | Date | undefined): string | null {
  if (!ts) return null;
  if (ts instanceof Date) return moment(ts).tz(TZ).format("YYYY-MM-DD");
  const m = String(ts).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// MFAPI date format is DD-MM-YYYY; convert to YYYY-MM-DD for sorting/matching.
function mfapiDateToISO(s: string): string | null {
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Returns the top 2 most recent NAV entries in ISO date form. Empty array on
// any failure (unknown scheme, network, no data in range).
async function fetchTopTwoNavs(
  schemeCode: string,
  startDate: string,
  endDate: string,
): Promise<Array<{ date: string; nav: number }>> {
  const url = `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}?startDate=${startDate}&endDate=${endDate}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn(`[KITE-SYNC-PNL] MFAPI ${schemeCode} HTTP ${res.status}`);
      return [];
    }
    const body = await res.json();
    const raw = (body?.data ?? []) as Array<{ date: string; nav: string }>;
    const parsed = raw
      .map((r) => ({ date: mfapiDateToISO(r.date), nav: Number(r.nav) }))
      .filter(
        (r): r is { date: string; nav: number } =>
          r.date != null && Number.isFinite(r.nav) && r.nav > 0,
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return parsed.slice(0, 2);
  } catch (e) {
    console.warn(`[KITE-SYNC-PNL] MFAPI ${schemeCode} fetch failed:`, e);
    return [];
  }
}

async function fetchNiftyReturnPct(): Promise<number | null> {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1d";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error("[KITE-SYNC-PNL] Yahoo status:", res.status);
      return null;
    }
    const body = await res.json();
    const meta = body?.chart?.result?.[0]?.meta;
    const last = Number(meta?.regularMarketPrice);
    const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose);
    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0)
      return null;
    return ((last - prev) / prev) * 100;
  } catch (e) {
    console.error("[KITE-SYNC-PNL] Yahoo fetch failed:", e);
    return null;
  }
}

// ── Realised P&L (stocks) ─────────────────────────────────────
// Profit booked when a holding is sold: fill price vs the holding's
// average_price, taken from the day's completed CNC SELL orders (delivery-
// only account — no positions/F&O involved). Cost basis falls back to the
// previous day's stock_holdings snapshot when the scrip was fully sold and
// no longer appears in the holdings response. Kite order_id is the PK, so
// reruns upsert the same rows instead of duplicating.
function computeStockRealisedTrades(
  userId: string,
  loggedDate: string,
  orders: Order[],
  holdings: Holding[],
  prevSnapshot: StockSnapshot | null,
): { trades: RealisedTradeRow[]; skipped: string[] } {
  const avgBySymbol = new Map<string, number>();
  for (const h of holdings) {
    if (h.tradingsymbol && Number(h.average_price) > 0) {
      avgBySymbol.set(h.tradingsymbol, Number(h.average_price));
    }
  }

  const trades: RealisedTradeRow[] = [];
  const skipped: string[] = [];
  for (const o of orders) {
    if (!isCompletedCncSell(o)) continue;
    const qty = Number(o.filled_quantity || 0);
    const sellPrice = Number(o.average_price || 0);
    if (qty <= 0 || sellPrice <= 0) continue;

    const avgBuy =
      avgBySymbol.get(o.tradingsymbol) ??
      prevSnapshot?.[o.tradingsymbol]?.avg_price ??
      null;
    if (avgBuy == null || avgBuy <= 0) {
      skipped.push(o.tradingsymbol);
      continue;
    }

    trades.push({
      order_id: o.order_id,
      user_id: userId,
      kind: "stock",
      symbol: o.tradingsymbol,
      name: null,
      quantity: qty,
      avg_buy_price: round4(avgBuy),
      sell_price: round4(sellPrice),
      realised_pnl: round2((sellPrice - avgBuy) * qty),
      trade_date: loggedDate,
    });
  }
  return { trades, skipped };
}

function isCompletedCncSell(o: Order): boolean {
  return (
    o.transaction_type === "SELL" &&
    o.status === "COMPLETE" &&
    o.product === "CNC" &&
    Boolean(o.order_id)
  );
}

// ── Realised P&L (MF redemptions) ─────────────────────────────
// Redemptions complete days after placement, so each run scans getMFOrders
// for COMPLETE SELL orders not yet recorded (order_id is the dedup key).
// Execution NAV = order.average_price; cost basis = the MF holding's
// average_price (buy avg, unchanged by sells), falling back to recent
// mf_units snapshots when the fund was fully redeemed.
async function computeMfRealisedTrades(
  admin: Admin,
  userId: string,
  mfOrders: MFOrder[],
  mfHoldings: MFHolding[],
  loggedDate: string,
): Promise<{ trades: RealisedTradeRow[]; skipped: string[] }> {
  const sells = mfOrders.filter(
    (o) =>
      o.transaction_type === "SELL" &&
      o.status === "COMPLETE" &&
      o.order_id &&
      Number(o.quantity) > 0 &&
      Number(o.average_price) > 0,
  );
  if (sells.length === 0) return { trades: [], skipped: [] };

  const { data: existing } = await admin
    .from("kite_realised_trades")
    .select("order_id")
    .in(
      "order_id",
      sells.map((o) => o.order_id),
    );
  const seen = new Set((existing ?? []).map((r) => r.order_id as string));
  const fresh = sells.filter((o) => !seen.has(o.order_id));
  if (fresh.length === 0) return { trades: [], skipped: [] };

  const avgByIsin = new Map<string, number>();
  for (const h of mfHoldings) {
    if (h.tradingsymbol && Number(h.average_price) > 0) {
      avgByIsin.set(h.tradingsymbol, Number(h.average_price));
    }
  }

  // Lazy-loaded fallback: recent snapshots, newest first.
  let snapshotRows: Array<Record<string, MFSnapshotValue>> | null = null;
  const loadSnapshots = async () => {
    if (snapshotRows != null) return snapshotRows;
    const { data } = await admin
      .from("investment_logs")
      .select("mf_units")
      .eq("user_id", userId)
      .not("mf_units", "is", null)
      .order("logged_date", { ascending: false })
      .limit(7);
    snapshotRows = (data ?? []).map(
      (r) => r.mf_units as Record<string, MFSnapshotValue>,
    );
    return snapshotRows;
  };

  const trades: RealisedTradeRow[] = [];
  const skipped: string[] = [];
  for (const o of fresh) {
    let avgBuy = avgByIsin.get(o.tradingsymbol) ?? null;
    if (avgBuy == null) {
      for (const snap of await loadSnapshots()) {
        const v = snap[o.tradingsymbol];
        if (v != null && typeof v === "object") {
          const ap = Number(v.avg_price);
          if (Number.isFinite(ap) && ap > 0) {
            avgBuy = ap;
            break;
          }
        }
      }
    }
    if (avgBuy == null) {
      skipped.push(o.tradingsymbol);
      continue;
    }
    const nav = Number(o.average_price);
    const units = Number(o.quantity);
    trades.push({
      order_id: o.order_id,
      user_id: userId,
      kind: "mf",
      symbol: o.tradingsymbol,
      name: o.fund ?? null,
      quantity: units,
      avg_buy_price: round4(avgBuy),
      sell_price: round4(nav),
      realised_pnl: round2((nav - avgBuy) * units),
      trade_date:
        kiteTimestampToISTDate(o.exchange_timestamp ?? o.order_timestamp) ??
        loggedDate,
    });
  }
  return { trades, skipped };
}

// Upsert trade rows, then re-derive each affected day's realised_pnl from
// the table so the column stays consistent on reruns.
async function persistRealisedTrades(
  admin: Admin,
  userId: string,
  trades: RealisedTradeRow[],
): Promise<string | null> {
  if (trades.length === 0) return null;
  const { error: upsertErr } = await admin
    .from("kite_realised_trades")
    .upsert(trades, { onConflict: "order_id" });
  if (upsertErr) return upsertErr.message;

  const dates = [...new Set(trades.map((t) => t.trade_date))];
  for (const d of dates) {
    const { data: rows, error: sumErr } = await admin
      .from("kite_realised_trades")
      .select("realised_pnl")
      .eq("user_id", userId)
      .eq("trade_date", d);
    if (sumErr) return sumErr.message;
    const total = round2(
      (rows ?? []).reduce((s, r) => s + Number(r.realised_pnl), 0),
    );

    const { data: logRows } = await admin
      .from("investment_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("logged_date", d)
      .limit(1);
    const err = logRows?.[0]
      ? (
          await admin
            .from("investment_logs")
            .update({ realised_pnl: total })
            .eq("id", logRows[0].id)
        ).error
      : (
          await admin.from("investment_logs").insert({
            user_id: userId,
            logged_date: d,
            pnl_amount: 0,
            realised_pnl: total,
          })
        ).error;
    if (err) return err.message;
  }
  return null;
}

type SyncOutcome =
  | {
      status: "ok";
      pnl: number;
      backfilledDate: string | null;
      realisedTrades: number;
      realisedTotal: number;
    }
  | { status: "kite_error"; error: string }
  | { status: "save_error"; error: string };

async function syncUser(
  admin: Admin,
  userId: string,
  accessToken: string,
  loggedDate: string,
  niftyPct: number | null,
  startDate: string,
  endDate: string,
): Promise<SyncOutcome> {
  const kc = new KiteConnect({ api_key: KITE_API_KEY });
  kc.setAccessToken(accessToken);

  let holdings: Holding[] = [];
  let orders: Order[] = [];
  let mfHoldings: MFHolding[] = [];
  let mfOrders: MFOrder[] = [];
  try {
    const [h, o, m, mo] = await Promise.all([
      kc.getHoldings(),
      kc.getOrders().catch((e: unknown) => {
        console.warn(
          `[KITE-SYNC-PNL] Orders unavailable for ${userId.slice(0, 8)}:`,
          e instanceof Error ? e.message : String(e),
        );
        return [];
      }),
      kc.getMFHoldings().catch((e: unknown) => {
        console.warn(
          `[KITE-SYNC-PNL] MF holdings unavailable for ${userId.slice(0, 8)}:`,
          e instanceof Error ? e.message : String(e),
        );
        return [];
      }),
      kc.getMFOrders().catch((e: unknown) => {
        console.warn(
          `[KITE-SYNC-PNL] MF orders unavailable for ${userId.slice(0, 8)}:`,
          e instanceof Error ? e.message : String(e),
        );
        return [];
      }),
    ]);
    holdings = (h ?? []) as Holding[];
    orders = (o ?? []) as Order[];
    mfHoldings = (m ?? []) as MFHolding[];
    mfOrders = (mo ?? []) as MFOrder[];
  } catch (e) {
    return {
      status: "kite_error",
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // ── Today's stock numbers (delivery holdings only) ──────────
  const stockDayPnL = holdings.reduce(
    (s, h) =>
      s + (Number(h.last_price) - Number(h.close_price)) * Number(h.quantity),
    0,
  );
  const stockPrevValue = holdings.reduce(
    (s, h) => s + Number(h.close_price) * Number(h.quantity),
    0,
  );
  const stockPct =
    stockPrevValue > 0 ? (stockDayPnL / stockPrevValue) * 100 : null;

  // ── Snapshot today's MF units + avg cost for future back-fill ──
  const mfUnits: Record<string, { units: number; avg_price: number | null }> =
    {};
  for (const m of mfHoldings) {
    if (m.tradingsymbol && Number(m.quantity) > 0) {
      const ap = Number(m.average_price);
      mfUnits[m.tradingsymbol] = {
        units: Number(m.quantity),
        avg_price: Number.isFinite(ap) && ap > 0 ? ap : null,
      };
    }
  }
  const mfUnitsJson = Object.keys(mfUnits).length > 0 ? mfUnits : null;

  // ── Snapshot today's stock holdings (cost basis for future sells) ──
  const stockHoldings: StockSnapshot = {};
  for (const h of holdings) {
    if (h.tradingsymbol && Number(h.quantity) > 0) {
      stockHoldings[h.tradingsymbol] = {
        qty: Number(h.quantity),
        avg_price: Number(h.average_price) || 0,
      };
    }
  }
  const stockHoldingsJson =
    Object.keys(stockHoldings).length > 0 ? stockHoldings : null;

  // ── Back-fill via MFAPI ─────────────────────────────────────
  // Strategy: find the most recent prior investment_logs row for this user
  // that has mf_units snapshotted and mf_pct still null. For each fund in
  // its snapshot, fetch MFAPI for the last 10 days and grab the top 2 NAVs.
  // The target date to update = the max "latest NAV date" across those funds
  // (usually all funds publish on the same day). If that date matches the
  // row's logged_date, we're consistent; otherwise we still attribute to the
  // row (it's the closest anchor we have).
  let backfilledDate: string | null = null;

  const { data: candidateRows } = await admin
    .from("investment_logs")
    .select("id, logged_date, pnl_amount, mf_pct, mf_units")
    .eq("user_id", userId)
    .lt("logged_date", loggedDate)
    .is("mf_pct", null)
    .not("mf_units", "is", null)
    .order("logged_date", { ascending: false })
    .limit(1);
  const candidate = candidateRows?.[0];

  if (candidate && candidate.mf_units) {
    // Normalize both snapshot shapes (legacy number / new {units, avg_price}).
    const rawUnits = candidate.mf_units as Record<string, MFSnapshotValue>;
    const units: Record<string, number> = {};
    for (const [isin, v] of Object.entries(rawUnits)) {
      const q = snapshotUnits(v);
      if (q > 0) units[isin] = q;
    }
    const isins = Object.keys(units);

    // Resolve ISIN → scheme_code from mf_scheme_map (one round-trip).
    const { data: mapRows } = await admin
      .from("mf_scheme_map")
      .select("isin, scheme_code")
      .in("isin", isins);
    const schemeByIsin = new Map<string, string>();
    for (const r of mapRows ?? [])
      schemeByIsin.set(r.isin as string, r.scheme_code as string);

    // Fetch top-2 NAVs per fund in parallel.
    const results = await Promise.all(
      isins.map(async (isin) => {
        const schemeCode = schemeByIsin.get(isin);
        if (!schemeCode) return { isin, unmapped: true as const };
        const navs = await fetchTopTwoNavs(schemeCode, startDate, endDate);
        return { isin, schemeCode, navs, unmapped: false as const };
      }),
    );

    let mfDayPnL = 0;
    let prevValue = 0;
    let matched = 0;
    let unmapped = 0;
    let noData = 0;
    let latestNavDate: string | null = null;
    for (const r of results) {
      if (r.unmapped) {
        unmapped++;
        continue;
      }
      if (r.navs.length < 2) {
        noData++;
        continue;
      }
      const qty = Number(units[r.isin]);
      const navNew = r.navs[0].nav;
      const navOld = r.navs[1].nav;
      mfDayPnL += (navNew - navOld) * qty;
      prevValue += navOld * qty;
      matched++;
      if (!latestNavDate || r.navs[0].date > latestNavDate)
        latestNavDate = r.navs[0].date;
    }

    if (matched > 0 && latestNavDate) {
      const mfPct = prevValue > 0 ? (mfDayPnL / prevValue) * 100 : null;

      // Prefer to update the row that matches the latest NAV date. Fall back
      // to the candidate row if no matching row exists (shouldn't happen in
      // steady state but keeps the update from silently no-oping).
      const { data: navDateRows } = await admin
        .from("investment_logs")
        .select("id, pnl_amount")
        .eq("user_id", userId)
        .eq("logged_date", latestNavDate)
        .limit(1);
      const target = navDateRows?.[0] ?? {
        id: candidate.id,
        pnl_amount: candidate.pnl_amount,
      };
      const targetPnl = Number(target.pnl_amount) + mfDayPnL;

      const { error: updErr } = await admin
        .from("investment_logs")
        .update({
          pnl_amount: Math.round(targetPnl * 100) / 100,
          mf_pct: mfPct != null ? Math.round(mfPct * 100) / 100 : null,
        })
        .eq("id", target.id);

      if (updErr) {
        console.error(
          `[KITE-SYNC-PNL] Backfill update failed for ${userId.slice(0, 8)}:`,
          updErr.message,
        );
      } else {
        backfilledDate = latestNavDate;
        console.log(
          `[KITE-SYNC-PNL] ${userId.slice(0, 8)}... backfilled ${latestNavDate} (matched ${matched}, unmapped ${unmapped}, no-data ${noData}, mfPnL=${mfDayPnL.toFixed(2)})`,
        );
      }
    } else {
      console.log(
        `[KITE-SYNC-PNL] ${userId.slice(0, 8)}... no back-fill (matched ${matched}, unmapped ${unmapped}, no-data ${noData})`,
      );
    }
  }

  // ── Write today's row ────────────────────────────────────────
  const pnlAmount = Math.round(stockDayPnL * 100) / 100;
  const stockRounded =
    stockPct != null ? Math.round(stockPct * 100) / 100 : null;
  const niftyRounded =
    niftyPct != null ? Math.round(niftyPct * 100) / 100 : null;

  const { error: upsertErr } = await admin.from("investment_logs").upsert(
    {
      user_id: userId,
      logged_date: loggedDate,
      pnl_amount: pnlAmount,
      stock_pct: stockRounded,
      mf_pct: null,
      nifty50_pct: niftyRounded,
      mf_units: mfUnitsJson,
      stock_holdings: stockHoldingsJson,
    },
    { onConflict: "user_id,logged_date" },
  );

  if (upsertErr) return { status: "save_error", error: upsertErr.message };

  // ── Realised P&L (stock sells today + MF redemptions completed) ──
  let prevSnapshot: StockSnapshot | null = null;
  if (orders.some(isCompletedCncSell)) {
    const { data: prevRows } = await admin
      .from("investment_logs")
      .select("stock_holdings")
      .eq("user_id", userId)
      .lt("logged_date", loggedDate)
      .not("stock_holdings", "is", null)
      .order("logged_date", { ascending: false })
      .limit(1);
    prevSnapshot = (prevRows?.[0]?.stock_holdings as StockSnapshot) ?? null;
  }

  const stockRealised = computeStockRealisedTrades(
    userId,
    loggedDate,
    orders,
    holdings,
    prevSnapshot,
  );
  const mfRealised = await computeMfRealisedTrades(
    admin,
    userId,
    mfOrders,
    mfHoldings,
    loggedDate,
  );
  const allSkipped = [...stockRealised.skipped, ...mfRealised.skipped];
  if (allSkipped.length > 0) {
    console.warn(
      `[KITE-SYNC-PNL] ${userId.slice(0, 8)}... no cost basis for sells: ${allSkipped.join(", ")}`,
    );
  }

  const realisedTrades = [...stockRealised.trades, ...mfRealised.trades];
  const persistErr = await persistRealisedTrades(admin, userId, realisedTrades);
  if (persistErr) {
    console.error(
      `[KITE-SYNC-PNL] Realised persist failed for ${userId.slice(0, 8)}:`,
      persistErr,
    );
  }

  return {
    status: "ok",
    pnl: pnlAmount,
    backfilledDate,
    realisedTrades: realisedTrades.length,
    realisedTotal: round2(
      realisedTrades.reduce((s, t) => s + t.realised_pnl, 0),
    ),
  };
}

Deno.serve(async (_req) => {
  const startTime = Date.now();
  const now = moment().tz(TZ);
  const dayOfWeek = now.day();
  const loggedDate = now.format("YYYY-MM-DD");
  const startDate = now
    .clone()
    .subtract(MFAPI_LOOKBACK_DAYS, "days")
    .format("YYYY-MM-DD");

  console.log(
    `[KITE-SYNC-PNL] Invoked | IST: ${now.format("YYYY-MM-DD HH:mm:ss")} | Day: ${dayOfWeek} | MFAPI range: ${startDate}..${loggedDate}`,
  );

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log("[KITE-SYNC-PNL] Weekend — skipping");
    return new Response(
      JSON.stringify({ skipped: "weekend", elapsed: Date.now() - startTime }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const cutoff = moment.tz(
      now.format("YYYY-MM-DD") + " 06:00",
      "YYYY-MM-DD HH:mm",
      TZ,
    );
    const { data: creds, error: credsErr } = await admin
      .from("kite_credentials")
      .select("user_id, access_token, login_time");
    if (credsErr) throw credsErr;

    const fresh = (creds ?? []).filter(
      (c) =>
        c.access_token &&
        c.login_time &&
        moment(c.login_time).tz(TZ).isSameOrAfter(cutoff),
    );

    if (fresh.length === 0) {
      console.log("[KITE-SYNC-PNL] No users with fresh Kite tokens");
      return new Response(
        JSON.stringify({
          synced: 0,
          stale: (creds ?? []).length,
          elapsed: Date.now() - startTime,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const niftyPct = await fetchNiftyReturnPct();
    console.log(
      `[KITE-SYNC-PNL] Nifty 50 today: ${niftyPct?.toFixed(2) ?? "null"}%`,
    );

    let synced = 0;
    let backfilled = 0;
    let realisedTrades = 0;
    let kiteErrors = 0;
    let saveErrors = 0;

    for (const cred of fresh) {
      const result = await syncUser(
        admin,
        cred.user_id,
        cred.access_token,
        loggedDate,
        niftyPct,
        startDate,
        loggedDate,
      );
      const tag = cred.user_id.slice(0, 8);
      if (result.status === "ok") {
        synced++;
        if (result.backfilledDate) backfilled++;
        realisedTrades += result.realisedTrades;
        console.log(
          `[KITE-SYNC-PNL] ✓ ${tag}... pnl=${result.pnl}${result.backfilledDate ? ` (+backfill ${result.backfilledDate})` : ""}${result.realisedTrades > 0 ? ` (realised ${result.realisedTrades} trades = ${result.realisedTotal})` : ""}`,
        );
      } else if (result.status === "kite_error") {
        kiteErrors++;
        console.error(`[KITE-SYNC-PNL] ✗ kite ${tag}... ${result.error}`);
      } else {
        saveErrors++;
        console.error(`[KITE-SYNC-PNL] ✗ save ${tag}... ${result.error}`);
      }
    }

    const summary = {
      synced,
      backfilled,
      realised_trades: realisedTrades,
      kite_errors: kiteErrors,
      save_errors: saveErrors,
      fresh_users: fresh.length,
      total_creds: (creds ?? []).length,
      nifty_pct: niftyPct,
      elapsed: Date.now() - startTime,
    };
    console.log("[KITE-SYNC-PNL] Done:", JSON.stringify(summary));
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[KITE-SYNC-PNL] Fatal:", e);
    return new Response(
      JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
