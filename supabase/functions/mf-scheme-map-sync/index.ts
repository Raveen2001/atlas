import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
const UPSERT_CHUNK = 500;

type MapRow = {
  isin: string;
  scheme_code: string;
  scheme_name: string | null;
  isin_type: "growth_or_payout" | "div_reinvest";
  updated_at: string;
};

// AMFI NAVAll.txt format (semicolon-delimited):
//   Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
// Fund lines have exactly 6 fields. Section headers (AMC names, category
// names) have 0 or 1 semicolons — skip them.
function parseAmfiText(text: string): MapRow[] {
  const rows: MapRow[] = [];
  const now = new Date().toISOString();
  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(";");
    if (parts.length !== 6) continue; // header, blank, or malformed
    const [schemeCode, isinGrowth, isinDivReinvest, schemeName] = parts.map(
      (p) => p.trim(),
    );
    if (!schemeCode || !/^\d+$/.test(schemeCode)) continue; // skip header row
    if (isinGrowth && isinGrowth !== "-") {
      rows.push({
        isin: isinGrowth,
        scheme_code: schemeCode,
        scheme_name: schemeName || null,
        isin_type: "growth_or_payout",
        updated_at: now,
      });
    }
    if (isinDivReinvest && isinDivReinvest !== "-") {
      rows.push({
        isin: isinDivReinvest,
        scheme_code: schemeCode,
        scheme_name: schemeName || null,
        isin_type: "div_reinvest",
        updated_at: now,
      });
    }
  }
  return rows;
}

Deno.serve(async (_req) => {
  const startTime = Date.now();
  console.log(`[MF-SCHEME-MAP-SYNC] Invoked | fetching ${AMFI_URL}`);

  try {
    const res = await fetch(AMFI_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/plain",
      },
    });
    if (!res.ok) {
      console.error(`[MF-SCHEME-MAP-SYNC] AMFI HTTP ${res.status}`);
      return new Response(
        JSON.stringify({
          error: `AMFI HTTP ${res.status}`,
          elapsed: Date.now() - startTime,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    const text = await res.text();
    console.log(`[MF-SCHEME-MAP-SYNC] Downloaded ${text.length} bytes`);

    const rows = parseAmfiText(text);

    // Same ISIN appearing twice in the file (rare, but possible for closed-end
    // schemes) would blow up the upsert with an ON CONFLICT collision within
    // a single request. Dedupe, keeping the last-seen row.
    const dedup = new Map<string, MapRow>();
    for (const r of rows) dedup.set(r.isin, r);
    const uniqueRows = [...dedup.values()];

    console.log(
      `[MF-SCHEME-MAP-SYNC] Parsed ${rows.length} rows (${uniqueRows.length} unique ISINs)`,
    );

    if (uniqueRows.length === 0) {
      return new Response(
        JSON.stringify({
          parsed: 0,
          message: "AMFI response returned no fund rows",
          elapsed: Date.now() - startTime,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let upserted = 0;
    let chunkErrors = 0;
    for (let i = 0; i < uniqueRows.length; i += UPSERT_CHUNK) {
      const chunk = uniqueRows.slice(i, i + UPSERT_CHUNK);
      const { error } = await admin
        .from("mf_scheme_map")
        .upsert(chunk, { onConflict: "isin" });
      if (error) {
        chunkErrors++;
        console.error(
          `[MF-SCHEME-MAP-SYNC] Chunk ${i}-${i + chunk.length} failed:`,
          error.message,
        );
      } else {
        upserted += chunk.length;
      }
    }

    const summary = {
      downloaded_bytes: text.length,
      parsed_rows: rows.length,
      unique_isins: uniqueRows.length,
      upserted,
      chunk_errors: chunkErrors,
      elapsed: Date.now() - startTime,
    };
    console.log("[MF-SCHEME-MAP-SYNC] Done:", JSON.stringify(summary));
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[MF-SCHEME-MAP-SYNC] Fatal:", e);
    return new Response(
      JSON.stringify({ error: String(e), elapsed: Date.now() - startTime }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
