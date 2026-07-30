// Pure derivation helpers for the stocks page. No supabase imports — the
// functions here are node-runnable for verification.
import type { RealisedTrade } from "@/types/investments"

/** Per-symbol shape stored in kite_holdings_snapshots.stock_holdings.
 * last_price/close_price are absent (or 0) on legacy rows. */
export interface StockSnapshotEntry {
  qty: number
  avg_price: number
  last_price?: number
  close_price?: number
}

export interface StockSet {
  id: string
  user_id: string
  name: string
  symbols: string[]
  created_at: string
  updated_at: string
}

export interface StockHolding {
  symbol: string
  qty: number
  avgPrice: number
  lastPrice: number | null
  invested: number
  marketValue: number | null
  unrealisedPnl: number | null
  unrealisedPct: number | null
  dayPnl: number | null
  dayPct: number | null
  allocationPct: number | null // share of priced market value
}

export interface SetAggregate {
  invested: number
  marketValue: number | null
  unrealisedPnl: number | null
  unrealisedPct: number | null
  dayPnl: number | null
  dayPct: number | null
  heldCount: number
}

/**
 * Derive display metrics for every held symbol (qty > 0). Price-derived
 * metrics are null when the snapshot predates price capture (0/absent price).
 * Sorted by market value desc; unpriced holdings last (by invested desc).
 */
export function deriveHoldings(
  snapshot: Record<string, StockSnapshotEntry>,
): StockHolding[] {
  const held = Object.entries(snapshot).filter(([, e]) => e.qty > 0)

  const holdings: StockHolding[] = held.map(([symbol, e]) => {
    const lastPrice = e.last_price && e.last_price > 0 ? e.last_price : null
    const closePrice = e.close_price && e.close_price > 0 ? e.close_price : null
    const invested = e.qty * e.avg_price
    const marketValue = lastPrice != null ? e.qty * lastPrice : null
    const unrealisedPnl = marketValue != null ? marketValue - invested : null
    const unrealisedPct =
      unrealisedPnl != null && invested > 0
        ? (unrealisedPnl / invested) * 100
        : null
    const dayPnl =
      lastPrice != null && closePrice != null
        ? (lastPrice - closePrice) * e.qty
        : null
    const dayPct =
      lastPrice != null && closePrice != null && closePrice > 0
        ? ((lastPrice - closePrice) / closePrice) * 100
        : null
    return {
      symbol,
      qty: e.qty,
      avgPrice: e.avg_price,
      lastPrice,
      invested,
      marketValue,
      unrealisedPnl,
      unrealisedPct,
      dayPnl,
      dayPct,
      allocationPct: null, // filled below once totals are known
    }
  })

  const totalPriced = holdings.reduce((s, h) => s + (h.marketValue ?? 0), 0)
  if (totalPriced > 0) {
    for (const h of holdings) {
      if (h.marketValue != null) {
        h.allocationPct = (h.marketValue / totalPriced) * 100
      }
    }
  }

  holdings.sort((a, b) => {
    if (a.marketValue != null && b.marketValue != null)
      return b.marketValue - a.marketValue
    if (a.marketValue != null) return -1
    if (b.marketValue != null) return 1
    return b.invested - a.invested
  })

  return holdings
}

/** Aggregate metrics across the held members of a set (unheld symbols are
 * ignored). Market-value metrics are null when no member is priced. */
export function aggregateSet(
  holdings: StockHolding[],
  symbols: string[],
): SetAggregate {
  const members = holdings.filter((h) => symbols.includes(h.symbol))
  const invested = members.reduce((s, h) => s + h.invested, 0)

  const priced = members.filter((h) => h.marketValue != null)
  const marketValue =
    priced.length > 0 ? priced.reduce((s, h) => s + h.marketValue!, 0) : null
  const pricedInvested = priced.reduce((s, h) => s + h.invested, 0)
  const unrealisedPnl = marketValue != null ? marketValue - pricedInvested : null
  const unrealisedPct =
    unrealisedPnl != null && pricedInvested > 0
      ? (unrealisedPnl / pricedInvested) * 100
      : null

  const dayMembers = members.filter((h) => h.dayPnl != null)
  const dayPnl =
    dayMembers.length > 0
      ? dayMembers.reduce((s, h) => s + h.dayPnl!, 0)
      : null
  // Day % over the previous-close value of the members that have day data.
  const prevValue = dayMembers.reduce(
    (s, h) => s + (h.marketValue! - h.dayPnl!),
    0,
  )
  const dayPct = dayPnl != null && prevValue > 0 ? (dayPnl / prevValue) * 100 : null

  return {
    invested,
    marketValue,
    unrealisedPnl,
    unrealisedPct,
    dayPnl,
    dayPct,
    heldCount: members.length,
  }
}

/** Holdings that belong to no set. */
export function partitionUngrouped(
  holdings: StockHolding[],
  sets: Pick<StockSet, "symbols">[],
): StockHolding[] {
  const grouped = new Set(sets.flatMap((s) => s.symbols))
  return holdings.filter((h) => !grouped.has(h.symbol))
}

/** Total booked (realised) P&L per stock symbol. */
export function bookedPnlBySymbol(
  trades: Pick<RealisedTrade, "kind" | "symbol" | "realised_pnl">[],
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const t of trades) {
    if (t.kind !== "stock") continue
    map[t.symbol] = (map[t.symbol] ?? 0) + t.realised_pnl
  }
  return map
}

/** Compact INR: ₹1.2Cr, ₹3.4L, ₹15k, ₹950. */
export function formatCompactInr(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}k`
  return `${sign}₹${abs.toFixed(0)}`
}
