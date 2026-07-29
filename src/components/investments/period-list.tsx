import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import type { PnlBucket } from "@/lib/investment-utils"

interface PeriodListProps {
  buckets: PnlBucket[]
  /** Optional row tap handler (used by the Daily view to open the log dialog). */
  onSelect?: (bucket: PnlBucket) => void
  /** Show newest first (default true). */
  newestFirst?: boolean
}

export function PeriodList({
  buckets,
  onSelect,
  newestFirst = true,
}: PeriodListProps) {
  const rows = buckets.filter((b) => b.dayCount > 0)
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nothing logged in this range.
      </p>
    )
  }

  const ordered = newestFirst ? [...rows].reverse() : rows

  return (
    <div className="space-y-1">
      {ordered.map((b) => {
        const inner = (
          <>
            <div>
              <p className="text-sm">{b.label}</p>
              <p className="text-xs text-muted-foreground space-x-1.5">
                {b.stock != null && (
                  <span className={getPnlColor(b.stock)}>
                    S {formatPnl(b.stock)}
                  </span>
                )}
                {b.mf != null && (
                  <span className={getPnlColor(b.mf)}>M {formatPnl(b.mf)}</span>
                )}
                {b.dayCount > 1 && <span>{b.dayCount} days</span>}
              </p>
            </div>
            <span
              className={`text-sm font-mono font-medium ${getPnlColor(b.total)}`}
            >
              {formatPnl(b.total)}
            </span>
          </>
        )

        return onSelect ? (
          <button
            key={b.key}
            type="button"
            onClick={() => onSelect(b)}
            className="w-full flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-left"
          >
            {inner}
          </button>
        ) : (
          <div
            key={b.key}
            className="w-full flex items-center justify-between rounded-md px-3 py-2"
          >
            {inner}
          </div>
        )
      })}
    </div>
  )
}
