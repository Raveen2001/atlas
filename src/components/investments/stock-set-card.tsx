import { useMemo } from "react"
import { MoreHorizontal, Pencil } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StockRow } from "./stock-row"
import { formatPnl, getPnlColor, formatReturnsPct } from "@/lib/investment-utils"
import { aggregateSet, formatCompactInr } from "@/lib/stock-utils"
import type { StockHolding, StockSet } from "@/lib/stock-utils"

interface StockSetCardProps {
  /** Display name; a real set or the synthetic "Ungrouped" bucket. */
  name: string
  symbols: string[]
  holdings: StockHolding[]
  set?: StockSet // absent for the Ungrouped bucket
  onEdit?: (set: StockSet) => void
}

export function StockSetCard({
  name,
  symbols,
  holdings,
  set,
  onEdit,
}: StockSetCardProps) {
  const { members, notHeld, agg } = useMemo(() => {
    const bySymbol = new Map(holdings.map((h) => [h.symbol, h]))
    const members = symbols
      .filter((s) => bySymbol.has(s))
      .map((s) => bySymbol.get(s)!)
      .sort((a, b) => (b.marketValue ?? b.invested) - (a.marketValue ?? a.invested))
    const notHeld = symbols.filter((s) => !bySymbol.has(s))
    return { members, notHeld, agg: aggregateSet(holdings, symbols) }
  }, [holdings, symbols])

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {name}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {agg.heldCount} stock{agg.heldCount !== 1 ? "s" : ""}
          </span>
        </CardTitle>
        {set && onEdit && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    aria-label={`Options for ${name}`}
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(set)}>
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {agg.heldCount > 0 ? (
          <>
            {/* Aggregate strip */}
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {agg.marketValue != null ? "Current · Invested" : "Invested"}
                </p>
                <p className="text-sm font-mono font-semibold">
                  {agg.marketValue != null
                    ? `${formatCompactInr(agg.marketValue)} · ${formatCompactInr(agg.invested)}`
                    : formatCompactInr(agg.invested)}
                </p>
              </div>
              <div className="text-right">
                {agg.unrealisedPnl != null && (
                  <p
                    className={`text-sm font-mono font-semibold ${getPnlColor(agg.unrealisedPnl)}`}
                  >
                    {formatPnl(agg.unrealisedPnl)}
                    {agg.unrealisedPct != null && (
                      <span className="text-xs">
                        {" "}
                        ({formatReturnsPct(agg.unrealisedPct)})
                      </span>
                    )}
                  </p>
                )}
                {agg.dayPnl != null && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Day{" "}
                    <span className={getPnlColor(agg.dayPnl)}>
                      {formatPnl(agg.dayPnl)}
                      {agg.dayPct != null && (
                        <span> ({formatReturnsPct(agg.dayPct)})</span>
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Members */}
            <div className="divide-y divide-border/60">
              {members.map((h) => (
                <StockRow key={h.symbol} holding={h} compact />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-1">
            No stocks in this set yet.
          </p>
        )}

        {notHeld.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Not held: {notHeld.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
