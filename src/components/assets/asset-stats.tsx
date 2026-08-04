import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAmount, formatGain, getGainColor } from "@/lib/asset-utils"
import type { AssetStats } from "@/lib/asset-utils"

interface AssetStatsProps {
  stats: AssetStats
}

export function AssetStatsGrid({ stats }: AssetStatsProps) {
  const hasInvestments = stats.invested > 0
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Invested" value={formatAmount(stats.invested)} />
      <StatCard
        label="Now Worth"
        value={formatAmount(stats.investedValue)}
        sub={
          hasInvestments
            ? `${formatGain(stats.investedGain)} (${stats.investedGainPct >= 0 ? "+" : ""}${stats.investedGainPct.toFixed(1)}%)`
            : undefined
        }
        subColor={getGainColor(stats.investedGain)}
      />
      <StatCard label="Other Assets" value={formatAmount(stats.otherSpent)} />
      <StatCard label="Under Warranty" value={String(stats.underWarranty)} />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string
  value: string
  sub?: string
  subColor?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <p className="text-xl font-bold font-mono">{value}</p>
        {sub && (
          <p className={`text-xs font-mono mt-0.5 ${subColor ?? ""}`}>{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}
