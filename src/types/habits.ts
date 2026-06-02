export type HabitFrequency =
  | "daily"
  | "weekdays"
  | "specific_days"
  | "times_per_week"

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  frequency_type: HabitFrequency
  frequency_days: DayOfWeek[]
  frequency_count: number
  reminder_time: string | null
  color: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  logged_date: string
  created_at: string
}

export interface HabitWithStats extends Habit {
  logs: HabitLog[]
  currentStreak: number
  bestStreak: number
  completedToday: boolean
}

export interface HabitFormData {
  name: string
  description: string
  frequency_type: HabitFrequency
  frequency_days: DayOfWeek[]
  frequency_count: number
  reminder_time: string | null
  color: string
}

export const FREQUENCY_CONFIG: Record<
  HabitFrequency,
  { label: string; description: string }
> = {
  daily: { label: "Every day", description: "Due every single day" },
  weekdays: { label: "Weekdays", description: "Monday through Friday" },
  specific_days: { label: "Specific days", description: "Choose which days" },
  times_per_week: {
    label: "Times per week",
    description: "Flexible scheduling",
  },
}

export const DAYS_OF_WEEK: {
  value: DayOfWeek
  label: string
  short: string
}[] = [
  { value: "mon", label: "Monday", short: "M" },
  { value: "tue", label: "Tuesday", short: "T" },
  { value: "wed", label: "Wednesday", short: "W" },
  { value: "thu", label: "Thursday", short: "T" },
  { value: "fri", label: "Friday", short: "F" },
  { value: "sat", label: "Saturday", short: "S" },
  { value: "sun", label: "Sunday", short: "S" },
]

export const WEEKDAY_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"]

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4
