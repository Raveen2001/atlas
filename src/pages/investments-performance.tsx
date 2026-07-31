import { useMemo, useState } from "react"
import { Link } from "react-router"
import { ChevronLeft } from "lucide-react"
import { startOfMonth, startOfWeek } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { MonthNavigator } from "@/components/investments/month-navigator"
import { WeekNavigator } from "@/components/investments/week-navigator"
import { YearNavigator } from "@/components/investments/year-navigator"
import { PerformanceChart } from "@/components/investments/performance-chart"
import { PerformanceSummaryCards } from "@/components/investments/performance-summary"
import { useInvestments } from "@/hooks/use-investments"
import {
  computePerformanceSummary,
  getLogsInWindow,
  getPerformanceSeries,
  getPerformanceWindow,
} from "@/lib/performance-utils"
import type { PerformancePeriod } from "@/lib/performance-utils"

const PERIOD_OPTIONS: { value: PerformancePeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
]

export function InvestmentsPerformancePage() {
  const { logs, loading } = useInvestments()

  const [period, setPeriod] = useState<PerformancePeriod>("month")
  const [week, setWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [year, setYear] = useState(() => new Date().getFullYear())

  const window = useMemo(
    () => getPerformanceWindow(period, { week, month, year }, logs),
    [period, week, month, year, logs],
  )
  const windowLogs = useMemo(
    () => (window ? getLogsInWindow(logs, window) : []),
    [logs, window],
  )
  const summary = useMemo(
    () => computePerformanceSummary(windowLogs),
    [windowLogs],
  )
  const series = useMemo(() => getPerformanceSeries(windowLogs), [windowLogs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link
          to="/investments"
          className="p-1.5 -ml-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Back to investments"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
      </div>

      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={setPeriod}
      />

      {logs.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No P&L logged yet.
        </div>
      ) : (
        <>
          {/* Period selector / caption */}
          <div className="flex items-center justify-between min-h-8">
            {period === "week" && (
              <WeekNavigator week={week} onWeekChange={setWeek} logs={logs} />
            )}
            {period === "month" && (
              <MonthNavigator
                month={month}
                onMonthChange={setMonth}
                logs={logs}
              />
            )}
            {period === "year" && (
              <YearNavigator year={year} onYearChange={setYear} logs={logs} />
            )}
            {period === "all" && (
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                All time
              </span>
            )}
          </div>

          {!summary.hasAnyData ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No returns data for this period.
            </div>
          ) : (
            <>
              <PerformanceSummaryCards summary={summary} />

              {series.length >= 2 && (
                <Card size="sm">
                  <CardContent>
                    <PerformanceChart data={series} />
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted-foreground">
                Only days with a logged % are included. Rupee figures are the
                sum of daily P&L on those days; the Nifty 50 amount is that
                day's index move applied to your invested value, i.e. the same
                money held in the index instead. % is time-weighted return
                (daily % compounded), not annualised.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
