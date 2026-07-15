import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatPnl, getPnlColor } from "@/lib/investment-utils"
import type { InvestmentLog, InvestmentFormData } from "@/types/investments"

interface PnlLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingLog: InvestmentLog | null
  onSave: (data: InvestmentFormData) => Promise<void>
  onDelete?: (logId: string) => Promise<void>
}

// A labelled numeric input paired with a +/− sign toggle. The value is kept
// as an absolute-value string; the sign lives in `positive`.
function SignedField({
  label,
  value,
  positive,
  onValueChange,
  onToggle,
  onEnter,
}: {
  label: string
  value: string
  positive: boolean
  onValueChange: (v: string) => void
  onToggle: () => void
  onEnter?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onToggle}
          className={`h-9 w-9 shrink-0 rounded-md text-sm font-bold transition-colors ${
            positive ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {positive ? "+" : "−"}
        </button>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault()
              onEnter()
            }
          }}
          className="min-w-0"
        />
      </div>
    </div>
  )
}

// Absolute-value string + sign → a signed number, or null when blank/invalid.
function toSigned(value: string, positive: boolean): number | null {
  const t = value.trim()
  if (t === "") return null
  const n = parseFloat(t)
  if (isNaN(n)) return null
  return positive ? Math.abs(n) : -Math.abs(n)
}

export function PnlLogDialog({
  open,
  onOpenChange,
  existingLog,
  onSave,
  onDelete,
}: PnlLogDialogProps) {
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [stockPnl, setStockPnl] = useState("")
  const [stockPnlPos, setStockPnlPos] = useState(true)
  const [mfPnl, setMfPnl] = useState("")
  const [mfPnlPos, setMfPnlPos] = useState(true)
  const [stockPct, setStockPct] = useState("")
  const [stockPctPos, setStockPctPos] = useState(true)
  const [mfPct, setMfPct] = useState("")
  const [mfPctPos, setMfPctPos] = useState(true)
  const [niftyPct, setNiftyPct] = useState("")
  const [niftyPctPos, setNiftyPctPos] = useState(true)
  const [realisedStock, setRealisedStock] = useState("")
  const [realisedStockPos, setRealisedStockPos] = useState(true)
  const [realisedMf, setRealisedMf] = useState("")
  const [realisedMfPos, setRealisedMfPos] = useState(true)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Populate an absolute-value string field + its sign toggle from a signed
    // number (blank/positive when null).
    const apply = (
      val: number | null | undefined,
      setVal: (v: string) => void,
      setPos: (p: boolean) => void,
    ) => {
      if (val != null) {
        setVal(Math.abs(val).toString())
        setPos(val >= 0)
      } else {
        setVal("")
        setPos(true)
      }
    }

    if (existingLog) {
      setLogDate(existingLog.logged_date)
      // Prefer the explicit stock/MF split; for legacy rows that only have a
      // combined total, seed Stock P&L with it so re-saving preserves the sum.
      const hasSplit =
        existingLog.stock_pnl != null || existingLog.mf_pnl != null
      apply(
        hasSplit ? existingLog.stock_pnl : existingLog.pnl_amount,
        setStockPnl,
        setStockPnlPos,
      )
      apply(hasSplit ? existingLog.mf_pnl : null, setMfPnl, setMfPnlPos)
      apply(existingLog.stock_pct, setStockPct, setStockPctPos)
      apply(existingLog.mf_pct, setMfPct, setMfPctPos)
      apply(existingLog.nifty50_pct, setNiftyPct, setNiftyPctPos)
      apply(existingLog.realised_stock_pnl, setRealisedStock, setRealisedStockPos)
      apply(existingLog.realised_mf_pnl, setRealisedMf, setRealisedMfPos)
      setNote(existingLog.note ?? "")
    } else {
      setLogDate(format(new Date(), "yyyy-MM-dd"))
      apply(null, setStockPnl, setStockPnlPos)
      apply(null, setMfPnl, setMfPnlPos)
      apply(null, setStockPct, setStockPctPos)
      apply(null, setMfPct, setMfPctPos)
      apply(null, setNiftyPct, setNiftyPctPos)
      apply(null, setRealisedStock, setRealisedStockPos)
      apply(null, setRealisedMf, setRealisedMfPos)
      setNote("")
    }
  }, [existingLog, open])

  const stockNum = toSigned(stockPnl, stockPnlPos)
  const mfNum = toSigned(mfPnl, mfPnlPos)
  const hasAnyPnl = stockNum != null || mfNum != null
  const totalPnl = (stockNum ?? 0) + (mfNum ?? 0)

  const handleSave = async () => {
    if (!hasAnyPnl) return
    setSaving(true)
    try {
      const rStock = toSigned(realisedStock, realisedStockPos)
      const rMf = toSigned(realisedMf, realisedMfPos)
      const hasRealised = rStock != null || rMf != null
      await onSave({
        logged_date: logDate,
        pnl_amount: totalPnl,
        stock_pnl: stockNum,
        mf_pnl: mfNum,
        stock_pct: toSigned(stockPct, stockPctPos),
        mf_pct: toSigned(mfPct, mfPctPos),
        nifty50_pct: toSigned(niftyPct, niftyPctPos),
        realised_pnl: hasRealised ? (rStock ?? 0) + (rMf ?? 0) : null,
        realised_stock_pnl: rStock,
        realised_mf_pnl: rMf,
        note: note.trim(),
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingLog || !onDelete) return
    await onDelete(existingLog.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existingLog ? "Edit P&L" : "Log P&L"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <SignedField
              label="Stock P&L"
              value={stockPnl}
              positive={stockPnlPos}
              onValueChange={setStockPnl}
              onToggle={() => setStockPnlPos((p) => !p)}
              onEnter={handleSave}
            />
            <SignedField
              label="MF P&L"
              value={mfPnl}
              positive={mfPnlPos}
              onValueChange={setMfPnl}
              onToggle={() => setMfPnlPos((p) => !p)}
              onEnter={handleSave}
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">
              Total P&L
            </span>
            <span
              className={`text-sm font-mono font-semibold ${getPnlColor(totalPnl)}`}
            >
              {formatPnl(totalPnl)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SignedField
              label="Stock %"
              value={stockPct}
              positive={stockPctPos}
              onValueChange={setStockPct}
              onToggle={() => setStockPctPos((p) => !p)}
            />
            <SignedField
              label="MF %"
              value={mfPct}
              positive={mfPctPos}
              onValueChange={setMfPct}
              onToggle={() => setMfPctPos((p) => !p)}
            />
            <SignedField
              label="Nifty %"
              value={niftyPct}
              positive={niftyPctPos}
              onValueChange={setNiftyPct}
              onToggle={() => setNiftyPctPos((p) => !p)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SignedField
              label="Realised Stock"
              value={realisedStock}
              positive={realisedStockPos}
              onValueChange={setRealisedStock}
              onToggle={() => setRealisedStockPos((p) => !p)}
            />
            <SignedField
              label="Realised MF"
              value={realisedMf}
              positive={realisedMfPos}
              onValueChange={setRealisedMf}
              onToggle={() => setRealisedMfPos((p) => !p)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={logDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-44"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Optional notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {existingLog && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasAnyPnl || saving} size="sm">
            {saving ? "Saving..." : existingLog ? "Update" : "Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
