import { useMemo, useState } from "react"
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
import { formatPnl, getCumulativePnlSeries } from "@/lib/investment-utils"
import type { InvestmentLog } from "@/types/investments"

interface CumulativePnlChartProps {
  logs: InvestmentLog[]
}

const TOTAL_COLOR = "var(--primary)"
const STOCK_COLOR = "var(--chart-stock)"
const MF_COLOR = "var(--chart-mf)"

interface ChartRow {
  dateStr: string
  label: string
  date: Date
  total: number
  stock: number
  mf: number
}

/** Compact INR for axis ticks: ₹1.2L, ₹15k, -₹3k. */
function formatCompact(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}k`
  return `${sign}₹${Math.round(abs)}`
}

export function CumulativePnlChart({ logs }: CumulativePnlChartProps) {
  const { rows, hasSplit } = useMemo(() => {
    const series = getCumulativePnlSeries(logs)
    const rows: ChartRow[] = series.map((p) => ({
      dateStr: p.dateStr,
      label: format(p.date, "d MMM"),
      date: p.date,
      total: p.total,
      stock: p.stock,
      mf: p.mf,
    }))
    // Only show stock/MF lines if there's any non-zero split to draw.
    const hasSplit = series.some((p) => p.stock !== 0 || p.mf !== 0)
    return { rows, hasSplit }
  }, [logs])

  // Stocks/MF start hidden — only the Total line shows until the user opts in.
  const [showStock, setShowStock] = useState(false)
  const [showMf, setShowMf] = useState(false)

  if (rows.length < 2) return null

  const tickInterval = Math.max(0, Math.floor(rows.length / 6))

  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
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
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={formatCompact}
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
            <Tooltip
              cursor={{
                stroke: "var(--muted-foreground)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={
                <CumulativeTooltip
                  showStock={hasSplit && showStock}
                  showMf={hasSplit && showMf}
                />
              }
            />
            {hasSplit && showStock && (
              <Line
                type="monotone"
                dataKey="stock"
                name="Stocks"
                stroke={STOCK_COLOR}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            )}
            {hasSplit && showMf && (
              <Line
                type="monotone"
                dataKey="mf"
                name="MF"
                stroke={MF_COLOR}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke={TOTAL_COLOR}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — Total is always on; Stocks/MF are toggles (off by default) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ backgroundColor: TOTAL_COLOR }}
          />
          Total
        </span>
        {hasSplit && (
          <>
            <LegendToggle
              label="Stocks"
              color={STOCK_COLOR}
              active={showStock}
              onClick={() => setShowStock((v) => !v)}
            />
            <LegendToggle
              label="MF"
              color={MF_COLOR}
              active={showMf}
              onClick={() => setShowMf((v) => !v)}
            />
          </>
        )}
      </div>
    </div>
  )
}

function LegendToggle({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors ${
        active
          ? "border-foreground/20 text-foreground"
          : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
      }`}
    >
      <span
        className="inline-block w-3 h-0.5 rounded"
        style={{ backgroundColor: color, opacity: active ? 1 : 0.4 }}
      />
      {label}
    </button>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
  showStock?: boolean
  showMf?: boolean
}

function CumulativeTooltip({ active, payload, showStock, showMf }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">{format(row.date, "MMM d, yyyy")}</p>
      <p>
        <span style={{ color: TOTAL_COLOR }}>Total:</span> {formatPnl(row.total)}
      </p>
      {showStock && (
        <p>
          <span style={{ color: STOCK_COLOR }}>Stocks:</span>{" "}
          {formatPnl(row.stock)}
        </p>
      )}
      {showMf && (
        <p>
          <span style={{ color: MF_COLOR }}>MF:</span> {formatPnl(row.mf)}
        </p>
      )}
    </div>
  )
}
