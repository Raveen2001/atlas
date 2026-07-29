import { useMemo, useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isWeekend,
  isFuture,
  isToday,
} from "date-fns"
// Weekends carry no data for a delivery-only tracker, so the grid is Mon–Fri only.
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MonthNavigator } from "./month-navigator"
import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import type { InvestmentLog } from "@/types/investments"

interface PnlCalendarProps {
  logs: InvestmentLog[]
}

const PROFIT_COLOR = "#16a34a"
const LOSS_COLOR = "#dc2626"
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function intensity(amount: number, maxAbs: number): number {
  if (maxAbs === 0) return 0.5
  return 0.25 + (Math.abs(amount) / maxAbs) * 0.75
}

export function PnlCalendar({ logs }: PnlCalendarProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()))
  // Tap-to-select a day — the only way to read a day's P&L on touch (hover
  // tooltips don't fire on mobile). Cleared when the month changes.
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const logByDate = useMemo(() => {
    const m = new Map<string, InvestmentLog>()
    for (const l of logs) m.set(l.logged_date, l)
    return m
  }, [logs])

  const { cells, maxAbs, monthTotal } = useMemo(() => {
    const monthStart = startOfMonth(month)
    // Weekdays only (Mon–Fri); weekends are dropped from the grid entirely.
    const days = eachDayOfInterval({
      start: monthStart,
      end: endOfMonth(month),
    }).filter((d) => !isWeekend(d))

    // Leading blanks so the first weekday lands under the right column
    // (Mon=0 … Fri=4). Derived from the first weekday, not the 1st of the month.
    const leading = days.length > 0 ? (getDay(days[0]) + 6) % 7 : 0

    let maxAbs = 0
    let monthTotal = 0
    const prefix = format(month, "yyyy-MM")
    for (const [date, l] of logByDate) {
      if (date.startsWith(prefix)) {
        maxAbs = Math.max(maxAbs, Math.abs(l.pnl_amount))
        monthTotal += l.pnl_amount
      }
    }

    const cells = [
      ...Array.from({ length: leading }, () => null),
      ...days.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd")
        return {
          date: d,
          dateStr,
          amount: logByDate.get(dateStr)?.pnl_amount ?? null,
          future: isFuture(d),
        }
      }),
    ]
    return { cells, maxAbs, monthTotal }
  }, [logByDate, month])

  const hasMonthData = cells.some((c) => c && c.amount !== null)

  const changeMonth = (m: Date) => {
    setMonth(m)
    setSelectedDate(null)
  }

  const selectedLog = selectedDate ? logByDate.get(selectedDate) : undefined

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-mono font-semibold ${
            hasMonthData ? getPnlColor(monthTotal) : "text-muted-foreground"
          }`}
        >
          {hasMonthData ? formatPnl(monthTotal) : "—"}
        </span>
        <MonthNavigator month={month} onMonthChange={changeMonth} logs={logs} />
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-5 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <TooltipProvider delay={100}>
        <div className="grid grid-cols-5 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`b${i}`} />

            const { date, dateStr, amount, future } = cell

            let bg = "transparent"
            let opacity = 1

            if (future) {
              bg = "transparent"
            } else if (amount === null || amount === 0) {
              bg = "var(--muted)"
              opacity = 0.6
            } else if (amount > 0) {
              bg = PROFIT_COLOR
              opacity = intensity(amount, maxAbs)
            } else {
              bg = LOSS_COLOR
              opacity = intensity(amount, maxAbs)
            }

            const selected = dateStr === selectedDate
            const border = selected
              ? "border-primary ring-1 ring-primary"
              : isToday(date)
                ? "border-primary/60"
                : "border-transparent"
            const filled = !future && amount != null && amount !== 0

            const cellInner = (
              <>
                <div
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: bg, opacity }}
                />
                <span
                  className={`relative text-[11px] leading-none ${
                    filled
                      ? "font-semibold text-foreground"
                      : future
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground"
                  }`}
                >
                  {format(date, "d")}
                </span>
              </>
            )

            const cellClass = `relative flex aspect-square items-center justify-center rounded-md border ${border}`

            if (future) {
              return (
                <div key={dateStr} className={`${cellClass} cursor-default`}>
                  {cellInner}
                </div>
              )
            }

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setSelectedDate((cur) =>
                          cur === dateStr ? null : dateStr,
                        )
                      }
                      className={`${cellClass} cursor-pointer`}
                    />
                  }
                >
                  {cellInner}
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{format(date, "EEE, MMM d")}</p>
                  <p className="text-muted-foreground">
                    {amount !== null ? formatPnl(amount) : "Not logged"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Selected-day detail (works on touch, where hover tooltips don't) */}
      <div className="min-h-9 rounded-lg border bg-muted/30 px-3 py-2">
        {selectedLog ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {format(new Date(selectedLog.logged_date + "T00:00:00"), "EEE, MMM d")}
            </span>
            <div className="flex items-center gap-3">
              {(selectedLog.stock_pnl != null || selectedLog.mf_pnl != null) && (
                <span className="text-xs text-muted-foreground space-x-1.5">
                  {selectedLog.stock_pnl != null && (
                    <span className={getPnlColor(selectedLog.stock_pnl)}>
                      S {formatPnl(selectedLog.stock_pnl)}
                    </span>
                  )}
                  {selectedLog.mf_pnl != null && (
                    <span className={getPnlColor(selectedLog.mf_pnl)}>
                      M {formatPnl(selectedLog.mf_pnl)}
                    </span>
                  )}
                </span>
              )}
              <span
                className={`text-sm font-mono font-semibold ${getPnlColor(selectedLog.pnl_amount)}`}
              >
                {formatPnl(selectedLog.pnl_amount)}
              </span>
            </div>
          </div>
        ) : selectedDate ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {format(new Date(selectedDate + "T00:00:00"), "EEE, MMM d")}
            </span>
            <span className="text-xs text-muted-foreground">Not logged</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tap a day to see its P&L
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
        <span>Loss</span>
        <div
          className="rounded-sm size-3"
          style={{ backgroundColor: LOSS_COLOR }}
        />
        <div
          className="rounded-sm size-3"
          style={{ backgroundColor: LOSS_COLOR, opacity: 0.4 }}
        />
        <div
          className="rounded-sm size-3"
          style={{ backgroundColor: PROFIT_COLOR, opacity: 0.4 }}
        />
        <div
          className="rounded-sm size-3"
          style={{ backgroundColor: PROFIT_COLOR }}
        />
        <span>Profit</span>
      </div>
    </div>
  )
}
