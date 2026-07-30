import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import { formatCompactInr } from "@/lib/stock-utils"
import type { StockHolding } from "@/lib/stock-utils"

interface StocksSummaryStripProps {
  holdings: StockHolding[]
}

export function StocksSummaryStrip({ holdings }: StocksSummaryStripProps) {
  const invested = holdings.reduce((s, h) => s + h.invested, 0)

  const priced = holdings.filter((h) => h.marketValue != null)
  const marketValue =
    priced.length > 0 ? priced.reduce((s, h) => s + h.marketValue!, 0) : null
  const pricedInvested = priced.reduce((s, h) => s + h.invested, 0)
  const unrealised = marketValue != null ? marketValue - pricedInvested : null

  const dayMembers = holdings.filter((h) => h.dayPnl != null)
  const dayPnl =
    dayMembers.length > 0
      ? dayMembers.reduce((s, h) => s + h.dayPnl!, 0)
      : null

  return (
    <div className="grid grid-cols-2 gap-2">
      <Tile label="Invested" value={formatCompactInr(invested)} />
      <Tile
        label="Current"
        value={marketValue != null ? formatCompactInr(marketValue) : "—"}
      />
      <Tile
        label="Unrealised P&L"
        value={unrealised != null ? formatPnl(unrealised) : "—"}
        color={unrealised != null ? getPnlColor(unrealised) : undefined}
      />
      <Tile
        label="Day P&L"
        value={dayPnl != null ? formatPnl(dayPnl) : "—"}
        color={dayPnl != null ? getPnlColor(dayPnl) : undefined}
      />
    </div>
  )
}

function Tile({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`text-lg font-mono font-semibold truncate ${color ?? ""}`}>
        {value}
      </p>
    </div>
  )
}
