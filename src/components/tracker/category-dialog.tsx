import { useState, useEffect } from "react"
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
  TrackerCategory,
  TrackerCategoryFormData,
} from "@/types/tracker"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCategory: TrackerCategory | null
  onSave: (data: TrackerCategoryFormData) => Promise<void>
  onDelete?: (categoryId: string) => Promise<void>
}

export function CategoryDialog({
  open,
  onOpenChange,
  existingCategory,
  onSave,
  onDelete,
}: CategoryDialogProps) {
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name)
      setUnit(existingCategory.unit)
      setNote(existingCategory.note ?? "")
    } else {
      setName("")
      setUnit("")
      setNote("")
    }
  }, [existingCategory, open])

  const handleSave = async () => {
    if (!name.trim() || !unit.trim()) return
    setSaving(true)
    try {
      await onSave({ name, unit, note })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!existingCategory || !onDelete) return
    if (
      !confirm(
        `Delete "${existingCategory.name}" and all its measurements? This cannot be undone.`,
      )
    ) {
      return
    }
    await onDelete(existingCategory.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingCategory ? "Edit category" : "New category"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g. Weight, Bench Press"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Unit</label>
            <Input
              placeholder="e.g. kg, cm, mins, ₹"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Optional context for this tracker..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {existingCategory && onDelete && (
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
            disabled={!name.trim() || !unit.trim() || saving}
            size="sm"
          >
            {saving ? "Saving..." : existingCategory ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
