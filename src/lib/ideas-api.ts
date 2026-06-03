import { supabase } from "./supabase";
import type { Idea, IdeaFormData } from "@/types/ideas";

export async function fetchIdeas(userId: string): Promise<Idea[]> {
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Idea[];
}

export async function createIdea(
  userId: string,
  formData: IdeaFormData,
): Promise<Idea> {
  const { data, error } = await supabase
    .from("ideas")
    .insert({
      user_id: userId,
      title: formData.title,
      description: formData.description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Idea;
}

export async function updateIdea(
  ideaId: string,
  formData: Partial<IdeaFormData>,
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (formData.title !== undefined) updates.title = formData.title;
  if (formData.description !== undefined)
    updates.description = formData.description || null;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("ideas")
      .update(updates)
      .eq("id", ideaId);
    if (error) throw error;
  }
}

export async function deleteIdea(ideaId: string): Promise<void> {
  const { error } = await supabase.from("ideas").delete().eq("id", ideaId);
  if (error) throw error;
}

export async function togglePin(
  ideaId: string,
  pinned: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("ideas")
    .update({ pinned })
    .eq("id", ideaId);
  if (error) throw error;
}
