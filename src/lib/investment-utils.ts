import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
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
      realisedMonth: 0,
      realisedAllTime: 0,
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
  let realisedMonth = 0
  let realisedAllTime = 0

  for (const log of logs) {
    allTime += log.pnl_amount
    if (log.pnl_amount > 0) profitDays++
    if (log.pnl_amount < 0) lossDays++
    if (log.pnl_amount > bestDay) bestDay = log.pnl_amount
    if (log.pnl_amount < worstDay) worstDay = log.pnl_amount
    if (log.logged_date >= weekStart) thisWeek += log.pnl_amount
    if (log.logged_date >= monthStart) thisMonth += log.pnl_amount
    if (log.stock_pct != null && log.nifty50_pct != null) {
      comparableDays++
      if (log.stock_pct > log.nifty50_pct) beatNiftyDays++
    }
    if (log.realised_pnl != null) {
      realisedAllTime += log.realised_pnl
      if (log.logged_date >= monthStart) realisedMonth += log.realised_pnl
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
    realisedMonth,
    realisedAllTime,
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

export function isTradingDay(date: Date): boolean {
  return !isWeekend(date)
}

// ── P&L aggregation (cumulative curve + period buckets) ─────────

export type Granularity = "daily" | "weekly" | "monthly" | "yearly"

export interface CumulativePoint {
  date: Date
  dateStr: string
  total: number
  stock: number
  mf: number
}

/**
 * Running total of P&L over every logged day (oldest → newest). `total` always
 * accumulates `pnl_amount`; `stock`/`mf` accumulate their split (treating null as 0
 * so the lines stay continuous). This is the "portfolio over time" growth curve.
 */
export function getCumulativePnlSeries(logs: InvestmentLog[]): CumulativePoint[] {
  const sorted = [...logs].sort((a, b) =>
    a.logged_date.localeCompare(b.logged_date),
  )
  let total = 0
  let stock = 0
  let mf = 0
  return sorted.map((l) => {
    total += l.pnl_amount
    stock += l.stock_pnl ?? 0
    mf += l.mf_pnl ?? 0
    return {
      date: new Date(l.logged_date + "T00:00:00"),
      dateStr: l.logged_date,
      total,
      stock,
      mf,
    }
  })
}

export interface PnlBucket {
  key: string
  label: string
  start: Date
  total: number
  stock: number | null // null when no day in the bucket had a stock split
  mf: number | null
  dayCount: number // logged trading days in the bucket (0 = no data / gap)
  best: number
  worst: number
}

function groupByKey<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const it of items) {
    const k = keyFn(it)
    const arr = map.get(k)
    if (arr) arr.push(it)
    else map.set(k, [it])
  }
  return map
}

function makeBucket(
  key: string,
  label: string,
  start: Date,
  logs: InvestmentLog[],
): PnlBucket {
  let total = 0
  let stock = 0
  let mf = 0
  let hasStock = false
  let hasMf = false
  let best = -Infinity
  let worst = Infinity
  for (const l of logs) {
    total += l.pnl_amount
    if (l.stock_pnl != null) {
      stock += l.stock_pnl
      hasStock = true
    }
    if (l.mf_pnl != null) {
      mf += l.mf_pnl
      hasMf = true
    }
    if (l.pnl_amount > best) best = l.pnl_amount
    if (l.pnl_amount < worst) worst = l.pnl_amount
  }
  return {
    key,
    label,
    start,
    total,
    stock: hasStock ? stock : null,
    mf: hasMf ? mf : null,
    dayCount: logs.length,
    best: best === -Infinity ? 0 : best,
    worst: worst === Infinity ? 0 : worst,
  }
}

/** Trading days of `month` (future days in the current month excluded). */
export function getDailyBuckets(
  logs: InvestmentLog[],
  month: Date,
): PnlBucket[] {
  const viewingCurrentMonth = isThisMonth(month)
  const logMap = new Map<string, InvestmentLog>()
  for (const l of logs) logMap.set(l.logged_date, l)

  return eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  })
    .filter((d) => !isWeekend(d) && (!viewingCurrentMonth || !isFuture(d)))
    .map((d) => {
      const dateStr = format(d, "yyyy-MM-dd")
      const l = logMap.get(dateStr)
      return makeBucket(dateStr, format(d, "d"), d, l ? [l] : [])
    })
}

/** Most-recent `weeks` ISO weeks (Mon-start), oldest → newest, continuous axis. */
export function getWeeklyBuckets(
  logs: InvestmentLog[],
  weeks = 16,
): PnlBucket[] {
  if (logs.length === 0) return []
  const byWeek = groupByKey(logs, (l) =>
    format(
      startOfWeek(new Date(l.logged_date + "T00:00:00"), { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    ),
  )
  const dates = logs.map((l) => l.logged_date).sort()
  const earliest = startOfWeek(new Date(dates[0] + "T00:00:00"), {
    weekStartsOn: 1,
  })
  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
  const allWeeks = eachWeekOfInterval(
    { start: earliest, end: thisWeek },
    { weekStartsOn: 1 },
  )
  return allWeeks.slice(-weeks).map((ws) => {
    const key = format(ws, "yyyy-MM-dd")
    return makeBucket(key, format(ws, "d MMM"), ws, byWeek.get(key) ?? [])
  })
}

/** All 12 months of `year`. */
export function getMonthlyBuckets(
  logs: InvestmentLog[],
  year: number,
): PnlBucket[] {
  const byMonth = groupByKey(logs, (l) => l.logged_date.slice(0, 7))
  const result: PnlBucket[] = []
  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1)
    const key = `${year}-${String(m + 1).padStart(2, "0")}`
    result.push(makeBucket(key, format(start, "MMM"), start, byMonth.get(key) ?? []))
  }
  return result
}

/** One bucket per calendar year, earliest logged year → current year. */
export function getYearlyBuckets(logs: InvestmentLog[]): PnlBucket[] {
  if (logs.length === 0) return []
  const byYear = groupByKey(logs, (l) => l.logged_date.slice(0, 4))
  const years = [...byYear.keys()].map(Number)
  const min = Math.min(...years)
  const max = Math.max(...years, new Date().getFullYear())
  const result: PnlBucket[] = []
  for (let y = min; y <= max; y++) {
    const key = String(y)
    result.push(makeBucket(key, key, new Date(y, 0, 1), byYear.get(key) ?? []))
  }
  return result
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
  stock_pct: number | null
  mf_pct: number | null
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
      const stock_pct = log?.stock_pct ?? null
      const mf_pct = log?.mf_pct ?? null
      const nifty50_pct = log?.nifty50_pct ?? null
      return {
        date: d,
        dateStr,
        stock_pct,
        mf_pct,
        nifty50_pct,
        hasData: stock_pct != null || mf_pct != null || nifty50_pct != null,
      }
    })
}
