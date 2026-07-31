import {
  addWeeks,
  endOfWeek,
  format,
  isSameWeek,
  startOfWeek,
  subWeeks,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { InvestmentLog } from "@/types/investments"

interface WeekNavigatorProps {
  /** Monday of the selected week. */
  week: Date
  onWeekChange: (week: Date) => void
  logs: InvestmentLog[]
}

export function WeekNavigator({ week, onWeekChange, logs }: WeekNavigatorProps) {
  const today = new Date()
  const isCurrentWeek = isSameWeek(week, today, { weekStartsOn: 1 })

  const earliestLog =
    logs.length > 0
      ? logs.reduce((a, b) => (a.logged_date < b.logged_date ? a : b))
      : null
  const earliestWeek = earliestLog
    ? startOfWeek(new Date(earliestLog.logged_date + "T00:00:00"), {
        weekStartsOn: 1,
      })
    : startOfWeek(today, { weekStartsOn: 1 })

  const canGoPrev = !isSameWeek(week, earliestWeek, { weekStartsOn: 1 })
  const canGoNext = !isCurrentWeek

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          onWeekChange(startOfWeek(subWeeks(week, 1), { weekStartsOn: 1 }))
        }
        disabled={!canGoPrev}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px] text-center">
        {format(week, "d MMM")} –{" "}
        {format(endOfWeek(week, { weekStartsOn: 1 }), "d MMM")}
      </span>
      <button
        type="button"
        onClick={() =>
          onWeekChange(startOfWeek(addWeeks(week, 1), { weekStartsOn: 1 }))
        }
        disabled={!canGoNext}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
