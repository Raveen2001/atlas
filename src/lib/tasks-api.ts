import { supabase } from "./supabase"
import { computeNextRecurrenceDate } from "./recurrence-utils"
import type {
  Task,
  Tag,
  TaskComment,
  TaskFormData,
  TaskStatus,
} from "@/types/tasks"

function flattenTags(
  raw: { tag: Tag }[] | null,
): Tag[] {
  return raw?.map((t) => t.tag).filter(Boolean) ?? []
}

// ── Board Tasks ──────────────────────────────────────────────

export async function fetchBoardTasks(userId: string): Promise<Task[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, task_tags(tag:tags(*)), comment_count:task_comments(count)",
    )
    .eq("user_id", userId)
    .or(
      `status.neq.done,and(status.eq.done,completed_at.gt.${sevenDaysAgo.toISOString()})`,
    )
    .order("position")

  if (error) throw error

  return (data ?? []).map((t) => ({
    ...t,
    tags: flattenTags(t.task_tags as unknown as { tag: Tag }[]),
    comment_count: (t.comment_count as unknown as { count: number }[])?.[0]?.count ?? 0,
    task_tags: undefined,
  })) as Task[]
}

export async function fetchClosedTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, task_tags(tag:tags(*))")
    .eq("user_id", userId)
    .eq("status", "done")
    .order("completed_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((t) => ({
    ...t,
    tags: flattenTags(t.task_tags as unknown as { tag: Tag }[]),
    comment_count: 0,
    task_tags: undefined,
  })) as Task[]
}

// ── Task CRUD ────────────────────────────────────────────────

export async function createTask(
  userId: string,
  formData: TaskFormData,
): Promise<Task> {
  // Get max position for the target column
  const { data: maxPos } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .eq("status", formData.status)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const position = (maxPos?.position ?? 0) + 1000

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date,
      position,
      completed_at: formData.status === "done" ? new Date().toISOString() : null,
      is_recurring: formData.is_recurring ?? false,
      recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
      recurrence_start_day: formData.is_recurring ? formData.recurrence_start_day : null,
      recurrence_due_offset: formData.is_recurring ? formData.recurrence_due_offset : null,
    })
    .select()
    .single()

  if (error) throw error

  // Insert tags
  if (formData.tag_ids.length > 0) {
    const { error: tagError } = await supabase.from("task_tags").insert(
      formData.tag_ids.map((tag_id) => ({
        task_id: task.id,
        tag_id,
      })),
    )
    if (tagError) throw tagError
  }

  return { ...task, tags: [], comment_count: 0 } as Task
}

export async function updateTask(
  taskId: string,
  formData: Partial<TaskFormData>,
  previousStatus?: TaskStatus,
): Promise<void> {
  const updates: Record<string, unknown> = {}

  if (formData.title !== undefined) updates.title = formData.title
  if (formData.description !== undefined)
    updates.description = formData.description || null
  if (formData.priority !== undefined) updates.priority = formData.priority
  if (formData.due_date !== undefined) updates.due_date = formData.due_date

  if (formData.is_recurring !== undefined) {
    updates.is_recurring = formData.is_recurring
    updates.recurrence_type = formData.is_recurring ? formData.recurrence_type : null
    updates.recurrence_start_day = formData.is_recurring ? formData.recurrence_start_day : null
    updates.recurrence_due_offset = formData.is_recurring ? formData.recurrence_due_offset : null
  }

  if (formData.status !== undefined) {
    updates.status = formData.status
    if (formData.status === "done" && previousStatus !== "done") {
      updates.completed_at = new Date().toISOString()
    } else if (formData.status !== "done" && previousStatus === "done") {
      updates.completed_at = null
      updates.next_recurrence_date = null
    }
  }

  // Compute next_recurrence_date if moving to done and task is recurring
  if (formData.status === "done" && previousStatus !== "done") {
    // Fetch task to check recurring config
    const { data: task } = await supabase
      .from("tasks")
      .select("is_recurring, recurrence_type, recurrence_start_day, user_id")
      .eq("id", taskId)
      .single()

    const isRecurring = formData.is_recurring ?? task?.is_recurring
    const recType = formData.recurrence_type ?? task?.recurrence_type
    const startDay = formData.recurrence_start_day ?? task?.recurrence_start_day

    if (isRecurring && recType && startDay) {
      updates.next_recurrence_date = computeNextRecurrenceDate(recType, startDay)
    }

    // Auto-comment for recurring tasks
    if (isRecurring && task?.user_id) {
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      await addComment(taskId, task.user_id, `Completed on ${date}`)
    }
  }

  // Auto-comment for recurring tasks reopened manually
  if (formData.status !== undefined && formData.status !== "done" && previousStatus === "done") {
    const { data: task } = await supabase
      .from("tasks")
      .select("is_recurring, user_id")
      .eq("id", taskId)
      .single()

    if (task?.is_recurring && task?.user_id) {
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      await addComment(taskId, task.user_id, `Reopened on ${date} — not completed`)
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
    if (error) throw error
  }

  // Replace tags if provided
  if (formData.tag_ids !== undefined) {
    await supabase.from("task_tags").delete().eq("task_id", taskId)
    if (formData.tag_ids.length > 0) {
      const { error } = await supabase.from("task_tags").insert(
        formData.tag_ids.map((tag_id) => ({
          task_id: taskId,
          tag_id,
        })),
      )
      if (error) throw error
    }
  }
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number,
  previousStatus: TaskStatus,
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: newStatus,
    position: newPosition,
  }

  if (newStatus === "done" && previousStatus !== "done") {
    updates.completed_at = new Date().toISOString()

    // Check if task is recurring and compute next recurrence
    const { data: task } = await supabase
      .from("tasks")
      .select("is_recurring, recurrence_type, recurrence_start_day, user_id")
      .eq("id", taskId)
      .single()

    if (task?.is_recurring && task.recurrence_type && task.recurrence_start_day) {
      updates.next_recurrence_date = computeNextRecurrenceDate(
        task.recurrence_type,
        task.recurrence_start_day,
      )
    }

    // Auto-comment for recurring tasks
    if (task?.is_recurring && task?.user_id) {
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      await addComment(taskId, task.user_id, `Completed on ${date}`)
    }
  } else if (newStatus !== "done" && previousStatus === "done") {
    updates.completed_at = null
    updates.next_recurrence_date = null

    // Auto-comment for recurring tasks reopened manually
    const { data: task } = await supabase
      .from("tasks")
      .select("is_recurring, user_id")
      .eq("id", taskId)
      .single()

    if (task?.is_recurring && task?.user_id) {
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      await addComment(taskId, task.user_id, `Reopened on ${date} — not completed`)
    }
  }

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
  if (error) throw error
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) throw error
}

// ── Tags ─────────────────────────────────────────────────────

export async function fetchTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name")
  if (error) throw error
  return data ?? []
}

export async function createTag(
  userId: string,
  name: string,
  color: string,
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: userId, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase.from("tags").delete().eq("id", tagId)
  if (error) throw error
}

// ── Comments ─────────────────────────────────────────────────

export async function fetchComments(
  taskId: string,
): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at")
  if (error) throw error
  return data ?? []
}

export async function addComment(
  taskId: string,
  userId: string,
  content: string,
): Promise<TaskComment> {
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: userId, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)
  if (error) throw error
}
