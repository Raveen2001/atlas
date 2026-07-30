import { useState, useEffect, useMemo } from "react"
import { Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { StockHolding, StockSet } from "@/lib/stock-utils"

interface SetEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null when creating a new set. */
  existingSet: StockSet | null
  holdings: StockHolding[]
  onSave: (name: string, symbols: string[]) => Promise<boolean>
  onDelete?: (setId: string) => Promise<boolean>
}

export function SetEditorDialog({
  open,
  onOpenChange,
  existingSet,
  holdings,
  onSave,
  onDelete,
}: SetEditorDialogProps) {
  const [name, setName] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setName(existingSet?.name ?? "")
      setSelected(new Set(existingSet?.symbols ?? []))
      setConfirmDelete(false)
    }
  }, [open, existingSet])

  // Current holdings plus any assigned-but-no-longer-held symbols (so stale
  // members can still be unchecked).
  const options = useMemo(() => {
    const heldSymbols = holdings.map((h) => h.symbol)
    const held = new Set(heldSymbols)
    const stale = (existingSet?.symbols ?? []).filter((s) => !held.has(s))
    return [
      ...heldSymbols.map((s) => ({ symbol: s, held: true })),
      ...stale.map((s) => ({ symbol: s, held: false })),
    ]
  }, [holdings, existingSet])

  const toggle = (symbol: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    const ok = await onSave(trimmed, [...selected])
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!existingSet || !onDelete) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    const ok = await onDelete(existingSet.id)
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existingSet ? "Edit set" : "New set"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. Core, Speculative"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Stocks{" "}
              <span className="text-muted-foreground font-normal">
                ({selected.size} selected)
              </span>
            </label>
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No holdings found. Resync from Kite first.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
                {options.map(({ symbol, held }) => {
                  const checked = selected.has(symbol)
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => toggle(symbol)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className={held ? "" : "text-muted-foreground"}>
                        {symbol}
                        {!held && (
                          <span className="text-xs"> · not held</span>
                        )}
                      </span>
                      <span
                        className={`flex size-4 items-center justify-center rounded border ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingSet && onDelete && (
            <Button
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={saving}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {confirmDelete ? "Confirm delete" : "Delete"}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || name.trim().length === 0}
          >
            {existingSet ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
