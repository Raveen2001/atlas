import { useState, useEffect, useCallback, useMemo } from "react"
import { Link } from "react-router"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TagBadge } from "@/components/tasks/tag-badge"
import { PriorityBadge } from "@/components/tasks/priority-badge"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/tasks-api"
import type { Task } from "@/types/tasks"

function groupByPeriod(tasks: Task[]) {
  const groups: { label: string; tasks: Task[] }[] = []
  const buckets = new Map<string, Task[]>()

  for (const task of tasks) {
    const date = task.completed_at ? new Date(task.completed_at) : new Date()
    let label: string

    if (isToday(date)) {
      label = "Today"
    } else if (isYesterday(date)) {
      label = "Yesterday"
    } else if (isThisWeek(date)) {
      label = "This Week"
    } else if (isThisMonth(date)) {
      label = "This Month"
    } else {
      label = format(date, "MMMM yyyy")
    }

    if (!buckets.has(label)) {
      buckets.set(label, [])
    }
    buckets.get(label)!.push(task)
  }

  for (const [label, tasks] of buckets) {
    groups.push({ label, tasks })
  }

  return groups
}

export function TasksClosedPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClosed = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.fetchClosedTasks(user.id)
      setTasks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchClosed()
  }, [fetchClosed])

  const groups = useMemo(() => groupByPeriod(tasks), [tasks])

  const reopenTask = async (taskId: string) => {
    try {
      await api.updateTask(taskId, { status: "todo" }, "done")
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success("Task reopened")
    } catch (e) {
      toast.error("Failed to reopen task")
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Completed Tasks</h1>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No completed tasks yet
        </p>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {group.label}
          </h2>

          <div className="relative pl-6 border-l-2 border-border space-y-4">
            {group.tasks.map((task) => (
              <div key={task.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[1.9rem] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-background border-2 border-green-500">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground/70 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={task.priority} />
                      {task.tags.map((tag) => (
                        <TagBadge
                          key={tag.id}
                          name={tag.name}
                          color={tag.color}
                        />
                      ))}
                      {task.completed_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.completed_at), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => reopenTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
