import { format } from "date-fns"
import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import type { RealisedTrade } from "@/types/investments"

interface RealisedTradesListProps {
  trades: RealisedTrade[]
}

const qtyFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
})

const priceFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function RealisedTradesList({ trades }: RealisedTradesListProps) {
  return (
    <div className="space-y-1">
      {trades.slice(0, 20).map((trade) => (
        <div
          key={trade.order_id}
          className="flex items-center justify-between gap-3 rounded-md px-3 py-2 bg-muted/30"
        >
          <div className="min-w-0">
            <p className="text-sm truncate">
              {trade.kind === "mf" ? (trade.name ?? trade.symbol) : trade.symbol}
              <span className="ml-1.5 text-[10px] font-medium uppercase text-muted-foreground">
                {trade.kind}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(trade.trade_date + "T00:00:00"), "MMM d")}
              {" · "}
              {qtyFormat.format(trade.quantity)}
              {trade.kind === "mf" ? " units" : ""} @{" "}
              {priceFormat.format(trade.avg_buy_price)} →{" "}
              {priceFormat.format(trade.sell_price)}
            </p>
          </div>
          <span
            className={`shrink-0 text-sm font-mono font-medium ${getPnlColor(trade.realised_pnl)}`}
          >
            {formatPnl(trade.realised_pnl)}
          </span>
        </div>
      ))}
    </div>
  )
}
