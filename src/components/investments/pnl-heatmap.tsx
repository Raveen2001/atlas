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
import { getPnlHeatmapData, formatPnl } from "@/lib/investment-utils"
import type { InvestmentLog } from "@/types/investments"

interface PnlHeatmapProps {
  logs: InvestmentLog[]
  days?: number
}

const CELL_SIZE = 12
const CELL_GAP = 2

const PROFIT_COLOR = "#16a34a"
const LOSS_COLOR = "#dc2626"

function getIntensity(amount: number, maxAbs: number): number {
  if (maxAbs === 0) return 0.4
  // Map to 0.2–1.0 range for visible opacity
  return 0.2 + (Math.abs(amount) / maxAbs) * 0.8
}

export function PnlHeatmap({ logs, days = 365 }: PnlHeatmapProps) {
  const endDate = new Date()
  const startDate = subDays(endDate, days)

  const data = useMemo(
    () => getPnlHeatmapData(logs, startDate, endDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [logs, days],
  )

  const maxAbs = useMemo(() => {
    if (logs.length === 0) return 1
    return Math.max(...logs.map((l) => Math.abs(l.pnl_amount)), 1)
  }, [logs])

  const gridStart = startOfWeek(startDate, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: gridStart, end: endDate })

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

  const monthLabels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i][0]
    const month = firstDay.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ label: format(firstDay, "MMM"), weekIndex: i })
      lastMonth = month
    }
  }

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
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      )
                    }

                    const dateStr = format(day, "yyyy-MM-dd")
                    const entry = data.get(dateStr)
                    const amount = entry?.amount ?? null
                    const weekend = entry?.isWeekend ?? false

                    let bg: string
                    let opacity = 1

                    if (weekend) {
                      // Weekends: dimmer muted
                      bg = "var(--color-muted)"
                      opacity = 0.4
                    } else if (amount === null) {
                      // Weekday, not logged
                      bg = "var(--color-muted)"
                    } else if (amount === 0) {
                      // Break-even: neutral
                      bg = "var(--color-muted)"
                    } else if (amount > 0) {
                      bg = PROFIT_COLOR
                      opacity = getIntensity(amount, maxAbs)
                    } else {
                      bg = LOSS_COLOR
                      opacity = getIntensity(amount, maxAbs)
                    }

                    return (
                      <Tooltip key={di}>
                        <TooltipTrigger
                          className="rounded-sm cursor-default"
                          style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            backgroundColor: bg,
                            opacity,
                          }}
                        />
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">
                            {format(day, "EEE, MMM d, yyyy")}
                          </p>
                          <p className="text-muted-foreground">
                            {weekend
                              ? "Weekend"
                              : amount !== null
                                ? formatPnl(amount)
                                : "Not logged"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground justify-end">
            <span>Loss</span>
            <div className="rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: LOSS_COLOR, opacity: 1 }} />
            <div className="rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: LOSS_COLOR, opacity: 0.5 }} />
            <div className="rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: "var(--color-muted)" }} />
            <div className="rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: PROFIT_COLOR, opacity: 0.5 }} />
            <div className="rounded-sm" style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: PROFIT_COLOR, opacity: 1 }} />
            <span>Profit</span>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
