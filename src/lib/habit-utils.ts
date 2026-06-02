import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns"
import type {
  Habit,
  HabitLog,
  DayOfWeek,
  HeatmapLevel,
} from "@/types/habits"
import { WEEKDAY_DAYS } from "@/types/habits"

const DAY_MAP: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
}

export function dateToDayOfWeek(date: Date): DayOfWeek {
  return DAY_MAP[date.getDay()]
}

export function isHabitDueOnDate(habit: Habit, date: Date): boolean {
  switch (habit.frequency_type) {
    case "daily":
      return true
    case "weekdays":
      return WEEKDAY_DAYS.includes(dateToDayOfWeek(date))
    case "specific_days":
      return habit.frequency_days.includes(dateToDayOfWeek(date))
    case "times_per_week":
      return true // any day counts
  }
}

export function getHabitsDueToday(habits: Habit[]): Habit[] {
  const today = new Date()
  return habits.filter((h) => !h.archived && isHabitDueOnDate(h, today))
}

export function calculateCurrentStreak(
  habit: Habit,
  logs: HabitLog[],
): number {
  const logDates = new Set(logs.map((l) => l.logged_date))
  const today = new Date()
  let streak = 0
  let date = today

  // If today is due but not done, start from yesterday
  const todayStr = format(today, "yyyy-MM-dd")
  if (isHabitDueOnDate(habit, today) && !logDates.has(todayStr)) {
    date = subDays(today, 1)
  }

  if (habit.frequency_type === "times_per_week") {
    return calculateWeeklyStreak(habit, logs)
  }

  // Walk backwards counting consecutive completed due-days
  for (let i = 0; i < 365; i++) {
    const dateStr = format(date, "yyyy-MM-dd")

    // Check if habit was created after this date
    if (isBefore(date, startOfDay(new Date(habit.created_at)))) break

    if (isHabitDueOnDate(habit, date)) {
      if (logDates.has(dateStr)) {
        streak++
      } else {
        break
      }
    }
    // Skip non-due days silently
    date = subDays(date, 1)
  }

  return streak
}

function calculateWeeklyStreak(habit: Habit, logs: HabitLog[]): number {
  const target = habit.frequency_count
  let streak = 0
  let weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  // Check current week — if not yet met target, start from last week
  const currentWeekLogs = logs.filter((l) => {
    const d = new Date(l.logged_date)
    return !isBefore(d, weekStart) && !isAfter(d, endOfWeek(weekStart, { weekStartsOn: 1 }))
  })
  if (currentWeekLogs.length < target) {
    weekStart = subDays(weekStart, 7)
  }

  for (let i = 0; i < 52; i++) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    if (isBefore(weekStart, startOfDay(new Date(habit.created_at)))) break

    const weekLogs = logs.filter((l) => {
      const d = new Date(l.logged_date)
      return !isBefore(d, weekStart) && !isAfter(d, weekEnd)
    })

    if (weekLogs.length >= target) {
      streak++
    } else {
      break
    }
    weekStart = subDays(weekStart, 7)
  }

  return streak
}

export function calculateBestStreak(
  habit: Habit,
  logs: HabitLog[],
): number {
  if (logs.length === 0) return 0

  if (habit.frequency_type === "times_per_week") {
    return calculateBestWeeklyStreak(habit, logs)
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.logged_date).getTime() - new Date(b.logged_date).getTime(),
  )

  const logDates = new Set(sortedLogs.map((l) => l.logged_date))
  const startDate = new Date(sortedLogs[0].logged_date)
  const endDate = new Date(sortedLogs[sortedLogs.length - 1].logged_date)
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  let best = 0
  let current = 0

  for (const day of allDays) {
    if (!isHabitDueOnDate(habit, day)) continue

    if (logDates.has(format(day, "yyyy-MM-dd"))) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }

  return best
}

function calculateBestWeeklyStreak(habit: Habit, logs: HabitLog[]): number {
  if (logs.length === 0) return 0

  const target = habit.frequency_count
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.logged_date).getTime() - new Date(b.logged_date).getTime(),
  )

  let weekStart = startOfWeek(new Date(sortedLogs[0].logged_date), { weekStartsOn: 1 })
  const lastDate = new Date(sortedLogs[sortedLogs.length - 1].logged_date)
  let best = 0
  let current = 0

  while (!isAfter(weekStart, lastDate)) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const weekLogs = logs.filter((l) => {
      const d = new Date(l.logged_date)
      return !isBefore(d, weekStart) && !isAfter(d, weekEnd)
    })

    if (weekLogs.length >= target) {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }

    weekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  return best
}

export function calculateCompletionRate(
  habit: Habit,
  logs: HabitLog[],
  startDate: Date,
  endDate: Date,
): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const dueDays = days.filter((d) => isHabitDueOnDate(habit, d))
  if (dueDays.length === 0) return 0

  const logDates = new Set(logs.map((l) => l.logged_date))
  const completed = dueDays.filter((d) =>
    logDates.has(format(d, "yyyy-MM-dd")),
  ).length

  return Math.round((completed / dueDays.length) * 100)
}

export function getHeatmapData(
  logs: HabitLog[],
  startDate: Date,
  endDate: Date,
  habit?: Habit,
): Map<string, HeatmapLevel> {
  const map = new Map<string, HeatmapLevel>()
  const logDates = new Set(logs.map((l) => l.logged_date))
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd")
    const hasLog = logDates.has(dateStr)

    if (habit) {
      // Single habit: due & done = 4, due & not done = 1, not due = 0
      const isDue = isHabitDueOnDate(habit, day)
      if (!isDue) {
        map.set(dateStr, 0)
      } else if (hasLog) {
        map.set(dateStr, 4)
      } else {
        // Only mark as missed if the day is in the past
        map.set(dateStr, isBefore(day, startOfDay(new Date())) ? 1 : 0)
      }
    } else {
      // Overall: just based on whether any log exists
      map.set(dateStr, hasLog ? 4 : 0)
    }
  }

  return map
}

export function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequency_type) {
    case "daily":
      return "Every day"
    case "weekdays":
      return "Weekdays"
    case "specific_days":
      return habit.frequency_days
        .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
        .join(", ")
    case "times_per_week":
      return `${habit.frequency_count}x per week`
  }
}
