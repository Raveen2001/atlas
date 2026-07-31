import {
  endOfMonth,
  endOfWeek,
  format,
  min,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import type { InvestmentLog } from "@/types/investments"

export type PerformancePeriod = "week" | "month" | "year" | "all"

export interface PerformanceWindow {
  start: Date
  end: Date
}

/**
 * Geometric linking (time-weighted return): Π(1 + pct/100) − 1, returned as a
 * percentage (4.32 = +4.32%). Null entries compound as 0% (flat day).
 */
export function compoundReturns(pcts: Array<number | null>): number {
  let product = 1
  for (const pct of pcts) {
    product *= 1 + (pct ?? 0) / 100
  }
  return (product - 1) * 100
}

/** Inclusive date window for the selected period; end is clamped to today. */
export function getPerformanceWindow(
  period: PerformancePeriod,
  anchor: { week: Date; month: Date; year: number },
  logs: InvestmentLog[],
): PerformanceWindow | null {
  const today = new Date()
  switch (period) {
    case "week": {
      const start = startOfWeek(anchor.week, { weekStartsOn: 1 })
      return { start, end: min([endOfWeek(start, { weekStartsOn: 1 }), today]) }
    }
    case "month": {
      const start = startOfMonth(anchor.month)
      return { start, end: min([endOfMonth(start), today]) }
    }
    case "year": {
      const start = new Date(anchor.year, 0, 1)
      return { start, end: min([new Date(anchor.year, 11, 31), today]) }
    }
    case "all": {
      if (logs.length === 0) return null
      const earliest = logs.reduce((a, b) =>
        a.logged_date < b.logged_date ? a : b,
      )
      return { start: new Date(earliest.logged_date + "T00:00:00"), end: today }
    }
  }
}

/** Logs whose logged_date falls inside the window, sorted ascending. */
export function getLogsInWindow(
  logs: InvestmentLog[],
  window: PerformanceWindow,
): InvestmentLog[] {
  const startStr = format(window.start, "yyyy-MM-dd")
  const endStr = format(window.end, "yyyy-MM-dd")
  return logs
    .filter((l) => l.logged_date >= startStr && l.logged_date <= endStr)
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date))
}

export interface SeriesTWR {
  /** Cumulative period return in %, NOT annualised. */
  twr: number
  /** Days in the window where this series had a non-null return. */
  daysWithData: number
  /** Logged trading days in the window. */
  totalDays: number
  /**
   * Sum of daily ₹ P&L in the window. For Nifty this is the benchmark
   * equivalent: the same invested capital placed in the index instead.
   * Null when no day in the window carries a rupee figure.
   */
  pnlAmount: number | null
}

export interface PerformanceSummary {
  stock: SeriesTWR
  mf: SeriesTWR
  nifty: SeriesTWR
  /** Sum of pnl_amount over the window (stock + MF day P&L). */
  totalPnl: number
  /** Pairwise TWR differences in percentage points. */
  spreads: {
    stockVsNifty: number
    mfVsNifty: number
    stockVsMf: number
  }
  hasAnyData: boolean
}

/** windowLogs must already be filtered + sorted (output of getLogsInWindow). */
export function computePerformanceSummary(
  windowLogs: InvestmentLog[],
): PerformanceSummary {
  let stockProd = 1
  let mfProd = 1
  let niftyProd = 1
  let stockDays = 0
  let mfDays = 0
  let niftyDays = 0
  let stockPnl = 0
  let mfPnl = 0
  let niftyPnl = 0
  let totalPnl = 0
  let hasStockPnl = false
  let hasMfPnl = false
  let hasNiftyPnl = false
  let daysWithAnyPct = 0

  for (const log of windowLogs) {
    const hasStockPct = log.stock_pct != null
    const hasMfPct = log.mf_pct != null
    const hasNiftyPct = log.nifty50_pct != null
    if (!hasStockPct && !hasMfPct && !hasNiftyPct) continue

    daysWithAnyPct++
    totalPnl += log.pnl_amount

    if (hasStockPct) {
      stockProd *= 1 + log.stock_pct! / 100
      stockDays++
      if (log.stock_pnl != null) {
        stockPnl += log.stock_pnl
        hasStockPnl = true
      } else if (log.mf_pnl == null) {
        // Legacy equity-only row
        stockPnl += log.pnl_amount
        hasStockPnl = true
      }
    }
    if (hasMfPct) {
      mfProd *= 1 + log.mf_pct! / 100
      mfDays++
      if (log.mf_pnl != null) {
        mfPnl += log.mf_pnl
        hasMfPnl = true
      }
    }
    if (hasNiftyPct) {
      niftyProd *= 1 + log.nifty50_pct! / 100
      niftyDays++
      if (log.nifty_pnl != null) {
        niftyPnl += log.nifty_pnl
        hasNiftyPnl = true
      }
    }
  }

  const stockTwr = (stockProd - 1) * 100
  const mfTwr = (mfProd - 1) * 100
  const niftyTwr = (niftyProd - 1) * 100

  return {
    stock: {
      twr: stockTwr,
      daysWithData: stockDays,
      totalDays: daysWithAnyPct,
      pnlAmount: hasStockPnl ? stockPnl : null,
    },
    mf: {
      twr: mfTwr,
      daysWithData: mfDays,
      totalDays: daysWithAnyPct,
      pnlAmount: hasMfPnl ? mfPnl : null,
    },
    nifty: {
      twr: niftyTwr,
      daysWithData: niftyDays,
      totalDays: daysWithAnyPct,
      pnlAmount: hasNiftyPnl ? niftyPnl : null,
    },
    totalPnl,
    spreads: {
      stockVsNifty: stockTwr - niftyTwr,
      mfVsNifty: mfTwr - niftyTwr,
      stockVsMf: stockTwr - mfTwr,
    },
    hasAnyData: daysWithAnyPct > 0,
  }
}

export interface PerformancePoint {
  date: Date
  dateStr: string
  /** Cumulative % compounded from the window start through this day. */
  stock: number
  mf: number
  nifty: number
}

/**
 * One point per day that has at least one % logged. Series without a value
 * that day keep their previous cumulative (not treated as 0%).
 */
export function getPerformanceSeries(
  windowLogs: InvestmentLog[],
): PerformancePoint[] {
  let stockProd = 1
  let mfProd = 1
  let niftyProd = 1
  const points: PerformancePoint[] = []

  for (const log of windowLogs) {
    const hasStockPct = log.stock_pct != null
    const hasMfPct = log.mf_pct != null
    const hasNiftyPct = log.nifty50_pct != null
    if (!hasStockPct && !hasMfPct && !hasNiftyPct) continue

    if (hasStockPct) stockProd *= 1 + log.stock_pct! / 100
    if (hasMfPct) mfProd *= 1 + log.mf_pct! / 100
    if (hasNiftyPct) niftyProd *= 1 + log.nifty50_pct! / 100

    points.push({
      date: new Date(log.logged_date + "T00:00:00"),
      dateStr: log.logged_date,
      stock: (stockProd - 1) * 100,
      mf: (mfProd - 1) * 100,
      nifty: (niftyProd - 1) * 100,
    })
  }

  return points
}
