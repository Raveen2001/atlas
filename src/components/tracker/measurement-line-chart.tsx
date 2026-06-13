import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import type { TrackerMeasurement } from "@/types/tracker"

interface MeasurementLineChartProps {
  measurements: TrackerMeasurement[] // expected ascending by date
  unit: string
}

const PAD_L = 44
const PAD_R = 12
const PAD_T = 14
const PAD_B = 28
const VIEW_W = 600
const VIEW_H = 240
const PLOT_W = VIEW_W - PAD_L - PAD_R
const PLOT_H = VIEW_H - PAD_T - PAD_B

interface Point {
  m: TrackerMeasurement
  x: number
  y: number
}

function formatValue(v: number): string {
  if (Number.isInteger(v)) return v.toString()
  // trim trailing zeros for nicer y-axis labels
  return parseFloat(v.toFixed(2)).toString()
}

export function MeasurementLineChart({
  measurements,
  unit,
}: MeasurementLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const { points, yMin, yMax, ticks } = useMemo(() => {
    if (measurements.length === 0) {
      return { points: [] as Point[], yMin: 0, yMax: 1, ticks: [] as number[] }
    }

    const values = measurements.map((m) => m.value)
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const range = rawMax - rawMin
    const padding = range === 0 ? Math.max(Math.abs(rawMax) * 0.1, 1) : range * 0.1
    const yMin = rawMin - padding
    const yMax = rawMax + padding

    const n = measurements.length
    const points: Point[] = measurements.map((m, i) => {
      const x =
        n === 1
          ? PAD_L + PLOT_W / 2
          : PAD_L + (i / (n - 1)) * PLOT_W
      const y =
        PAD_T + PLOT_H - ((m.value - yMin) / (yMax - yMin)) * PLOT_H
      return { m, x, y }
    })

    // 4 evenly spaced y-axis ticks
    const tickCount = 4
    const ticks: number[] = []
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(yMin + ((yMax - yMin) * i) / tickCount)
    }

    return { points, yMin, yMax, ticks }
  }, [measurements])

  if (measurements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No measurements yet. Log one to see the graph.
      </div>
    )
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ")

  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(2)},${(PAD_T + PLOT_H).toFixed(2)} L${points[0].x.toFixed(2)},${(PAD_T + PLOT_H).toFixed(2)} Z`
      : ""

  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  // First, middle, last date labels for x-axis
  const xLabels: { x: number; label: string }[] = []
  if (points.length > 0) {
    const first = points[0]
    const last = points[points.length - 1]
    xLabels.push({
      x: first.x,
      label: format(parseISO(first.m.measured_date), "MMM d"),
    })
    if (points.length > 2) {
      const mid = points[Math.floor(points.length / 2)]
      xLabels.push({
        x: mid.x,
        label: format(parseISO(mid.m.measured_date), "MMM d"),
      })
    }
    if (points.length > 1) {
      xLabels.push({
        x: last.x,
        label: format(parseISO(last.m.measured_date), "MMM d"),
      })
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Y-axis grid lines */}
        {ticks.map((t, i) => {
          const y = PAD_T + PLOT_H - ((t - yMin) / (yMax - yMin)) * PLOT_H
          return (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={PAD_L + PLOT_W}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
                strokeDasharray={i === 0 ? "0" : "2 3"}
              />
              <text
                x={PAD_L - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {formatValue(t)}
              </text>
            </g>
          )
        })}

        {/* Area under line */}
        {points.length > 1 && (
          <path
            d={areaPath}
            fill="oklch(0.546 0.215 262.881)"
            opacity="0.08"
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="oklch(0.546 0.215 262.881)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={p.m.id}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === i ? 4.5 : 3}
            fill="oklch(0.546 0.215 262.881)"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={VIEW_H - 8}
            textAnchor={
              i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"
            }
            className="fill-muted-foreground"
            fontSize="10"
          >
            {l.label}
          </text>
        ))}

        {/* Hover crosshair */}
        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD_T}
            y2={PAD_T + PLOT_H}
            stroke="currentColor"
            className="text-muted-foreground"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
        )}

        {/* Hit areas for hover */}
        {points.map((p, i) => {
          const slotW = PLOT_W / Math.max(points.length, 1)
          return (
            <rect
              key={`hit-${p.m.id}`}
              x={p.x - slotW / 2}
              y={PAD_T}
              width={slotW}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          )
        })}
      </svg>

      {hovered && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {format(parseISO(hovered.m.measured_date), "EEE, MMM d, yyyy")}
          </span>
          <span className="font-mono font-medium">
            {formatValue(hovered.m.value)} {unit}
          </span>
        </div>
      )}
    </div>
  )
}
