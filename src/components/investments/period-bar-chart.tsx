import { useMemo } from "react"
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatPnl } from "@/lib/investment-utils"
import type { PnlBucket } from "@/lib/investment-utils"

interface PeriodBarChartProps {
  buckets: PnlBucket[]
}

const PROFIT_COLOR = "#16a34a"
const LOSS_COLOR = "#dc2626"

interface BarRow {
  key: string
  label: string
  amount: number | null // null = no data (gap)
  bucket: PnlBucket
}

function formatCompact(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}k`
  return `${sign}₹${Math.round(abs)}`
}

export function PeriodBarChart({ buckets }: PeriodBarChartProps) {
  const rows = useMemo<BarRow[]>(
    () =>
      buckets.map((b) => ({
        key: b.key,
        label: b.label,
        amount: b.dayCount > 0 ? b.total : null,
        bucket: b,
      })),
    [buckets],
  )

  const hasData = rows.some((r) => r.amount !== null)
  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No P&L in this range
      </div>
    )
  }

  const tickInterval = Math.max(0, Math.floor(rows.length / 8))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
          <XAxis
            dataKey="label"
            interval={tickInterval}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickFormatter={formatCompact}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={<BarTooltip />}
          />
          <Bar dataKey="amount" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell
                key={r.key}
                fill={(r.amount ?? 0) >= 0 ? PROFIT_COLOR : LOSS_COLOR}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: BarRow }>
}

function BarTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const { bucket } = payload[0].payload
  if (bucket.dayCount === 0) return null
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">{bucket.label}</p>
      <p
        className={
          bucket.total > 0
            ? "text-green-600"
            : bucket.total < 0
              ? "text-red-600"
              : "text-muted-foreground"
        }
      >
        {formatPnl(bucket.total)}
      </p>
      {(bucket.stock != null || bucket.mf != null) && (
        <p className="text-muted-foreground">
          {bucket.stock != null && <span>S {formatPnl(bucket.stock)}</span>}
          {bucket.stock != null && bucket.mf != null && " · "}
          {bucket.mf != null && <span>M {formatPnl(bucket.mf)}</span>}
        </p>
      )}
      {bucket.dayCount > 1 && (
        <p className="text-muted-foreground">{bucket.dayCount} days</p>
      )}
    </div>
  )
}
