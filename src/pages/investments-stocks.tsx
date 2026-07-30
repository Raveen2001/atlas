import { useMemo, useState } from "react"
import { Link } from "react-router"
import { format } from "date-fns"
import { ChevronLeft, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { StocksSummaryStrip } from "@/components/investments/stocks-summary-strip"
import { StockRow } from "@/components/investments/stock-row"
import { StockSetCard } from "@/components/investments/stock-set-card"
import { SetEditorDialog } from "@/components/investments/set-editor-dialog"
import { useStocks } from "@/hooks/use-stocks"
import { partitionUngrouped } from "@/lib/stock-utils"
import type { StockSet } from "@/lib/stock-utils"

type View = "all" | "sets"

export function InvestmentsStocksPage() {
  const {
    snapshot,
    holdings,
    sets,
    bookedBySymbol,
    loading,
    resyncing,
    createSet,
    updateSet,
    deleteSet,
    resync,
  } = useStocks()

  const [view, setView] = useState<View>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<StockSet | null>(null)

  const ungrouped = useMemo(
    () => partitionUngrouped(holdings, sets),
    [holdings, sets],
  )

  const hasPrices = holdings.some((h) => h.marketValue != null)
  const today = format(new Date(), "yyyy-MM-dd")
  const isStale = snapshot != null && snapshot.snapshotDate < today

  const openCreate = () => {
    setEditingSet(null)
    setDialogOpen(true)
  }

  const openEdit = (set: StockSet) => {
    setEditingSet(set)
    setDialogOpen(true)
  }

  const handleSave = async (name: string, symbols: string[]) => {
    if (editingSet) return updateSet(editingSet.id, { name, symbols })
    return createSet(name, symbols)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/investments"
              className="p-1.5 -ml-1.5 rounded-md hover:bg-muted transition-colors"
              aria-label="Back to investments"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
          </div>
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
        </div>

        {snapshot == null ? (
          /* Never synced */
          <div className="text-center py-12 space-y-4">
            <p className="text-sm text-muted-foreground">
              No holdings snapshot yet. Connect Kite and run a sync to see your
              stocks here.
            </p>
            <Button onClick={resync} disabled={resyncing}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Resync from Kite
            </Button>
          </div>
        ) : (
          <>
            {/* Freshness / missing-prices notice */}
            {(isStale || !hasPrices) && (
              <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                {!hasPrices
                  ? "This snapshot has no price data — run a resync to fetch prices."
                  : `Prices as of ${format(
                      new Date(snapshot.snapshotDate + "T00:00:00"),
                      "EEE, MMM d",
                    )} — resync for the latest.`}
              </div>
            )}

            <StocksSummaryStrip holdings={holdings} />

            <SegmentedControl<View>
              options={[
                { value: "all", label: "All stocks" },
                { value: "sets", label: "Sets" },
              ]}
              value={view}
              onChange={setView}
            />

            {view === "all" ? (
              holdings.length > 0 ? (
                <div className="divide-y divide-border/60 rounded-lg border">
                  {holdings.map((h) => (
                    <StockRow
                      key={h.symbol}
                      holding={h}
                      bookedPnl={bookedBySymbol[h.symbol]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No stocks held right now.
                </p>
              )
            ) : (
              <div className="space-y-4">
                {sets.map((set) => (
                  <StockSetCard
                    key={set.id}
                    name={set.name}
                    symbols={set.symbols}
                    holdings={holdings}
                    set={set}
                    onEdit={openEdit}
                  />
                ))}

                {ungrouped.length > 0 && (
                  <StockSetCard
                    name="Ungrouped"
                    symbols={ungrouped.map((h) => h.symbol)}
                    holdings={holdings}
                  />
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New set
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SetEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingSet={editingSet}
        holdings={holdings}
        onSave={handleSave}
        onDelete={editingSet ? deleteSet : undefined}
      />
    </>
  )
}
