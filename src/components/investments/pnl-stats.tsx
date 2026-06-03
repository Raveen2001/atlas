import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import type { InvestmentStats } from "@/types/investments"

interface PnlStatsProps {
  stats: InvestmentStats
}

export function PnlStats({ stats }: PnlStatsProps) {
  const winRate =
    stats.totalDays > 0
      ? Math.round((stats.profitDays / stats.totalDays) * 100)
      : 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Yesterday"
          value={stats.yesterday !== null ? formatPnl(stats.yesterday) : "—"}
          color={stats.yesterday !== null ? getPnlColor(stats.yesterday) : "text-muted-foreground"}
        />
        <StatCard
          label="This Week"
          value={formatPnl(stats.thisWeek)}
          color={getPnlColor(stats.thisWeek)}
        />
        <StatCard
          label="This Month"
          value={formatPnl(stats.thisMonth)}
          color={getPnlColor(stats.thisMonth)}
        />
        <StatCard
          label="All Time"
          value={formatPnl(stats.allTime)}
          color={getPnlColor(stats.allTime)}
        />
      </div>

      {stats.totalDays > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span>{stats.totalDays} days traded</span>
          <span className="text-green-600">{stats.profitDays}W</span>
          <span className="text-red-600">{stats.lossDays}L</span>
          <span>{winRate}% win rate</span>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
