import { formatPnl, getPnlColor, formatReturnsPct } from "@/lib/investment-utils"
import { formatCompactInr } from "@/lib/stock-utils"
import type { StockHolding } from "@/lib/stock-utils"

interface StockRowProps {
  holding: StockHolding
  bookedPnl?: number
  compact?: boolean
}

const priceFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function StockRow({ holding: h, bookedPnl, compact }: StockRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-3 ${
        compact ? "py-1.5" : "py-2"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{h.symbol}</p>
        <p className="text-xs text-muted-foreground">
          {h.qty} @ ₹{priceFormat.format(h.avgPrice)}
          {h.allocationPct != null && !compact && (
            <span> · {h.allocationPct.toFixed(1)}%</span>
          )}
        </p>
        {bookedPnl != null && bookedPnl !== 0 && !compact && (
          <p className="text-xs text-muted-foreground">
            Booked{" "}
            <span className={getPnlColor(bookedPnl)}>{formatPnl(bookedPnl)}</span>
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        {h.marketValue != null ? (
          <>
            <p className="text-sm font-mono font-medium">
              {formatCompactInr(h.marketValue)}
            </p>
            <p className="text-xs font-mono space-x-1.5">
              {h.unrealisedPnl != null && (
                <span className={getPnlColor(h.unrealisedPnl)}>
                  {formatPnl(h.unrealisedPnl)}
                  {h.unrealisedPct != null && (
                    <span> ({formatReturnsPct(h.unrealisedPct)})</span>
                  )}
                </span>
              )}
            </p>
            {h.dayPnl != null && (
              <p className="text-xs font-mono text-muted-foreground">
                Day{" "}
                <span className={getPnlColor(h.dayPnl)}>
                  {formatPnl(h.dayPnl)}
                  {h.dayPct != null && <span> ({formatReturnsPct(h.dayPct)})</span>}
                </span>
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-mono font-medium">
              {formatCompactInr(h.invested)}
            </p>
            <p className="text-xs text-muted-foreground">invested · no price</p>
          </>
        )}
      </div>
    </div>
  )
}
