import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isFuture,
  isThisMonth,
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
  month?: Date
}

const HALF_HEIGHT = 50 // max bar height in one direction (px)

export function PnlBarChart({ logs, month }: PnlBarChartProps) {
  const { days, maxAbs } = useMemo(() => {
    const target = month ?? new Date()
    const viewingCurrentMonth = isThisMonth(target)
    const monthStart = startOfMonth(target)
    const monthEnd = endOfMonth(target)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const logMap = new Map<string, number>()
    for (const log of logs) {
      logMap.set(log.logged_date, log.pnl_amount)
    }

    const tradingDays = allDays
      .filter((d) => !isWeekend(d) && (!viewingCurrentMonth || !isFuture(d)))
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
      <div className="flex gap-1">
        {days.map((day) => {
          const barH =
            day.amount !== null
              ? Math.max((Math.abs(day.amount) / maxAbs) * HALF_HEIGHT, 3)
              : 0
          const isProfit = day.amount !== null && day.amount >= 0

          return (
            <Tooltip key={day.dateStr}>
              <TooltipTrigger
                className="flex flex-col items-center flex-1"
                style={{ minWidth: 8 }}
              >
                {/* Profit area (grows upward) */}
                <div
                  className="w-full flex items-end justify-center"
                  style={{ height: HALF_HEIGHT }}
                >
                  {day.amount !== null && isProfit && (
                    <div
                      className="w-full max-w-3 rounded-t-sm"
                      style={{ height: barH, backgroundColor: "#16a34a" }}
                    />
                  )}
                </div>

                {/* Zero line */}
                <div className="w-full h-px bg-border" />

                {/* Loss area (grows downward) */}
                <div
                  className="w-full flex items-start justify-center"
                  style={{ height: HALF_HEIGHT }}
                >
                  {day.amount !== null && !isProfit && (
                    <div
                      className="w-full max-w-3 rounded-b-sm"
                      style={{ height: barH, backgroundColor: "#dc2626" }}
                    />
                  )}
                </div>

                {/* Day label */}
                <span className="text-[9px] text-muted-foreground mt-1 leading-none">
                  {format(day.date, "d")}
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
