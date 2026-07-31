import { useMemo } from "react"
import { format } from "date-fns"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatReturnsPct, getReturnsColor } from "@/lib/investment-utils"
import type { PerformancePoint } from "@/lib/performance-utils"

interface PerformanceChartProps {
  data: PerformancePoint[]
}

const STOCK_COLOR = "var(--chart-stock)"
const MF_COLOR = "var(--chart-mf)"
const NIFTY_COLOR = "var(--chart-nifty)"

interface ChartRow {
  dateStr: string
  label: string
  date: Date
  stock: number
  mf: number
  nifty: number
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const { rows, domain } = useMemo(() => {
    const rows: ChartRow[] = data.map((p) => ({
      dateStr: p.dateStr,
      label: format(p.date, "d MMM"),
      date: p.date,
      stock: p.stock,
      mf: p.mf,
      nifty: p.nifty,
    }))

    const values = data.flatMap((p) => [p.stock, p.mf, p.nifty])
    const rawMin = Math.min(...values, 0)
    const rawMax = Math.max(...values, 0)
    const pad = Math.max((rawMax - rawMin) * 0.15, 0.2)
    return {
      rows,
      domain: [rawMin - pad, rawMax + pad] as [number, number],
    }
  }, [data])

  if (rows.length < 2) return null

  // Show ~6 evenly spaced ticks to avoid clutter.
  const tickInterval = Math.max(0, Math.floor(rows.length / 6))

  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              interval={tickInterval}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickMargin={8}
            />
            <YAxis
              domain={domain}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<PerformanceTooltip />}
            />
            <Line
              type="linear"
              dataKey="nifty"
              name="Nifty 50"
              stroke={NIFTY_COLOR}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="mf"
              name="MF"
              stroke={MF_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="stock"
              name="Stocks"
              stroke={STOCK_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: STOCK_COLOR }} />
          Stocks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: MF_COLOR }} />
          MF
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${NIFTY_COLOR} 0 3px, transparent 3px 6px)`,
            }}
          />
          Nifty 50 (benchmark)
        </span>
      </div>
    </div>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
}

function PerformanceTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  const spread = row.stock - row.nifty

  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">{format(row.date, "MMM d, EEE")}</p>
      <p>
        <span style={{ color: STOCK_COLOR }}>Stocks:</span>{" "}
        {formatReturnsPct(row.stock)}
      </p>
      <p>
        <span style={{ color: MF_COLOR }}>MF:</span> {formatReturnsPct(row.mf)}
      </p>
      <p>
        <span className="text-muted-foreground">Nifty 50:</span>{" "}
        {formatReturnsPct(row.nifty)}
      </p>
      <p className={getReturnsColor(spread)}>
        Stocks vs Nifty: {formatReturnsPct(spread)}
      </p>
    </div>
  )
}
