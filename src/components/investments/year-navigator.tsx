import { ChevronLeft, ChevronRight } from "lucide-react"
import type { InvestmentLog } from "@/types/investments"

interface YearNavigatorProps {
  year: number
  onYearChange: (year: number) => void
  logs: InvestmentLog[]
}

export function YearNavigator({ year, onYearChange, logs }: YearNavigatorProps) {
  const currentYear = new Date().getFullYear()

  const earliestYear =
    logs.length > 0
      ? logs.reduce(
          (min, l) => Math.min(min, Number(l.logged_date.slice(0, 4))),
          currentYear,
        )
      : currentYear

  const canGoPrev = year > earliestYear
  const canGoNext = year < currentYear

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onYearChange(year - 1)}
        disabled={!canGoPrev}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous year"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider min-w-[64px] text-center">
        {year}
      </span>
      <button
        type="button"
        onClick={() => onYearChange(year + 1)}
        disabled={!canGoNext}
        className="p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next year"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
