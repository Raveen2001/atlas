import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isFuture,
} from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatPnl } from "@/lib/investment-utils"
import type { InvestmentLog } from "@/types/investments"

interface PnlBarChartProps {
  logs: InvestmentLog[]
}

const BAR_HEIGHT = 120 // max bar area height in px

export function PnlBarChart({ logs }: PnlBarChartProps) {
  const { days, maxAbs } = useMemo(() => {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const logMap = new Map<string, number>()
    for (const log of logs) {
      logMap.set(log.logged_date, log.pnl_amount)
    }

    const tradingDays = allDays
      .filter((d) => !isWeekend(d) && !isFuture(d))
      .map((d) => {
        const dateStr = format(d, "yyyy-MM-dd")
        return {
          date: d,
          dateStr,
          amount: logMap.get(dateStr) ?? null,
        }
      })

    const amounts = tradingDays
      .map((d) => d.amount)
      .filter((a): a is number => a !== null)
    const max = amounts.length > 0 ? Math.max(...amounts.map(Math.abs)) : 1

    return { days: tradingDays, maxAbs: max || 1 }
  }, [logs])

  if (days.length === 0) return null

  return (
    <TooltipProvider delay={100}>
      <div className="flex items-end gap-1" style={{ height: BAR_HEIGHT }}>
        {days.map((day) => {
          const barHeight =
            day.amount !== null
              ? Math.max((Math.abs(day.amount) / maxAbs) * (BAR_HEIGHT / 2 - 4), 2)
              : 0
          const isProfit = day.amount !== null && day.amount >= 0
          const dayNum = format(day.date, "d")

          return (
            <Tooltip key={day.dateStr}>
              <TooltipTrigger className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className="relative flex flex-col justify-center"
                  style={{ height: BAR_HEIGHT - 16 }}
                >
                  {/* Zero line at center */}
                  {day.amount !== null ? (
                    <div
                      className="absolute left-0 right-0 rounded-sm"
                      style={{
                        height: barHeight,
                        ...(isProfit
                          ? { bottom: "50%", backgroundColor: "#16a34a" }
                          : { top: "50%", backgroundColor: "#dc2626" }),
                      }}
                    />
                  ) : (
                    <div
                      className="absolute left-0 right-0 rounded-sm bg-muted"
                      style={{
                        height: 2,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                  {dayNum}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{format(day.date, "MMM d, EEE")}</p>
                <p className="text-muted-foreground">
                  {day.amount !== null ? formatPnl(day.amount) : "Not logged"}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
