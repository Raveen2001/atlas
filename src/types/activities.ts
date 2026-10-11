import {
  Briefcase,
  BookOpen,
  Dumbbell,
  HeartPulse,
  Home,
  Car,
  Users,
  Smartphone,
  Tv,
  Coffee,
  Moon,
  Circle,
  Tag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type PresetCategory =
  | "work"
  | "learning"
  | "exercise"
  | "health"
  | "chores"
  | "commute"
  | "social"
  | "social_media"
  | "entertainment"
  | "rest"
  | "sleep"
  | "other"

/** A preset key, or the id of a user-defined `activity_categories` row. */
export type ActivityCategory = string

export type ActivityRating = "productive" | "neutral" | "wasted"

export interface Activity {
  id: string
  user_id: string
  title: string
  category: ActivityCategory
  rating: ActivityRating
  started_at: string // ISO timestamp
  ended_at: string | null // null = timer running
  description: string | null
  created_at: string
  updated_at: string
}

export interface ActivityFormData {
  title: string
  category: ActivityCategory
  rating: ActivityRating
  started_at: string // ISO timestamp
  ended_at: string | null // ISO timestamp, null keeps a timer running
  description: string
}

export interface TimerFormData {
  title: string
  category: ActivityCategory
  rating: ActivityRating
}

export interface CustomCategory {
  id: string
  user_id: string
  name: string
  color: string
  default_rating: ActivityRating
  created_at: string
  updated_at: string
}

export interface CustomCategoryFormData {
  name: string
  color: string
  default_rating: ActivityRating
}

export interface CategoryOption {
  value: ActivityCategory
  label: string
  icon: LucideIcon
  color: string
  defaultRating: ActivityRating
  custom: boolean
}

export const PRESET_CATEGORIES: CategoryOption[] = [
  { value: "work", label: "Work", icon: Briefcase, color: "#2563eb", defaultRating: "productive", custom: false },
  { value: "learning", label: "Learning", icon: BookOpen, color: "#7c3aed", defaultRating: "productive", custom: false },
  { value: "exercise", label: "Exercise", icon: Dumbbell, color: "#16a34a", defaultRating: "productive", custom: false },
  { value: "health", label: "Health", icon: HeartPulse, color: "#0d9488", defaultRating: "neutral", custom: false },
  { value: "chores", label: "Chores", icon: Home, color: "#ca8a04", defaultRating: "neutral", custom: false },
  { value: "commute", label: "Commute", icon: Car, color: "#64748b", defaultRating: "neutral", custom: false },
  { value: "social", label: "Social", icon: Users, color: "#db2777", defaultRating: "neutral", custom: false },
  { value: "social_media", label: "Social media", icon: Smartphone, color: "#dc2626", defaultRating: "wasted", custom: false },
  { value: "entertainment", label: "Entertainment", icon: Tv, color: "#ea580c", defaultRating: "wasted", custom: false },
  { value: "rest", label: "Rest", icon: Coffee, color: "#a16207", defaultRating: "neutral", custom: false },
  { value: "sleep", label: "Sleep", icon: Moon, color: "#4f46e5", defaultRating: "neutral", custom: false },
  { value: "other", label: "Other", icon: Circle, color: "#71717a", defaultRating: "neutral", custom: false },
]

const OTHER_CATEGORY = PRESET_CATEGORIES[PRESET_CATEGORIES.length - 1]

export const CUSTOM_CATEGORY_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#16a34a",
  "#0d9488",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#4f46e5",
  "#64748b",
]

export function toCategoryOption(c: CustomCategory): CategoryOption {
  return {
    value: c.id,
    label: c.name,
    icon: Tag,
    color: c.color,
    defaultRating: c.default_rating,
    custom: true,
  }
}

export type CategoryLookup = (key: ActivityCategory) => CategoryOption

/** Unknown keys (e.g. a deleted custom category) resolve to "Other". */
export function buildCategoryLookup(options: CategoryOption[]): CategoryLookup {
  const map = new Map(options.map((o) => [o.value, o]))
  return (key) => map.get(key) ?? OTHER_CATEGORY
}

export const RATING_OPTIONS: {
  value: ActivityRating
  label: string
  color: string
}[] = [
  { value: "productive", label: "Productive", color: "#16a34a" },
  { value: "neutral", label: "Neutral", color: "#a1a1aa" },
  { value: "wasted", label: "Wasted", color: "#dc2626" },
]

export const RATING_COLORS: Record<ActivityRating, string> =
  Object.fromEntries(RATING_OPTIONS.map((r) => [r.value, r.color])) as Record<
    ActivityRating,
    string
  >
