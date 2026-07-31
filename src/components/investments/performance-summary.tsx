import {
  formatPnl,
  formatReturnsPct,
  getPnlColor,
  getReturnsColor,
} from "@/lib/investment-utils"
import type { PerformanceSummary, SeriesTWR } from "@/lib/performance-utils"

interface PerformanceSummaryCardsProps {
  summary: PerformanceSummary
}

type RankedSeries = {
  key: "stock" | "mf" | "nifty"
  label: string
  series: SeriesTWR
  rank: number
}

function buildRanking(summary: PerformanceSummary): RankedSeries[] {
  const all: Omit<RankedSeries, "rank">[] = [
    { key: "stock", label: "Stocks", series: summary.stock },
    { key: "mf", label: "MF", series: summary.mf },
    { key: "nifty", label: "Nifty 50", series: summary.nifty },
  ]
  const candidates = all.filter((c) => c.series.daysWithData > 0)

  return [...candidates]
    .sort((a, b) => b.series.twr - a.series.twr)
    .map((c, i) => ({ ...c, rank: i + 1 }))
}

function formatPp(diff: number): string {
  return `${Math.abs(diff).toFixed(2)} pp`
}

function rankWord(rank: number): string {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  return "3rd"
}

export function PerformanceSummaryCards({
  summary,
}: PerformanceSummaryCardsProps) {
  const ranking = buildRanking(summary)

  return (
    <div className="space-y-3">
      {/* Headline: what you made vs the same capital in the index */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              You made
            </p>
            <p className="text-[10px] text-muted-foreground">
              Sum of daily ₹ on days with %
            </p>
          </div>
          <p
            className={`text-xl font-mono font-bold ${getPnlColor(summary.totalPnl)}`}
          >
            {formatPnl(summary.totalPnl)}
          </p>
        </div>

        {summary.nifty.pnlAmount != null && (
          <>
            <div className="flex items-center justify-between gap-3 pt-2 border-t">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nifty 50 would have made
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Same money in the index
                </p>
              </div>
              <p
                className={`text-base font-mono font-semibold ${getPnlColor(summary.nifty.pnlAmount)}`}
              >
                {formatPnl(summary.nifty.pnlAmount)}
              </p>
            </div>

            <VerdictRow
              diff={summary.totalPnl - summary.nifty.pnlAmount}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SeriesTile label="Stocks" series={summary.stock} />
        <SeriesTile label="MF" series={summary.mf} />
        <SeriesTile label="Nifty 50" series={summary.nifty} />
      </div>

      {ranking.length >= 2 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-0.5">
            Standing
          </p>
          {ranking.map((entry) => (
            <RankCard key={entry.key} entry={entry} ranking={ranking} />
          ))}
        </div>
      )}
    </div>
  )
}

function VerdictRow({ diff }: { diff: number }) {
  const even = Math.abs(diff) < 0.005
  const ahead = diff > 0
  return (
    <div
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
        even
          ? "bg-muted text-muted-foreground"
          : ahead
            ? "bg-green-600/10 text-green-700 dark:text-green-400"
            : "bg-red-600/10 text-red-700 dark:text-red-400"
      }`}
    >
      {even
        ? "Matched the index"
        : `${formatPnl(diff)} vs the index — you came out ${ahead ? "ahead" : "behind"}`}
    </div>
  )
}

function SeriesTile({ label, series }: { label: string; series: SeriesTWR }) {
  const hasPct = series.daysWithData > 0
  const hasPnl = series.pnlAmount != null

  return (
    <div className="rounded-lg border p-2 text-center space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {hasPnl ? (
        <p
          className={`text-sm font-mono font-semibold truncate ${getPnlColor(series.pnlAmount!)}`}
        >
          {formatPnl(series.pnlAmount!)}
        </p>
      ) : (
        <p className="text-sm font-mono text-muted-foreground">—</p>
      )}
      <p
        className={`text-xs font-mono truncate ${
          hasPct ? getReturnsColor(series.twr) : "text-muted-foreground"
        }`}
      >
        {hasPct ? formatReturnsPct(series.twr) : "—"}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {hasPct
          ? `${series.daysWithData} of ${series.totalDays} days`
          : `${series.totalDays} days`}
      </p>
    </div>
  )
}

function RankCard({
  entry,
  ranking,
}: {
  entry: RankedSeries
  ranking: RankedSeries[]
}) {
  const others = ranking.filter((r) => r.key !== entry.key)

  const gaps = others.map((other) => {
    const diff = entry.series.twr - other.series.twr
    const ahead = diff > 0
    const even = Math.abs(diff) < 0.005
    if (even) {
      return {
        key: other.key,
        text: `Even with ${other.label}`,
        tone: "muted" as const,
      }
    }
    return {
      key: other.key,
      text: ahead
        ? `${formatPp(diff)} ahead of ${other.label}`
        : `${formatPp(diff)} behind ${other.label}`,
      tone: ahead ? ("up" as const) : ("down" as const),
    }
  })

  return (
    <div className="rounded-lg border px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
              entry.rank === 1
                ? "bg-green-600/15 text-green-700 dark:text-green-400"
                : entry.rank === ranking.length
                  ? "bg-red-600/10 text-red-700 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {rankWord(entry.rank)}
          </span>
          <span className="text-sm font-medium truncate">{entry.label}</span>
        </div>
        <div className="text-right shrink-0">
          {entry.series.pnlAmount != null && (
            <p
              className={`text-sm font-mono font-semibold ${getPnlColor(entry.series.pnlAmount)}`}
            >
              {formatPnl(entry.series.pnlAmount)}
            </p>
          )}
          <p
            className={`text-xs font-mono ${getReturnsColor(entry.series.twr)}`}
          >
            {formatReturnsPct(entry.series.twr)}
          </p>
        </div>
      </div>
      <ul className="space-y-0.5">
        {gaps.map((g) => (
          <li
            key={g.key}
            className={`text-xs ${
              g.tone === "up"
                ? "text-green-700 dark:text-green-400"
                : g.tone === "down"
                  ? "text-red-700 dark:text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            {g.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
