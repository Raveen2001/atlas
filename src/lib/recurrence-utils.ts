import { addDays, nextDay, format } from "date-fns"
import type { RecurrenceType } from "@/types/tasks"
import { WEEKDAY_LABELS } from "@/types/tasks"

// date-fns nextDay expects 0=Sun..6=Sat, our recurrence_start_day is 1=Mon..7=Sun
const toDateFnsDay = (day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  return (day % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function computeNextRecurrenceDate(
  type: RecurrenceType,
  startDay: number,
): string {
  const today = new Date()

  if (type === "weekly") {
    // Find the next occurrence of the given weekday after today
    const targetDayFns = toDateFnsDay(startDay)
    const next = nextDay(today, targetDayFns)
    return format(next, "yyyy-MM-dd")
  }

  if (type === "monthly") {
    // Find the next occurrence of the given day of month
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    if (currentDay < startDay) {
      // Later this month
      const next = new Date(currentYear, currentMonth, startDay)
      return format(next, "yyyy-MM-dd")
    } else {
      // Next month
      const next = new Date(currentYear, currentMonth + 1, startDay)
      return format(next, "yyyy-MM-dd")
    }
  }

  return format(addDays(today, 7), "yyyy-MM-dd")
}

export function computeDueDate(
  nextRecurrenceDate: string,
  offset: number,
): string {
  return format(addDays(new Date(nextRecurrenceDate), offset), "yyyy-MM-dd")
}

export function getRecurrenceLabel(
  type: RecurrenceType,
  startDay: number,
  dueOffset: number,
): string {
  if (type === "weekly") {
    const startLabel = WEEKDAY_LABELS.find((d) => d.value === startDay)?.label ?? "?"
    const dueDay = ((startDay - 1 + dueOffset) % 7) + 1
    const dueLabel = WEEKDAY_LABELS.find((d) => d.value === dueDay)?.label ?? "?"
    return `Every ${startLabel}, due by ${dueLabel}`
  }

  if (type === "monthly") {
    const suffix = getOrdinalSuffix(startDay)
    const dueDay = startDay + dueOffset
    const dueSuffix = getOrdinalSuffix(dueDay)
    return `Every ${startDay}${suffix}, due by ${dueDay}${dueSuffix}`
  }

  return ""
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
