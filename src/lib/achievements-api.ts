import { supabase } from "./supabase"
import type {
  Achievement,
  AchievementFormData,
  AchievementMedia,
  AchievementMediaType,
} from "@/types/achievements"

const BUCKET = "achievement-media"

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as Achievement[]
}

export async function createAchievement(
  userId: string,
  formData: AchievementFormData,
): Promise<Achievement> {
  const { data, error } = await supabase
    .from("achievements")
    .insert({
      user_id: userId,
      title: formData.title,
      description: formData.description || null,
      achieved_date: formData.achieved_date,
      media: formData.media,
    })
    .select()
    .single()

  if (error) throw error
  return data as Achievement
}

export async function updateAchievement(
  achievementId: string,
  formData: Partial<AchievementFormData>,
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (formData.title !== undefined) updates.title = formData.title
  if (formData.description !== undefined)
    updates.description = formData.description || null
  if (formData.achieved_date !== undefined)
    updates.achieved_date = formData.achieved_date
  if (formData.media !== undefined) updates.media = formData.media

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("achievements")
      .update(updates)
      .eq("id", achievementId)
    if (error) throw error
  }
}

export async function deleteAchievement(achievementId: string): Promise<void> {
  const { error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", achievementId)
  if (error) throw error
}

// ── Media ──────────────────────────────────────────────────────

export async function uploadAchievementMedia(
  userId: string,
  file: File,
): Promise<AchievementMedia> {
  const type: AchievementMediaType = file.type.startsWith("video/")
    ? "video"
    : "image"

  const ext = file.name.split(".").pop() ?? (type === "video" ? "mp4" : "jpg")
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "")
  const path = `${userId}/${crypto.randomUUID()}.${safeExt}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path, type }
}

export async function deleteAchievementMedia(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
}
