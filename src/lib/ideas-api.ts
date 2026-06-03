import { supabase } from "./supabase";
import type { Idea, IdeaFormData, IdeaComment } from "@/types/ideas";

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
      status: formData.status,
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
  if (formData.status !== undefined) updates.status = formData.status;

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

// ── Comments ────────────────────────────────────────────────

export async function fetchIdeaComments(
  ideaId: string,
): Promise<IdeaComment[]> {
  const { data, error } = await supabase
    .from("idea_comments")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as IdeaComment[];
}

export async function addIdeaComment(
  ideaId: string,
  userId: string,
  content: string,
): Promise<IdeaComment> {
  const { data, error } = await supabase
    .from("idea_comments")
    .insert({ idea_id: ideaId, user_id: userId, content })
    .select()
    .single();

  if (error) throw error;
  return data as IdeaComment;
}

export async function deleteIdeaComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("idea_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}
