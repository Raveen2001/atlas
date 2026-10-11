import { supabase } from "./supabase";
import type {
  Activity,
  ActivityFormData,
  CustomCategory,
  CustomCategoryFormData,
  TimerFormData,
} from "@/types/activities";

function toRow(formData: ActivityFormData): Record<string, unknown> {
  return {
    title: formData.title,
    category: formData.category,
    rating: formData.rating,
    started_at: formData.started_at,
    ended_at: formData.ended_at,
    description: formData.description || null,
  };
}

/** Entries overlapping [from, to), including a timer still running. */
export async function fetchActivitiesInRange(
  userId: string,
  from: Date,
  to: Date,
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .lt("started_at", to.toISOString())
    .or(`ended_at.gt.${from.toISOString()},ended_at.is.null`)
    .order("started_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function fetchRunningActivity(
  userId: string,
): Promise<Activity | null> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as Activity | null) ?? null;
}

export async function createActivity(
  userId: string,
  formData: ActivityFormData,
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({ user_id: userId, ...toRow(formData) })
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function updateActivity(
  activityId: string,
  formData: ActivityFormData,
): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .update(toRow(formData))
    .eq("id", activityId);
  if (error) throw error;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);
  if (error) throw error;
}

export async function startTimer(
  userId: string,
  formData: TimerFormData,
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: userId,
      title: formData.title,
      category: formData.category,
      rating: formData.rating,
      started_at: new Date().toISOString(),
      ended_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Activity;
}

export async function stopTimer(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", activityId);
  if (error) throw error;
}

export async function fetchCustomCategories(
  userId: string,
): Promise<CustomCategory[]> {
  const { data, error } = await supabase
    .from("activity_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomCategory[];
}

export async function createCustomCategory(
  userId: string,
  formData: CustomCategoryFormData,
): Promise<CustomCategory> {
  const { data, error } = await supabase
    .from("activity_categories")
    .insert({ user_id: userId, ...formData })
    .select()
    .single();

  if (error) throw error;
  return data as CustomCategory;
}

export async function updateCustomCategory(
  categoryId: string,
  formData: CustomCategoryFormData,
): Promise<void> {
  const { error } = await supabase
    .from("activity_categories")
    .update(formData)
    .eq("id", categoryId);
  if (error) throw error;
}

/** Moves the category's activities to "other" before deleting it. */
export async function deleteCustomCategory(categoryId: string): Promise<void> {
  const { error: moveError } = await supabase
    .from("activities")
    .update({ category: "other" })
    .eq("category", categoryId);
  if (moveError) throw moveError;

  const { error } = await supabase
    .from("activity_categories")
    .delete()
    .eq("id", categoryId);
  if (error) throw error;
}
