import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  isWeekend,
} from "date-fns"
import type { InvestmentLog, InvestmentStats } from "@/types/investments"

export function computeInvestmentStats(logs: InvestmentLog[]): InvestmentStats {
  if (logs.length === 0) {
    return {
      yesterday: null,
      thisWeek: 0,
      thisMonth: 0,
      allTime: 0,
      totalDays: 0,
      profitDays: 0,
      lossDays: 0,
      bestDay: 0,
      worstDay: 0,
    }
  }

  const today = new Date()
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd")
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd")

  const yesterdayLog = logs.find((l) => l.logged_date === yesterdayStr)

  let thisWeek = 0
  let thisMonth = 0
  let allTime = 0
  let profitDays = 0
  let lossDays = 0
  let bestDay = -Infinity
  let worstDay = Infinity

  for (const log of logs) {
    allTime += log.pnl_amount
    if (log.pnl_amount > 0) profitDays++
    if (log.pnl_amount < 0) lossDays++
    if (log.pnl_amount > bestDay) bestDay = log.pnl_amount
    if (log.pnl_amount < worstDay) worstDay = log.pnl_amount
    if (log.logged_date >= weekStart) thisWeek += log.pnl_amount
    if (log.logged_date >= monthStart) thisMonth += log.pnl_amount
  }

  return {
    yesterday: yesterdayLog ? yesterdayLog.pnl_amount : null,
    thisWeek,
    thisMonth,
    allTime,
    totalDays: logs.length,
    profitDays,
    lossDays,
    bestDay: bestDay === -Infinity ? 0 : bestDay,
    worstDay: worstDay === Infinity ? 0 : worstDay,
  }
}

const inrFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPnl(amount: number): string {
  const sign = amount > 0 ? "+" : ""
  return sign + inrFormat.format(amount)
}

export function getPnlColor(amount: number): string {
  if (amount > 0) return "text-green-600"
  if (amount < 0) return "text-red-600"
  return "text-muted-foreground"
}

export interface PnlHeatmapEntry {
  amount: number | null
  isWeekend: boolean
}

export function getPnlHeatmapData(
  logs: InvestmentLog[],
  startDate: Date,
  endDate: Date,
): Map<string, PnlHeatmapEntry> {
  const map = new Map<string, PnlHeatmapEntry>()
  const logMap = new Map<string, number>()
  for (const log of logs) {
    logMap.set(log.logged_date, log.pnl_amount)
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd")
    const amount = logMap.get(dateStr) ?? null
    map.set(dateStr, { amount, isWeekend: isWeekend(day) })
  }

  return map
}

export function isTradingDay(date: Date): boolean {
  return !isWeekend(date)
}
