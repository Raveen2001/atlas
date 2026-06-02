import { supabase } from "./supabase"
import { format } from "date-fns"
import type { Habit, HabitLog, HabitFormData } from "@/types/habits"

// ── Fetch Habits ────────────────────────────────────────────

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at")

  if (error) throw error
  return (data ?? []).map((h) => ({
    ...h,
    frequency_days: h.frequency_days ?? [],
  })) as Habit[]
}

// ── Habit CRUD ──────────────────────────────────────────────

export async function createHabit(
  userId: string,
  formData: HabitFormData,
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      name: formData.name,
      description: formData.description || null,
      frequency_type: formData.frequency_type,
      frequency_days: formData.frequency_days,
      frequency_count: formData.frequency_count,
      reminder_time: formData.reminder_time,
      color: formData.color,
    })
    .select()
    .single()

  if (error) throw error
  return { ...data, frequency_days: data.frequency_days ?? [] } as Habit
}

export async function updateHabit(
  habitId: string,
  formData: Partial<HabitFormData>,
): Promise<void> {
  const updates: Record<string, unknown> = {}

  if (formData.name !== undefined) updates.name = formData.name
  if (formData.description !== undefined)
    updates.description = formData.description || null
  if (formData.frequency_type !== undefined)
    updates.frequency_type = formData.frequency_type
  if (formData.frequency_days !== undefined)
    updates.frequency_days = formData.frequency_days
  if (formData.frequency_count !== undefined)
    updates.frequency_count = formData.frequency_count
  if (formData.reminder_time !== undefined)
    updates.reminder_time = formData.reminder_time
  if (formData.color !== undefined) updates.color = formData.color

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", habitId)
    if (error) throw error
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", habitId)
  if (error) throw error
}

export async function archiveHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .update({ archived: true })
    .eq("id", habitId)
  if (error) throw error
}

// ── Habit Logs ──────────────────────────────────────────────

export async function fetchAllHabitLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_date", startDate)
    .lte("logged_date", endDate)
    .order("logged_date")

  if (error) throw error
  return data ?? []
}

export async function fetchTodayLogs(userId: string): Promise<HabitLog[]> {
  const today = format(new Date(), "yyyy-MM-dd")
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("logged_date", today)

  if (error) throw error
  return data ?? []
}

export async function toggleHabitLog(
  habitId: string,
  userId: string,
  date: string,
): Promise<{ added: boolean }> {
  // Check if already logged
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habitId)
    .eq("logged_date", date)
    .single()

  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("id", existing.id)
    if (error) throw error
    return { added: false }
  } else {
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      user_id: userId,
      logged_date: date,
    })
    if (error) throw error
    return { added: true }
  }
}
