export type TaskStatus = "todo" | "in_progress" | "done" | "blocked"
export type TaskPriority = "high" | "medium" | "low"

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type RecurrenceType = "weekly" | "monthly"

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  position: number
  completed_at: string | null
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  recurrence_start_day: number | null
  recurrence_due_offset: number | null
  next_recurrence_date: string | null
  created_at: string
  updated_at: string
  tags: Tag[]
  comment_count: number
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  tag_ids: string[]
  is_recurring: boolean
  recurrence_type: RecurrenceType | null
  recurrence_start_day: number | null
  recurrence_due_offset: number | null
}

export const WEEKDAY_LABELS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Monday", short: "M" },
  { value: 2, label: "Tuesday", short: "T" },
  { value: 3, label: "Wednesday", short: "W" },
  { value: 4, label: "Thursday", short: "T" },
  { value: 5, label: "Friday", short: "F" },
  { value: 6, label: "Saturday", short: "S" },
  { value: 7, label: "Sunday", short: "S" },
]

export const KANBAN_COLUMNS: TaskStatus[] = [
  "todo",
  "blocked",
  "in_progress",
  "done",
]

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: "Todo", color: "text-muted-foreground" },
  in_progress: { label: "In Progress", color: "text-blue-600" },
  done: { label: "Done", color: "text-green-600" },
  blocked: { label: "Blocked", color: "text-red-600" },
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; borderColor: string }
> = {
  high: { label: "High", borderColor: "border-l-red-500" },
  medium: { label: "Medium", borderColor: "border-l-amber-500" },
  low: { label: "Low", borderColor: "" },
}
