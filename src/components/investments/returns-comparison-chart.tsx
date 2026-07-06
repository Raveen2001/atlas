import { useMemo } from "react"
import { format } from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatReturnsPct } from "@/lib/investment-utils"
import type { ReturnsComparisonEntry } from "@/lib/investment-utils"

interface ReturnsComparisonChartProps {
  data: ReturnsComparisonEntry[]
  beatDays: number
  comparableDays: number
}

const SVG_HEIGHT = 120
const PADDING_TOP = 12
const PADDING_BOTTOM = 24 // room for day labels
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM

const YOU_COLOR = "#16a34a"
const NIFTY_COLOR = "#6366f1"
const ZERO_COLOR = "hsl(var(--border))"

export function ReturnsComparisonChart({
  data,
  beatDays,
  comparableDays,
}: ReturnsComparisonChartProps) {
  const { points, yMin, yMax, hasAnyData } = useMemo(() => {
    const allValues: number[] = []
    for (const d of data) {
      if (d.returns_pct != null) allValues.push(d.returns_pct)
      if (d.nifty50_pct != null) allValues.push(d.nifty50_pct)
    }

    if (allValues.length === 0) {
      return { points: data, yMin: -1, yMax: 1, hasAnyData: false }
    }

    const rawMin = Math.min(...allValues, 0)
    const rawMax = Math.max(...allValues, 0)
    const padding = Math.max((rawMax - rawMin) * 0.15, 0.2)
    return {
      points: data,
      yMin: rawMin - padding,
      yMax: rawMax + padding,
      hasAnyData: true,
    }
  }, [data])

  if (!hasAnyData) return null

  const n = points.length
  if (n === 0) return null

  function toY(value: number): number {
    const ratio = (value - yMin) / (yMax - yMin)
    return PADDING_TOP + CHART_HEIGHT * (1 - ratio)
  }

  const zeroY = toY(0)

  // Build SVG polyline point strings for each series
  function buildLine(getValue: (e: ReturnsComparisonEntry) => number | null, width: number) {
    const segments: string[] = []
    let current = ""
    for (let i = 0; i < points.length; i++) {
      const val = getValue(points[i])
      const x = (i / (n - 1)) * width
      if (val == null) {
        if (current) segments.push(current.trim())
        current = ""
      } else {
        current += `${x},${toY(val)} `
      }
    }
    if (current) segments.push(current.trim())
    return segments
  }

  return (
    <div className="space-y-2">
      {comparableDays > 0 && (
        <p className="text-xs text-muted-foreground">
          Beat Nifty 50 on{" "}
          <span className="font-semibold text-green-600">{beatDays}</span> of{" "}
          <span className="font-semibold">{comparableDays}</span> comparable day
          {comparableDays !== 1 ? "s" : ""} this month
        </p>
      )}

      <TooltipProvider delayDuration={100}>
        <div className="relative w-full" style={{ height: SVG_HEIGHT }}>
          <svg
            width="100%"
            height={SVG_HEIGHT}
            viewBox={`0 0 800 ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Zero line */}
            <line
              x1={0}
              y1={zeroY}
              x2={800}
              y2={zeroY}
              stroke={ZERO_COLOR}
              strokeWidth={1}
            />

            {/* Your returns line segments */}
            {buildLine((e) => e.returns_pct, 800).map((pts, i) => (
              <polyline
                key={`you-${i}`}
                points={pts}
                fill="none"
                stroke={YOU_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Nifty 50 line segments */}
            {buildLine((e) => e.nifty50_pct, 800).map((pts, i) => (
              <polyline
                key={`nifty-${i}`}
                points={pts}
                fill="none"
                stroke={NIFTY_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Dots + tooltips for each trading day */}
            {points.map((entry, i) => {
              const x = n > 1 ? (i / (n - 1)) * 800 : 400
              const hasYou = entry.returns_pct != null
              const hasNifty = entry.nifty50_pct != null
              if (!hasYou && !hasNifty) {
                return (
                  <g key={entry.dateStr}>
                    {/* invisible hit area */}
                    <rect
                      x={Math.max(0, x - 12)}
                      y={PADDING_TOP}
                      width={24}
                      height={CHART_HEIGHT}
                      fill="transparent"
                    />
                  </g>
                )
              }
              return (
                <Tooltip key={entry.dateStr}>
                  <TooltipTrigger asChild>
                    <g className="cursor-default">
                      {/* invisible hit area */}
                      <rect
                        x={Math.max(0, x - 12)}
                        y={PADDING_TOP}
                        width={24}
                        height={CHART_HEIGHT}
                        fill="transparent"
                      />
                      {hasYou && (
                        <circle
                          cx={x}
                          cy={toY(entry.returns_pct!)}
                          r={3}
                          fill={YOU_COLOR}
                        />
                      )}
                      {hasNifty && (
                        <circle
                          cx={x}
                          cy={toY(entry.nifty50_pct!)}
                          r={3}
                          fill={NIFTY_COLOR}
                        />
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs space-y-1">
                    <p className="font-medium">{format(entry.date, "MMM d, EEE")}</p>
                    {hasYou && (
                      <p>
                        <span className="text-green-600">You:</span>{" "}
                        {formatReturnsPct(entry.returns_pct!)}
                      </p>
                    )}
                    {hasNifty && (
                      <p>
                        <span className="text-indigo-500">Nifty 50:</span>{" "}
                        {formatReturnsPct(entry.nifty50_pct!)}
                      </p>
                    )}
                    {hasYou && hasNifty && (
                      <p className={entry.returns_pct! > entry.nifty50_pct! ? "text-green-600" : "text-red-500"}>
                        {entry.returns_pct! > entry.nifty50_pct! ? "Outperformed" : entry.returns_pct! < entry.nifty50_pct! ? "Underperformed" : "Matched"}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </svg>

          {/* Day labels — absolutely positioned below the SVG */}
          <div
            className="absolute bottom-0 left-0 right-0 flex"
            style={{ height: PADDING_BOTTOM }}
          >
            {points.map((entry, i) => (
              <div
                key={entry.dateStr}
                className="flex-1 flex items-end justify-center"
              >
                <span className="text-[9px] text-muted-foreground leading-none">
                  {i === 0 || i === points.length - 1 || entry.date.getDate() % 5 === 0
                    ? format(entry.date, "d")
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: YOU_COLOR }} />
          You
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: NIFTY_COLOR }} />
          Nifty 50
        </span>
      </div>
    </div>
  )
}
