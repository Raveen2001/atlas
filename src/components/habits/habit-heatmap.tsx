import { useMemo } from "react"
import {
  format,
  subDays,
  startOfWeek,
  eachDayOfInterval,
  getDay,
} from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getHeatmapData } from "@/lib/habit-utils"
import { getTagStyle } from "@/lib/tag-colors"
import type { Habit, HabitLog, HeatmapLevel } from "@/types/habits"

interface HabitHeatmapProps {
  habit?: Habit
  logs: HabitLog[]
  color?: string
  days?: number
}

const CELL_SIZE = 12
const CELL_GAP = 2
const LEVEL_OPACITY: Record<HeatmapLevel, number> = {
  0: 0,
  1: 0.15,
  2: 0.35,
  3: 0.6,
  4: 1,
}

export function HabitHeatmap({
  habit,
  logs,
  color = "green",
  days = 365,
}: HabitHeatmapProps) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const data = useMemo(
    () => getHeatmapData(logs, startDate, endDate, habit),
    [logs, startDate, endDate, habit],
  )

  // Build grid: start from the Sunday of the start week
  const gridStart = startOfWeek(startDate, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: gridStart, end: endDate })

  // Group by week
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  for (const day of allDays) {
    if (getDay(day) === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(day)
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  // Month labels
  const monthLabels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i][0]
    const month = firstDay.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({
        label: format(firstDay, "MMM"),
        weekIndex: i,
      })
      lastMonth = month
    }
  }

  const colorStyle = getTagStyle(color)
  const baseColor = colorStyle.text

  return (
    <div className="overflow-x-auto">
      <TooltipProvider delay={100}>
        <div className="inline-block">
          {/* Month labels */}
          <div
            className="flex text-xs text-muted-foreground mb-1"
            style={{ paddingLeft: 24 }}
          >
            {monthLabels.map((m, i) => (
              <span
                key={i}
                style={{
                  position: "relative",
                  left: m.weekIndex * (CELL_SIZE + CELL_GAP),
                }}
                className="absolute"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5 mt-5">
            {/* Day labels */}
            <div
              className="flex flex-col justify-between text-xs text-muted-foreground pr-1"
              style={{ height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP }}
            >
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }} />
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, fontSize: 10 }}>
                M
              </span>
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }} />
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, fontSize: 10 }}>
                W
              </span>
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }} />
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, fontSize: 10 }}>
                F
              </span>
              <span style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }} />
            </div>

            {/* Grid */}
            <div className="flex" style={{ gap: CELL_GAP }}>
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  className="flex flex-col"
                  style={{ gap: CELL_GAP }}
                >
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week.find((d) => getDay(d) === di)
                    if (!day) {
                      return (
                        <div
                          key={di}
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                          }}
                        />
                      )
                    }

                    const dateStr = format(day, "yyyy-MM-dd")
                    const level = data.get(dateStr) ?? 0
                    const opacity = LEVEL_OPACITY[level]

                    return (
                      <Tooltip key={di}>
                        <TooltipTrigger
                          className="rounded-sm cursor-default"
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            backgroundColor:
                              level === 0
                                ? "var(--color-muted)"
                                : baseColor,
                            opacity: level === 0 ? 1 : opacity,
                          }}
                        />
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">
                            {format(day, "MMM d, yyyy")}
                          </p>
                          <p className="text-muted-foreground">
                            {level === 4
                              ? "Completed"
                              : level >= 1
                                ? "Missed"
                                : "Not due"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
