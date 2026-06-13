import { format, parseISO } from "date-fns"
import { ChevronRight, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { TrackerCategorySummary } from "@/types/tracker"

interface CategoryCardProps {
  summary: TrackerCategorySummary
  onClick: () => void
}

function formatValue(v: number): string {
  if (Number.isInteger(v)) return v.toString()
  return parseFloat(v.toFixed(2)).toString()
}

export function CategoryCard({ summary, onClick }: CategoryCardProps) {
  const { category, latestValue, latestDate, measurementCount, trend } = summary

  const TrendIcon =
    trend === null || trend === 0
      ? Minus
      : trend > 0
      ? TrendingUp
      : TrendingDown
  const trendColor =
    trend === null || trend === 0
      ? "text-muted-foreground"
      : trend > 0
      ? "text-green-600 dark:text-green-500"
      : "text-red-600 dark:text-red-500"

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{category.name}</h3>
          <span className="text-xs text-muted-foreground">
            {category.unit}
          </span>
        </div>
        {latestValue !== null && latestDate ? (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono">
              {formatValue(latestValue)}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(latestDate), "MMM d")}
            </span>
            {trend !== null && (
              <span
                className={`text-xs font-mono flex items-center gap-0.5 ${trendColor}`}
              >
                <TrendIcon className="h-3 w-3" />
                {trend > 0 ? "+" : ""}
                {formatValue(trend)}
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            No measurements yet
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {measurementCount} {measurementCount === 1 ? "entry" : "entries"}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}
