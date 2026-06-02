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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAG_COLOR_PALETTE } from "@/lib/tag-colors"
import type {
  Habit,
  HabitFormData,
  HabitFrequency,
  DayOfWeek,
} from "@/types/habits"
import { FREQUENCY_CONFIG, DAYS_OF_WEEK, WEEKDAY_DAYS } from "@/types/habits"

interface HabitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
  onSave: (data: HabitFormData) => Promise<void>
  onDelete?: (habitId: string) => Promise<void>
}

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  onSave,
  onDelete,
}: HabitDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [frequencyType, setFrequencyType] =
    useState<HabitFrequency>("daily")
  const [frequencyDays, setFrequencyDays] = useState<DayOfWeek[]>([])
  const [frequencyCount, setFrequencyCount] = useState(3)
  const [reminderTime, setReminderTime] = useState("")
  const [color, setColor] = useState("blue")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setDescription(habit.description ?? "")
      setFrequencyType(habit.frequency_type)
      setFrequencyDays(habit.frequency_days)
      setFrequencyCount(habit.frequency_count)
      setReminderTime(habit.reminder_time?.slice(0, 5) ?? "")
      setColor(habit.color)
    } else {
      setName("")
      setDescription("")
      setFrequencyType("daily")
      setFrequencyDays([])
      setFrequencyCount(3)
      setReminderTime("")
      setColor("blue")
    }
  }, [habit, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      let days = frequencyDays
      if (frequencyType === "weekdays") days = [...WEEKDAY_DAYS]
      if (frequencyType === "daily") days = []

      await onSave({
        name: name.trim(),
        description: description.trim(),
        frequency_type: frequencyType,
        frequency_days: days,
        frequency_count: frequencyCount,
        reminder_time: reminderTime ? reminderTime + ":00" : null,
        color,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!habit || !onDelete) return
    await onDelete(habit.id)
    onOpenChange(false)
  }

  const toggleDay = (day: DayOfWeek) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="e.g., Morning run, Read 30 min..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frequency</label>
            <Select
              value={frequencyType}
              onValueChange={(v) => setFrequencyType(v as HabitFrequency)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(FREQUENCY_CONFIG) as [
                    HabitFrequency,
                    { label: string },
                  ][]
                ).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequencyType === "specific_days" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Days</label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                      frequencyDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequencyType === "times_per_week" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Times per week</label>
              <Select
                value={String(frequencyCount)}
                onValueChange={(v) => setFrequencyCount(Number(v))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reminder time</label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-36"
              />
              {reminderTime && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setReminderTime("")}
                  className="text-xs text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLOR_PALETTE.slice(0, 12).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`h-7 w-7 rounded-full transition-all ${
                    color === c.name
                      ? "ring-2 ring-offset-2 ring-foreground/30 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.text }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          {habit && onDelete && (
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
            disabled={!name.trim() || saving}
            size="sm"
          >
            {saving ? "Saving..." : habit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
