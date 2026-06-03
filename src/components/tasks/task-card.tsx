import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, isPast, isToday, differenceInCalendarDays } from "date-fns"
import { MessageSquare, Calendar, Repeat } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TagBadge } from "./tag-badge"
import { PriorityBadge } from "./priority-badge"
import type { Task } from "@/types/tasks"
import { PRIORITY_CONFIG } from "@/types/tasks"

interface TaskCardProps {
  task: Task
  onClick: () => void
  isOverlay?: boolean
}

export function TaskCard({ task, onClick, isOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const borderClass = PRIORITY_CONFIG[task.priority].borderColor
  const dueDate = task.due_date ? new Date(task.due_date) : null
  const daysLeft = dueDate ? differenceInCalendarDays(dueDate, new Date()) : null
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate)
  const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 1 && !isOverdue

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing p-3 space-y-2 border-l-3 ${borderClass} ${
        isDragging ? "opacity-50" : ""
      } ${isOverlay ? "shadow-lg rotate-2" : "hover:shadow-sm"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {task.due_date && (
          <span
            className={`flex items-center gap-1 font-medium ${
              isOverdue
                ? "text-red-600"
                : isDueSoon
                  ? "text-amber-600"
                  : "text-muted-foreground font-normal"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), "MMM d")}
            {isOverdue && " (overdue)"}
            {isDueSoon && daysLeft === 0 && " (today)"}
            {isDueSoon && daysLeft === 1 && " (1 day left)"}
            {daysLeft !== null && daysLeft > 1 && ` (${daysLeft}d left)`}
          </span>
        )}
        {task.comment_count > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {task.comment_count}
          </span>
        )}
        {task.is_recurring && (
          <span className="flex items-center gap-1 text-blue-500">
            <Repeat className="h-3 w-3" />
          </span>
        )}
      </div>
    </Card>
  )
}
