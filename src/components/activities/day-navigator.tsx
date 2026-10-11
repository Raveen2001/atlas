import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameWeek,
  isToday,
  isYesterday,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DayNavigatorProps {
  mode: "day" | "week"
  /** Selected day; in week mode, any day in the selected week. */
  date: Date
  onChange: (date: Date) => void
}

const WEEK_OPTS = { weekStartsOn: 1 } as const

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEE, d MMM")
}

export function DayNavigator({ mode, date, onChange }: DayNavigatorProps) {
  const today = startOfDay(new Date())
  const isCurrent =
    mode === "day" ? isSameDay(date, today) : isSameWeek(date, today, WEEK_OPTS)

  const step = (dir: 1 | -1) => {
    const next = mode === "day" ? addDays(date, dir) : addWeeks(date, dir)
    onChange(next > today ? today : next)
  }

  const label =
    mode === "day"
      ? dayLabel(date)
      : `${format(startOfWeek(date, WEEK_OPTS), "d MMM")} – ${format(endOfWeek(date, WEEK_OPTS), "d MMM")}`

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label={mode === "day" ? "Previous day" : "Previous week"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px] text-center">
          {label}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={isCurrent}
          className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={mode === "day" ? "Next day" : "Next week"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="text-xs font-medium text-primary hover:underline"
        >
          {mode === "day" ? "Today" : "This week"}
        </button>
      )}
    </div>
  )
}