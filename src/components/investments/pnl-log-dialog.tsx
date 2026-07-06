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
import type { InvestmentLog, InvestmentFormData } from "@/types/investments"

interface PnlLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingLog: InvestmentLog | null
  onSave: (data: InvestmentFormData) => Promise<void>
  onDelete?: (logId: string) => Promise<void>
}

export function PnlLogDialog({
  open,
  onOpenChange,
  existingLog,
  onSave,
  onDelete,
}: PnlLogDialogProps) {
  const [amount, setAmount] = useState("")
  const [isProfit, setIsProfit] = useState(true)
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [returnsPct, setReturnsPct] = useState("")
  const [nifty50Pct, setNifty50Pct] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingLog) {
      const absAmount = Math.abs(existingLog.pnl_amount)
      setAmount(absAmount.toString())
      setIsProfit(existingLog.pnl_amount >= 0)
      setLogDate(existingLog.logged_date)
      setReturnsPct(existingLog.returns_pct != null ? existingLog.returns_pct.toString() : "")
      setNifty50Pct(existingLog.nifty50_pct != null ? existingLog.nifty50_pct.toString() : "")
      setNote(existingLog.note ?? "")
    } else {
      setAmount("")
      setIsProfit(true)
      setLogDate(format(new Date(), "yyyy-MM-dd"))
      setReturnsPct("")
      setNifty50Pct("")
      setNote("")
    }
  }, [existingLog, open])

  const handleSave = async () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed)) return
    setSaving(true)
    try {
      const parsedReturns = returnsPct.trim() !== "" ? parseFloat(returnsPct) : null
      const parsedNifty = nifty50Pct.trim() !== "" ? parseFloat(nifty50Pct) : null
      await onSave({
        logged_date: logDate,
        pnl_amount: isProfit ? Math.abs(parsed) : -Math.abs(parsed),
        returns_pct: parsedReturns != null && !isNaN(parsedReturns) ? parsedReturns : null,
        nifty50_pct: parsedNifty != null && !isNaN(parsedNifty) ? parsedNifty : null,
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
          <DialogTitle>
            {existingLog ? "Edit P&L" : "Log P&L"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsProfit(true)}
                className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                  isProfit
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Profit
              </button>
              <button
                type="button"
                onClick={() => setIsProfit(false)}
                className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                  !isProfit
                    ? "bg-red-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Loss
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && amount) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Your Returns %</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="e.g. 1.25"
                value={returnsPct}
                onChange={(e) => setReturnsPct(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nifty 50 %</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="e.g. 0.85"
                value={nifty50Pct}
                onChange={(e) => setNifty50Pct(e.target.value)}
              />
            </div>
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
          <Button
            onClick={handleSave}
            disabled={!amount || isNaN(parseFloat(amount)) || saving}
            size="sm"
          >
            {saving ? "Saving..." : existingLog ? "Update" : "Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
