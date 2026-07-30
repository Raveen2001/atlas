import { supabase } from "./supabase";
import type { StockSet, StockSnapshotEntry } from "./stock-utils";

export interface HoldingsSnapshot {
  snapshotDate: string; // "YYYY-MM-DD"
  holdings: Record<string, StockSnapshotEntry>;
}

// ── Holdings snapshot ───────────────────────────────────────

/** Latest snapshot row that actually has stock holdings. */
export async function fetchLatestHoldingsSnapshot(
  userId: string,
): Promise<HoldingsSnapshot | null> {
  const { data, error } = await supabase
    .from("kite_holdings_snapshots")
    .select("snapshot_date, stock_holdings")
    .eq("user_id", userId)
    .not("stock_holdings", "is", null)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;

  // jsonb numerics arrive as numbers, but coerce defensively.
  const holdings: Record<string, StockSnapshotEntry> = {};
  for (const [symbol, entry] of Object.entries(
    row.stock_holdings as Record<string, Record<string, unknown>>,
  )) {
    holdings[symbol] = {
      qty: Number(entry.qty) || 0,
      avg_price: Number(entry.avg_price) || 0,
      last_price: Number(entry.last_price) || 0,
      close_price: Number(entry.close_price) || 0,
    };
  }
  return { snapshotDate: row.snapshot_date as string, holdings };
}

// ── Stock sets CRUD ─────────────────────────────────────────

export async function fetchStockSets(userId: string): Promise<StockSet[]> {
  const { data, error } = await supabase
    .from("stock_sets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StockSet[];
}

export async function createStockSet(
  userId: string,
  name: string,
  symbols: string[],
): Promise<StockSet> {
  const { data, error } = await supabase
    .from("stock_sets")
    .insert({ user_id: userId, name, symbols })
    .select()
    .single();

  if (error) throw error;
  return data as StockSet;
}

export async function updateStockSet(
  setId: string,
  patch: { name?: string; symbols?: string[] },
): Promise<StockSet> {
  const { data, error } = await supabase
    .from("stock_sets")
    .update(patch)
    .eq("id", setId)
    .select()
    .single();

  if (error) throw error;
  return data as StockSet;
}

export async function deleteStockSet(setId: string): Promise<void> {
  const { error } = await supabase.from("stock_sets").delete().eq("id", setId);
  if (error) throw error;
}

/** Postgres unique-violation → duplicate set name. */
export function isDuplicateNameError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}
