import { supabase } from "./supabase"
import type {
  TrackerCategory,
  TrackerMeasurement,
  TrackerCategoryFormData,
  TrackerMeasurementFormData,
} from "@/types/tracker"

// ── Categories ──────────────────────────────────────────────

export async function fetchTrackerCategories(
  userId: string,
): Promise<TrackerCategory[]> {
  const { data, error } = await supabase
    .from("tracker_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as TrackerCategory[]
}

export async function createTrackerCategory(
  userId: string,
  formData: TrackerCategoryFormData,
): Promise<TrackerCategory> {
  const { data, error } = await supabase
    .from("tracker_categories")
    .insert({
      user_id: userId,
      name: formData.name.trim(),
      unit: formData.unit.trim(),
      note: formData.note.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as TrackerCategory
}

export async function updateTrackerCategory(
  categoryId: string,
  formData: TrackerCategoryFormData,
): Promise<void> {
  const { error } = await supabase
    .from("tracker_categories")
    .update({
      name: formData.name.trim(),
      unit: formData.unit.trim(),
      note: formData.note.trim() || null,
    })
    .eq("id", categoryId)

  if (error) throw error
}

export async function deleteTrackerCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from("tracker_categories")
    .delete()
    .eq("id", categoryId)
  if (error) throw error
}

// ── Measurements ────────────────────────────────────────────

export async function fetchTrackerMeasurements(
  userId: string,
): Promise<TrackerMeasurement[]> {
  const { data, error } = await supabase
    .from("tracker_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("measured_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    value: Number(row.value),
  })) as TrackerMeasurement[]
}

export async function createTrackerMeasurement(
  userId: string,
  categoryId: string,
  formData: TrackerMeasurementFormData,
): Promise<TrackerMeasurement> {
  const { data, error } = await supabase
    .from("tracker_measurements")
    .insert({
      user_id: userId,
      category_id: categoryId,
      value: formData.value,
      measured_date: formData.measured_date,
      note: formData.note.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return { ...data, value: Number(data.value) } as TrackerMeasurement
}

export async function updateTrackerMeasurement(
  measurementId: string,
  formData: TrackerMeasurementFormData,
): Promise<void> {
  const { error } = await supabase
    .from("tracker_measurements")
    .update({
      value: formData.value,
      measured_date: formData.measured_date,
      note: formData.note.trim() || null,
    })
    .eq("id", measurementId)

  if (error) throw error
}

export async function deleteTrackerMeasurement(
  measurementId: string,
): Promise<void> {
  const { error } = await supabase
    .from("tracker_measurements")
    .delete()
    .eq("id", measurementId)
  if (error) throw error
}
