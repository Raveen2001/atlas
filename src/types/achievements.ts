export type AchievementMediaType = "image" | "video"

export interface AchievementMedia {
  url: string
  path: string
  type: AchievementMediaType
}

export interface Achievement {
  id: string
  user_id: string
  title: string
  description: string | null
  achieved_date: string
  media: AchievementMedia[]
  created_at: string
  updated_at: string
}

export interface AchievementFormData {
  title: string
  description: string
  achieved_date: string
  media: AchievementMedia[]
}
