import { useState, useMemo } from "react"
import { format, startOfMonth } from "date-fns"
import { Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PnlLogDialog } from "@/components/investments/pnl-log-dialog"
import { PnlStats } from "@/components/investments/pnl-stats"
import { PnlHeatmap } from "@/components/investments/pnl-heatmap"
import { PnlBarChart } from "@/components/investments/pnl-bar-chart"
import { MonthNavigator } from "@/components/investments/month-navigator"
import { ReturnsComparisonChart } from "@/components/investments/returns-comparison-chart"
import { RealisedTradesList } from "@/components/investments/realised-trades-list"
import { InvestmentSettingsPanel } from "@/components/investments/investment-settings-panel"
import { useInvestments } from "@/hooks/use-investments"
import {
  formatPnl,
  getPnlColor,
  formatReturnsPct,
  getReturnsColor,
  getReturnsComparisonData,
} from "@/lib/investment-utils"
import type { InvestmentLog, InvestmentFormData } from "@/types/investments"

export function InvestmentsPage() {
  const {
    logs,
    trades,
    settings,
    stats,
    todayLog,
    loading,
    resyncing,
    logPnl,
    resync,
    deleteLog,
    updateSettings,
  } = useInvestments()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<InvestmentLog | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()))

  const returnsData = useMemo(
    () => getReturnsComparisonData(logs, selectedMonth),
    [logs, selectedMonth],
  )

  const monthComparableDays = returnsData.filter(
    (d) => d.stock_pct != null && d.nifty50_pct != null,
  ).length

  const monthBeatDays = returnsData.filter(
    (d) => d.stock_pct != null && d.nifty50_pct != null && d.stock_pct > d.nifty50_pct,
  ).length

  const hasReturnsData = returnsData.some((d) => d.hasData)

  const openCreate = () => {
    setEditingLog(null)
    setDialogOpen(true)
  }

  const openEdit = (log: InvestmentLog) => {
    setEditingLog(log)
    setDialogOpen(true)
  }

  const handleSave = async (data: InvestmentFormData) => {
    await logPnl(data)
  }

  const handleDelete = async (logId: string) => {
    await deleteLog(logId)
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
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Investments</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={resync}
              disabled={resyncing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${resyncing ? "animate-spin" : ""}`}
              />
              {resyncing ? "Syncing…" : "Resync"}
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Log P&L
            </Button>
          </div>
        </div>

        {/* Today status */}
        {todayLog ? (
          <button
            type="button"
            onClick={() => openEdit(todayLog)}
            className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <p className="text-xs text-muted-foreground">Today's P&L</p>
            <p className={`text-2xl font-bold font-mono ${getPnlColor(todayLog.pnl_amount)}`}>
              {formatPnl(todayLog.pnl_amount)}
            </p>
            {(todayLog.stock_pct != null || todayLog.mf_pct != null || todayLog.nifty50_pct != null) && (
              <p className="text-xs text-muted-foreground mt-1 space-x-2">
                {todayLog.stock_pct != null && (
                  <span>
                    Stocks{" "}
                    <span className={getReturnsColor(todayLog.stock_pct)}>
                      {formatReturnsPct(todayLog.stock_pct)}
                    </span>
                  </span>
                )}
                {todayLog.mf_pct != null && (
                  <span>
                    MF{" "}
                    <span className={getReturnsColor(todayLog.mf_pct)}>
                      {formatReturnsPct(todayLog.mf_pct)}
                    </span>
                  </span>
                )}
                {todayLog.nifty50_pct != null && (
                  <span>
                    Nifty{" "}
                    <span className={getReturnsColor(todayLog.nifty50_pct)}>
                      {formatReturnsPct(todayLog.nifty50_pct)}
                    </span>
                  </span>
                )}
              </p>
            )}
            {todayLog.realised_pnl != null && todayLog.realised_pnl !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Booked{" "}
                <span className={getPnlColor(todayLog.realised_pnl)}>
                  {formatPnl(todayLog.realised_pnl)}
                </span>
              </p>
            )}
            {todayLog.note && (
              <p className="text-xs text-muted-foreground mt-1">{todayLog.note}</p>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={openCreate}
            className="w-full rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Today's P&L not logged yet. Tap to log.
          </button>
        )}

        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Overview
          </h2>
          <PnlStats stats={stats} />
        </section>

        {/* Month bar chart with navigation */}
        {logs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                P&L
              </h2>
              <MonthNavigator
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                logs={logs}
              />
            </div>
            <PnlBarChart logs={logs} month={selectedMonth} />
          </section>
        )}

        {/* Returns vs Nifty 50 */}
        {logs.length > 0 && hasReturnsData && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Returns vs Nifty 50
            </h2>
            <ReturnsComparisonChart
              data={returnsData}
              beatDays={monthBeatDays}
              comparableDays={monthComparableDays}
            />
          </section>
        )}

        {/* Heatmap */}
        {logs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Last 12 Months
            </h2>
            <PnlHeatmap logs={logs} />
          </section>
        )}

        {/* Realised trades */}
        {trades.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Realised Trades
            </h2>
            <RealisedTradesList trades={trades} />
          </section>
        )}

        {/* History */}
        {logs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              History
            </h2>
            <div className="space-y-1">
              {logs.slice(0, 30).map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => openEdit(log)}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm">
                      {format(new Date(log.logged_date + "T00:00:00"), "EEE, MMM d")}
                    </p>
                    {(log.stock_pct != null || log.mf_pct != null || log.nifty50_pct != null) && (
                      <p className="text-xs text-muted-foreground space-x-1.5">
                        {log.stock_pct != null && (
                          <span className={getReturnsColor(log.stock_pct)}>
                            S {formatReturnsPct(log.stock_pct)}
                          </span>
                        )}
                        {log.mf_pct != null && (
                          <span className={getReturnsColor(log.mf_pct)}>
                            M {formatReturnsPct(log.mf_pct)}
                          </span>
                        )}
                        {log.nifty50_pct != null && (
                          <span className={getReturnsColor(log.nifty50_pct)}>
                            N {formatReturnsPct(log.nifty50_pct)}
                          </span>
                        )}
                      </p>
                    )}
                    {log.realised_pnl != null && log.realised_pnl !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        Booked{" "}
                        <span className={getPnlColor(log.realised_pnl)}>
                          {formatPnl(log.realised_pnl)}
                        </span>
                      </p>
                    )}
                    {log.note && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {log.note}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-mono font-medium ${getPnlColor(log.pnl_amount)}`}
                  >
                    {formatPnl(log.pnl_amount)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No P&L entries yet. Start tracking your daily trading results.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Log your first P&L
            </Button>
          </div>
        )}

        {/* Reminders */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Reminders
          </h2>
          <InvestmentSettingsPanel
            settings={settings}
            onUpdate={updateSettings}
          />
        </section>
      </div>

      <PnlLogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingLog={editingLog}
        onSave={handleSave}
        onDelete={editingLog ? handleDelete : undefined}
      />
    </>
  )
}
