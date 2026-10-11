import { useMemo } from "react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDuration } from "@/lib/activity-utils"
import type { WeekDayTotals } from "@/lib/activity-utils"
import { RATING_OPTIONS } from "@/types/activities"
import type { ActivityRating } from "@/types/activities"

interface WeekChartProps {
  days: WeekDayTotals[]
  onSelectDay: (date: Date) => void
}

type ChartRow = { day: WeekDayTotals; label: string } & Record<
  ActivityRating,
  number
>

export function WeekChart({ days, onSelectDay }: WeekChartProps) {
  const rows = useMemo<ChartRow[]>(
    () =>
      days.map((d) => ({
        day: d,
        label: d.label,
        productive: d.productive / 60,
        neutral: d.neutral / 60,
        wasted: d.wasted / 60,
      })),
    [days],
  )

  if (!days.some((d) => d.total > 0)) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Nothing logged this week
      </div>
    )
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => `${v}h`}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={<WeekTooltip />}
          />
          {RATING_OPTIONS.map((r, i) => (
            <Bar
              key={r.value}
              dataKey={r.value}
              stackId="rating"
              fill={r.color}
              radius={i === RATING_OPTIONS.length - 1 ? [2, 2, 0, 0] : 0}
              isAnimationActive={false}
              className="cursor-pointer"
              onClick={(data) => {
                const row = (data as unknown as { payload?: ChartRow }).payload
                if (row) onSelectDay(row.day.date)
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
}

function WeekTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const { day } = payload[0].payload
  if (day.total === 0) return null
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md space-y-1">
      <p className="font-medium">
        {day.label} · {formatDuration(day.total)}
      </p>
      {RATING_OPTIONS.map((r) =>
        day[r.value] > 0 ? (
          <p key={r.value} style={{ color: r.color }}>
            {r.label} {formatDuration(day[r.value])}
          </p>
        ) : null,
      )}
    </div>
  )
}
