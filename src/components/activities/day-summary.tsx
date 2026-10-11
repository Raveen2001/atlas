import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/activity-utils"
import type { RangeSummary } from "@/lib/activity-utils"
import { RATING_OPTIONS } from "@/types/activities"
import type { CategoryLookup } from "@/types/activities"

interface DaySummaryProps {
  summary: RangeSummary
  getCategory: CategoryLookup
}

export function DaySummary({ summary, getCategory }: DaySummaryProps) {
  const { logged, byRating, byCategory, untracked } = summary
  const pct = (m: number) => (logged > 0 ? Math.round((m / logged) * 100) : 0)
  const maxCategory = byCategory[0]?.minutes ?? 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Logged" value={formatDuration(logged)} />
        <StatCard
          label="Productive"
          value={formatDuration(byRating.productive)}
          sub={logged > 0 ? `${pct(byRating.productive)}% of logged` : undefined}
          valueColor="text-green-600"
        />
        <StatCard
          label="Wasted"
          value={formatDuration(byRating.wasted)}
          sub={logged > 0 ? `${pct(byRating.wasted)}% of logged` : undefined}
          valueColor="text-red-600"
        />
        <StatCard
          label="Untracked"
          value={formatDuration(untracked)}
          valueColor="text-muted-foreground"
        />
      </div>

      {logged > 0 && (
        <div className="space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {RATING_OPTIONS.map((r) =>
              byRating[r.value] > 0 ? (
                <div
                  key={r.value}
                  style={{
                    width: `${(byRating[r.value] / logged) * 100}%`,
                    backgroundColor: r.color,
                  }}
                  title={`${r.label}: ${formatDuration(byRating[r.value])}`}
                />
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {RATING_OPTIONS.map((r) => (
              <span
                key={r.value}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                {r.label} {formatDuration(byRating[r.value])}
              </span>
            ))}
          </div>
        </div>
      )}

      {byCategory.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            By category
          </h2>
          {byCategory.map(({ category, minutes }) => {
            const cat = getCategory(category)
            const Icon = cat.icon
            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" style={{ color: cat.color }} />
                  <span className="flex-1">{cat.label}</span>
                  <span className="font-mono text-xs">
                    {formatDuration(minutes)}
                  </span>
                  <span className="w-9 text-right text-xs text-muted-foreground">
                    {pct(minutes)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxCategory > 0 ? (minutes / maxCategory) * 100 : 0}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string
  value: string
  sub?: string
  valueColor?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <p className={`text-xl font-bold font-mono ${valueColor ?? ""}`}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}
