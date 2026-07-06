import { format, subMonths, addMonths, startOfMonth, isSameMonth } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { InvestmentLog } from "@/types/investments"

interface MonthNavigatorProps {
  month: Date
  onMonthChange: (month: Date) => void
  logs: InvestmentLog[]
}

export function MonthNavigator({ month, onMonthChange, logs }: MonthNavigatorProps) {
  const today = new Date()
  const isCurrentMonth = isSameMonth(month, today)

  const earliestLog =
    logs.length > 0
      ? logs.reduce((a, b) => (a.logged_date < b.logged_date ? a : b))
      : null
  const earliestMonth = earliestLog
    ? startOfMonth(new Date(earliestLog.logged_date + "T00:00:00"))
    : startOfMonth(today)

  const canGoPrev = !isSameMonth(month, earliestMonth)
  const canGoNext = !isCurrentMonth

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onMonthChange(startOfMonth(subMonths(month, 1)))}
        disabled={!canGoPrev}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider min-w-[110px] text-center">
        {format(month, "MMMM yyyy")}
      </span>
      <button
        type="button"
        onClick={() => onMonthChange(startOfMonth(addMonths(month, 1)))}
        disabled={!canGoNext}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
