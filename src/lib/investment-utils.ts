import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isFuture,
  isThisMonth,
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
      comparableDays: 0,
      beatNiftyDays: 0,
      beatNiftyRate: 0,
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
  let comparableDays = 0
  let beatNiftyDays = 0

  for (const log of logs) {
    allTime += log.pnl_amount
    if (log.pnl_amount > 0) profitDays++
    if (log.pnl_amount < 0) lossDays++
    if (log.pnl_amount > bestDay) bestDay = log.pnl_amount
    if (log.pnl_amount < worstDay) worstDay = log.pnl_amount
    if (log.logged_date >= weekStart) thisWeek += log.pnl_amount
    if (log.logged_date >= monthStart) thisMonth += log.pnl_amount
    if (log.returns_pct != null && log.nifty50_pct != null) {
      comparableDays++
      if (log.returns_pct > log.nifty50_pct) beatNiftyDays++
    }
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
    comparableDays,
    beatNiftyDays,
    beatNiftyRate: comparableDays > 0 ? Math.round((beatNiftyDays / comparableDays) * 100) : 0,
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

const pctFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatReturnsPct(value: number): string {
  const sign = value > 0 ? "+" : ""
  return sign + pctFormat.format(value) + "%"
}

export function getReturnsColor(value: number): string {
  if (value > 0) return "text-green-600"
  if (value < 0) return "text-red-600"
  return "text-muted-foreground"
}

export interface ReturnsComparisonEntry {
  date: Date
  dateStr: string
  returns_pct: number | null
  nifty50_pct: number | null
  hasData: boolean
}

export function getReturnsComparisonData(
  logs: InvestmentLog[],
  month: Date,
): ReturnsComparisonEntry[] {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const logMap = new Map<string, InvestmentLog>()
  for (const log of logs) {
    logMap.set(log.logged_date, log)
  }

  const viewingCurrentMonth = isThisMonth(month)

  return allDays
    .filter((d) => !isWeekend(d) && (!viewingCurrentMonth || !isFuture(d)))
    .map((d) => {
      const dateStr = format(d, "yyyy-MM-dd")
      const log = logMap.get(dateStr)
      const returns_pct = log?.returns_pct ?? null
      const nifty50_pct = log?.nifty50_pct ?? null
      return {
        date: d,
        dateStr,
        returns_pct,
        nifty50_pct,
        hasData: returns_pct != null || nifty50_pct != null,
      }
    })
}
