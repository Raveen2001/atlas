export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface IdeaFormData {
  title: string
  description: string
}
