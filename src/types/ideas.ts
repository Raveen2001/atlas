export type IdeaStatus = "new" | "exploring" | "in_progress" | "succeeded" | "dropped"

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  status: IdeaStatus
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface IdeaComment {
  id: string
  idea_id: string
  user_id: string
  content: string
  created_at: string
}

export interface IdeaFormData {
  title: string
  description: string
  status: IdeaStatus
}

export const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  exploring: { label: "Exploring", color: "bg-amber-500" },
  in_progress: { label: "In Progress", color: "bg-purple-500" },
  succeeded: { label: "Succeeded", color: "bg-green-500" },
  dropped: { label: "Dropped", color: "bg-red-500" },
}

export const IDEA_STATUSES: IdeaStatus[] = ["new", "exploring", "in_progress", "succeeded", "dropped"]
