import { useMemo, useState } from "react"
import { Link } from "react-router"
import { ChevronLeft } from "lucide-react"
import { startOfMonth } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { MonthNavigator } from "@/components/investments/month-navigator"
import { YearNavigator } from "@/components/investments/year-navigator"
import { PeriodBarChart } from "@/components/investments/period-bar-chart"
import { PeriodList } from "@/components/investments/period-list"
import { PnlLogDialog } from "@/components/investments/pnl-log-dialog"
import { useInvestments } from "@/hooks/use-investments"
import {
  getDailyBuckets,
  getWeeklyBuckets,
  getMonthlyBuckets,
  getYearlyBuckets,
  formatPnl,
  getPnlColor,
} from "@/lib/investment-utils"
import type { Granularity, PnlBucket } from "@/lib/investment-utils"
import type { InvestmentLog, InvestmentFormData } from "@/types/investments"

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

export function InvestmentsBreakdownPage() {
  const { logs, loading, logPnl, deleteLog } = useInvestments()

  const [granularity, setGranularity] = useState<Granularity>("daily")
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [year, setYear] = useState(new Date().getFullYear())
  const [editingLog, setEditingLog] = useState<InvestmentLog | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const buckets = useMemo(() => {
    switch (granularity) {
      case "daily":
        return getDailyBuckets(logs, month)
      case "weekly":
        return getWeeklyBuckets(logs)
      case "monthly":
        return getMonthlyBuckets(logs, year)
      case "yearly":
        return getYearlyBuckets(logs)
    }
  }, [granularity, logs, month, year])

  const summary = useMemo(() => {
    const withData = buckets.filter((b) => b.dayCount > 0)
    if (withData.length === 0) {
      return { total: 0, avg: 0, best: 0, worst: 0, count: 0 }
    }
    const total = withData.reduce((s, b) => s + b.total, 0)
    const best = Math.max(...withData.map((b) => b.total))
    const worst = Math.min(...withData.map((b) => b.total))
    return {
      total,
      avg: total / withData.length,
      best,
      worst,
      count: withData.length,
    }
  }, [buckets])

  const rangeCaption =
    granularity === "weekly"
      ? "Recent weeks"
      : granularity === "yearly"
        ? "All years"
        : null

  const openDaily = (bucket: PnlBucket) => {
    const log = logs.find((l) => l.logged_date === bucket.key)
    if (!log) return
    setEditingLog(log)
    setDialogOpen(true)
  }

  const handleSave = async (data: InvestmentFormData) => {
    await logPnl(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
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
          <h1 className="text-2xl font-bold tracking-tight">P&L Breakdown</h1>
        </div>

        <SegmentedControl
          options={GRANULARITY_OPTIONS}
          value={granularity}
          onChange={setGranularity}
        />

        {logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No P&L logged yet.
          </div>
        ) : (
          <>
            {/* Period selector / caption */}
            <div className="flex items-center justify-between min-h-8">
              {granularity === "daily" && (
                <MonthNavigator
                  month={month}
                  onMonthChange={setMonth}
                  logs={logs}
                />
              )}
              {granularity === "monthly" && (
                <YearNavigator year={year} onYearChange={setYear} logs={logs} />
              )}
              {rangeCaption && (
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {rangeCaption}
                </span>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
              <SummaryTile label="Total" value={summary.total} colored />
              <SummaryTile label="Avg" value={summary.avg} colored />
              <SummaryTile label="Best" value={summary.best} colored />
              <SummaryTile label="Worst" value={summary.worst} colored />
            </div>

            {/* Bar chart */}
            <Card size="sm">
              <CardContent>
                <PeriodBarChart buckets={buckets} />
              </CardContent>
            </Card>

            {/* Period list */}
            <PeriodList
              buckets={buckets}
              onSelect={granularity === "daily" ? openDaily : undefined}
            />
          </>
        )}
      </div>

      <PnlLogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingLog={editingLog}
        onSave={handleSave}
        onDelete={deleteLog}
      />
    </>
  )
}

function SummaryTile({
  label,
  value,
  colored,
}: {
  label: string
  value: number
  colored?: boolean
}) {
  return (
    <div className="rounded-lg border p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-xs font-mono font-semibold truncate ${
          colored ? getPnlColor(value) : ""
        }`}
      >
        {formatPnl(value)}
      </p>
    </div>
  )
}
