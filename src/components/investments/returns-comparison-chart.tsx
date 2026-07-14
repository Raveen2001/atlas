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
import { formatReturnsPct } from "@/lib/investment-utils"
import type { ReturnsComparisonEntry } from "@/lib/investment-utils"

interface ReturnsComparisonChartProps {
  data: ReturnsComparisonEntry[]
  beatDays: number
  comparableDays: number
}

const STOCK_COLOR = "var(--chart-stock)"
const MF_COLOR = "var(--chart-mf)"
const NIFTY_COLOR = "var(--chart-nifty)"

interface ChartRow {
  dateStr: string
  label: string
  date: Date
  stock: number | null
  mf: number | null
  nifty: number | null
}

export function ReturnsComparisonChart({
  data,
  beatDays,
  comparableDays,
}: ReturnsComparisonChartProps) {
  const { rows, domain, hasAnyData } = useMemo(() => {
    const rows: ChartRow[] = data.map((d) => ({
      dateStr: d.dateStr,
      label: format(d.date, "d"),
      date: d.date,
      stock: d.stock_pct,
      mf: d.mf_pct,
      nifty: d.nifty50_pct,
    }))

    const values: number[] = []
    for (const d of data) {
      if (d.stock_pct != null) values.push(d.stock_pct)
      if (d.mf_pct != null) values.push(d.mf_pct)
      if (d.nifty50_pct != null) values.push(d.nifty50_pct)
    }

    if (values.length === 0) {
      return { rows, domain: [-1, 1] as [number, number], hasAnyData: false }
    }

    const rawMin = Math.min(...values, 0)
    const rawMax = Math.max(...values, 0)
    const pad = Math.max((rawMax - rawMin) * 0.15, 0.2)
    return {
      rows,
      domain: [rawMin - pad, rawMax + pad] as [number, number],
      hasAnyData: true,
    }
  }, [data])

  if (!hasAnyData || rows.length === 0) return null

  // Show ~6 evenly spaced day ticks to avoid clutter.
  const tickInterval = Math.max(0, Math.floor(rows.length / 6))

  // A lone data point (both neighbours null) draws no line segment, so render a
  // dot for it — otherwise sparse series (e.g. day-lagged MF) become invisible.
  function makeIsolatedDot(key: "stock" | "mf" | "nifty", color: string) {
    return function IsolatedDot(props: { cx?: number; cy?: number; index?: number }) {
      const { cx, cy, index } = props
      if (cx == null || cy == null || index == null) return <g />
      const prev = rows[index - 1]?.[key]
      const next = rows[index + 1]?.[key]
      if (prev != null || next != null) return <g />
      return <circle cx={cx} cy={cy} r={2.5} fill={color} />
    }
  }

  return (
    <div className="space-y-3">
      {comparableDays > 0 && (
        <p className="text-xs text-muted-foreground">
          Beat Nifty 50 on{" "}
          <span className="font-semibold text-green-600">{beatDays}</span> of{" "}
          <span className="font-semibold">{comparableDays}</span> comparable day
          {comparableDays !== 1 ? "s" : ""} this month
        </p>
      )}

      <div className="h-52 w-full">
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
              content={<ReturnsTooltip />}
            />
            <Line
              type="linear"
              dataKey="nifty"
              name="Nifty 50"
              stroke={NIFTY_COLOR}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={makeIsolatedDot("nifty", NIFTY_COLOR)}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="mf"
              name="MF"
              stroke={MF_COLOR}
              strokeWidth={2}
              dot={makeIsolatedDot("mf", MF_COLOR)}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="stock"
              name="Stocks"
              stroke={STOCK_COLOR}
              strokeWidth={2}
              dot={makeIsolatedDot("stock", STOCK_COLOR)}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
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

function ReturnsTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  const hasStock = row.stock != null
  const hasMf = row.mf != null
  const hasNifty = row.nifty != null

  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">{format(row.date, "MMM d, EEE")}</p>
      {hasStock && (
        <p>
          <span style={{ color: STOCK_COLOR }}>Stocks:</span>{" "}
          {formatReturnsPct(row.stock!)}
        </p>
      )}
      {hasMf && (
        <p>
          <span style={{ color: MF_COLOR }}>MF:</span> {formatReturnsPct(row.mf!)}
        </p>
      )}
      {hasNifty && (
        <p>
          <span className="text-muted-foreground">Nifty 50:</span>{" "}
          {formatReturnsPct(row.nifty!)}
        </p>
      )}
      {hasStock && hasNifty && (
        <p className={row.stock! > row.nifty! ? "text-green-600" : row.stock! < row.nifty! ? "text-red-500" : "text-muted-foreground"}>
          {row.stock! > row.nifty!
            ? "Stocks beat Nifty"
            : row.stock! < row.nifty!
              ? "Stocks under Nifty"
              : "Matched"}
        </p>
      )}
    </div>
  )
}
