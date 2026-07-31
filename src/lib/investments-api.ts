import { supabase } from "./supabase";
import type {
  InvestmentLog,
  InvestmentSettings,
  InvestmentFormData,
  InvestmentSettingsFormData,
  RealisedTrade,
} from "@/types/investments";

// ── Fetch Logs ──────────────────────────────────────────────

export async function fetchInvestmentLogs(
  userId: string,
): Promise<InvestmentLog[]> {
  const { data, error } = await supabase
    .from("investment_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_date", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapInvestmentLog) as InvestmentLog[];
}

// ── Realised Trades ─────────────────────────────────────────

export async function fetchRealisedTrades(
  userId: string,
): Promise<RealisedTrade[]> {
  const { data, error } = await supabase
    .from("kite_realised_trades")
    .select("*")
    .eq("user_id", userId)
    .order("trade_date", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    avg_buy_price: Number(row.avg_buy_price),
    sell_price: Number(row.sell_price),
    realised_pnl: Number(row.realised_pnl),
  })) as RealisedTrade[];
}

// ── Log CRUD ────────────────────────────────────────────────

export async function upsertInvestmentLog(
  userId: string,
  formData: InvestmentFormData,
): Promise<InvestmentLog> {
  const { data, error } = await supabase
    .from("investment_logs")
    .upsert(
      {
        user_id: userId,
        logged_date: formData.logged_date,
        pnl_amount: formData.pnl_amount,
        stock_pnl: formData.stock_pnl ?? null,
        mf_pnl: formData.mf_pnl ?? null,
        stock_pct: formData.stock_pct ?? null,
        mf_pct: formData.mf_pct ?? null,
        nifty50_pct: formData.nifty50_pct ?? null,
        realised_pnl: formData.realised_pnl ?? null,
        realised_stock_pnl: formData.realised_stock_pnl ?? null,
        realised_mf_pnl: formData.realised_mf_pnl ?? null,
        note: formData.note || null,
      },
      { onConflict: "user_id,logged_date" },
    )
    .select()
    .single();

  if (error) throw error;
  return mapInvestmentLog(data);
}

// Supabase returns numeric columns as strings — coerce to numbers (null-safe).
function mapInvestmentLog(row: Record<string, unknown>): InvestmentLog {
  const num = (v: unknown) => (v != null ? Number(v) : null);
  return {
    ...row,
    pnl_amount: Number(row.pnl_amount),
    stock_pnl: num(row.stock_pnl),
    mf_pnl: num(row.mf_pnl),
    stock_pct: num(row.stock_pct),
    mf_pct: num(row.mf_pct),
    nifty50_pct: num(row.nifty50_pct),
    stock_base_value: num(row.stock_base_value),
    mf_base_value: num(row.mf_base_value),
    nifty_pnl: num(row.nifty_pnl),
    realised_pnl: num(row.realised_pnl),
    realised_stock_pnl: num(row.realised_stock_pnl),
    realised_mf_pnl: num(row.realised_mf_pnl),
  } as InvestmentLog;
}

export async function deleteInvestmentLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from("investment_logs")
    .delete()
    .eq("id", logId);
  if (error) throw error;
}

// ── Settings ────────────────────────────────────────────────

export async function fetchInvestmentSettings(
  userId: string,
): Promise<InvestmentSettings | null> {
  const { data, error } = await supabase
    .from("investment_settings")
    .select("*")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  return (data?.[0] as InvestmentSettings) ?? null;
}

export async function upsertInvestmentSettings(
  userId: string,
  formData: InvestmentSettingsFormData,
): Promise<void> {
  const { error } = await supabase.from("investment_settings").upsert(
    {
      user_id: userId,
      buy_reminder_enabled: formData.buy_reminder_enabled,
      buy_reminder_time: formData.buy_reminder_time + ":00",
      log_reminder_enabled: formData.log_reminder_enabled,
      log_reminder_time: formData.log_reminder_time + ":00",
      followup_enabled: formData.followup_enabled,
      end_of_day_time: formData.end_of_day_time + ":00",
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
