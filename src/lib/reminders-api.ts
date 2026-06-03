import { supabase } from "./supabase";
import type { Reminder, ReminderFormData } from "@/types/reminders";

export async function fetchReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .order("remind_time");

  if (error) throw error;
  return (data ?? []) as Reminder[];
}

export async function createReminder(
  userId: string,
  formData: ReminderFormData,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      title: formData.title,
      note: formData.note || null,
      remind_time: formData.remind_time + ":00",
      remind_date: formData.recurrence === "once" ? formData.remind_date : null,
      recurrence: formData.recurrence,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Reminder;
}

export async function updateReminder(
  reminderId: string,
  formData: Partial<ReminderFormData>,
): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (formData.title !== undefined) updates.title = formData.title;
  if (formData.note !== undefined) updates.note = formData.note || null;
  if (formData.remind_time !== undefined)
    updates.remind_time = formData.remind_time + ":00";
  if (formData.remind_date !== undefined) updates.remind_date = formData.remind_date;
  if (formData.recurrence !== undefined) {
    updates.recurrence = formData.recurrence;
    if (formData.recurrence !== "once") updates.remind_date = null;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", reminderId);
    if (error) throw error;
  }
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId);
  if (error) throw error;
}

export async function toggleReminder(
  reminderId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("reminders")
    .update({ enabled })
    .eq("id", reminderId);
  if (error) throw error;
}
