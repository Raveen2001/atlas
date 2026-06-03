export type Recurrence = "once" | "daily" | "weekdays"

export interface Reminder {
  id: string
  user_id: string
  title: string
  note: string | null
  remind_time: string // "HH:MM:SS"
  remind_date: string | null // "YYYY-MM-DD" for one-off
  recurrence: Recurrence
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ReminderFormData {
  title: string
  note: string
  remind_time: string // "HH:MM"
  remind_date: string | null
  recurrence: Recurrence
}

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
]
