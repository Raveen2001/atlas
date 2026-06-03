import { supabase } from "./supabase";
import type {
  InvestmentLog,
  InvestmentSettings,
  InvestmentFormData,
  InvestmentSettingsFormData,
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
  })) as InvestmentLog[];
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
        note: formData.note || null,
      },
      { onConflict: "user_id,logged_date" },
    )
    .select()
    .single();

  if (error) throw error;
  return { ...data, pnl_amount: Number(data.pnl_amount) } as InvestmentLog;
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
