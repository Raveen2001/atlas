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
import type {
  TrackerMeasurement,
  TrackerMeasurementFormData,
} from "@/types/tracker"

interface MeasurementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryName: string
  unit: string
  existingMeasurement: TrackerMeasurement | null
  onSave: (data: TrackerMeasurementFormData) => Promise<void>
  onDelete?: (measurementId: string) => Promise<void>
}

export function MeasurementDialog({
  open,
  onOpenChange,
  categoryName,
  unit,
  existingMeasurement,
  onSave,
  onDelete,
}: MeasurementDialogProps) {
  const [value, setValue] = useState("")
  const [measuredDate, setMeasuredDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  )
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingMeasurement) {
      setValue(existingMeasurement.value.toString())
      setMeasuredDate(existingMeasurement.measured_date)
      setNote(existingMeasurement.note ?? "")
    } else {
      setValue("")
      setMeasuredDate(format(new Date(), "yyyy-MM-dd"))
      setNote("")
    }
  }, [existingMeasurement, open])

  const handleSave = async () => {
    const parsed = parseFloat(value)
    if (!value || isNaN(parsed)) return
    setSaving(true)
    try {
      await onSave({
        value: parsed,
        measured_date: measuredDate,
        note,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingMeasurement || !onDelete) return
    await onDelete(existingMeasurement.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingMeasurement ? "Edit measurement" : `Log ${categoryName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Value ({unit})</label>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && value) {
                  e.preventDefault()
                  handleSave()
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={measuredDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setMeasuredDate(e.target.value)}
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
          {existingMeasurement && onDelete && (
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
            disabled={!value || isNaN(parseFloat(value)) || saving}
            size="sm"
          >
            {saving ? "Saving..." : existingMeasurement ? "Update" : "Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
