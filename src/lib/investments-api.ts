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
  return (data ?? []).map((row) => ({
    ...row,
    pnl_amount: Number(row.pnl_amount),
    stock_pct: row.stock_pct != null ? Number(row.stock_pct) : null,
    mf_pct: row.mf_pct != null ? Number(row.mf_pct) : null,
    nifty50_pct: row.nifty50_pct != null ? Number(row.nifty50_pct) : null,
    realised_pnl: row.realised_pnl != null ? Number(row.realised_pnl) : null,
  })) as InvestmentLog[];
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
        stock_pct: formData.stock_pct ?? null,
        mf_pct: formData.mf_pct ?? null,
        nifty50_pct: formData.nifty50_pct ?? null,
        note: formData.note || null,
      },
      { onConflict: "user_id,logged_date" },
    )
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    pnl_amount: Number(data.pnl_amount),
    stock_pct: data.stock_pct != null ? Number(data.stock_pct) : null,
    mf_pct: data.mf_pct != null ? Number(data.mf_pct) : null,
    nifty50_pct: data.nifty50_pct != null ? Number(data.nifty50_pct) : null,
    realised_pnl: data.realised_pnl != null ? Number(data.realised_pnl) : null,
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
