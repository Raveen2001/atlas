import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Trash2 } from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TagInput } from "./tag-input"
import { CommentSection } from "./comment-section"
import type {
  Task,
  TaskFormData,
  TaskStatus,
  TaskPriority,
  Tag,
} from "@/types/tasks"
import { STATUS_CONFIG } from "@/types/tasks"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  tags: Tag[]
  onSave: (data: TaskFormData, previousStatus?: TaskStatus) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  onCreateTag: (name: string) => Promise<Tag | null>
  defaultStatus?: TaskStatus
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  tags,
  onSave,
  onDelete,
  onCreateTag,
  defaultStatus = "todo",
}: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
      setTagIds(task.tags.map((t) => t.id))
    } else {
      setTitle("")
      setDescription("")
      setStatus(defaultStatus)
      setPriority("medium")
      setDueDate(undefined)
      setTagIds([])
    }
  }, [task, defaultStatus, open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
          tag_ids: tagIds,
        },
        task?.status,
      )
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    await onDelete(task.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(STATUS_CONFIG) as [TaskStatus, { label: string }][]
                  ).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Due Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date ?? undefined)
                    setCalendarOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setDueDate(undefined)}
                className="text-xs text-muted-foreground"
              >
                Clear date
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <TagInput
              selectedIds={tagIds}
              onChange={setTagIds}
              tags={tags}
              onCreateTag={onCreateTag}
            />
          </div>

          {task && (
            <div className="border-t pt-4">
              <CommentSection taskId={task.id} />
            </div>
          )}
        </div>

        <DialogFooter>
          {task && onDelete && (
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
            disabled={!title.trim() || saving}
            size="sm"
          >
            {saving ? "Saving..." : task ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
