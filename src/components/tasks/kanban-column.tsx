import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Circle, Clock, CheckCircle2, Ban } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TaskCard } from "./task-card"
import type { Task, TaskStatus } from "@/types/tasks"
import { STATUS_CONFIG } from "@/types/tasks"

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
  blocked: <Ban className="h-4 w-4" />,
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const { label, color } = STATUS_CONFIG[status]

  return (
    <div className="flex flex-col flex-1 min-w-56 h-full rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 px-2 py-3">
        <span className={color}>{STATUS_ICONS[status]}</span>
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {status === "done" && tasks.length > 0 && (
        <p className="px-2 pb-2 text-xs text-muted-foreground">
          Auto-hidden after 7 days
        </p>
      )}

      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={`space-y-2 p-2 min-h-24 rounded-lg transition-colors ${
            isOver ? "bg-accent/50" : ""
          }`}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  )
}
