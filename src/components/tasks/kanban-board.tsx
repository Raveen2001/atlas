import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/hooks/use-tasks"
import { useTags } from "@/hooks/use-tags"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import { TaskDialog } from "./task-dialog"
import type { Task, TaskStatus, TaskFormData } from "@/types/tasks"
import { KANBAN_COLUMNS } from "@/types/tasks"

export function KanbanBoard() {
  const {
    columns,
    loading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useTasks()
  const { tags, createTag } = useTags()

  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Find which column a task belongs to
  const findColumn = useCallback(
    (taskId: string): TaskStatus | null => {
      for (const status of KANBAN_COLUMNS) {
        if (columns[status].some((t) => t.id === taskId)) {
          return status
        }
      }
      return null
    },
    [columns],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const col = findColumn(active.id as string)
    if (col) {
      const task = columns[col].find((t) => t.id === active.id)
      setActiveTask(task ?? null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find source column
    const sourceCol = findColumn(activeId)
    if (!sourceCol) return

    // Determine target column — either the column ID directly or the column containing the over task
    let targetCol: TaskStatus
    if (KANBAN_COLUMNS.includes(overId as TaskStatus)) {
      targetCol = overId as TaskStatus
    } else {
      const col = findColumn(overId)
      if (!col) return
      targetCol = col
    }

    // Calculate new position
    const targetTasks = columns[targetCol].filter((t) => t.id !== activeId)
    let newPosition: number

    if (targetTasks.length === 0) {
      newPosition = 1000
    } else if (overId === targetCol as string) {
      // Dropped on column itself — add to end
      newPosition = targetTasks[targetTasks.length - 1].position + 1000
    } else {
      // Dropped on a specific task
      const overIndex = targetTasks.findIndex((t) => t.id === overId)
      if (overIndex === 0) {
        newPosition = targetTasks[0].position - 1000
      } else if (overIndex === -1) {
        newPosition = targetTasks[targetTasks.length - 1].position + 1000
      } else {
        newPosition = Math.round(
          (targetTasks[overIndex - 1].position +
            targetTasks[overIndex].position) /
            2,
        )
      }
    }

    if (sourceCol !== targetCol || newPosition !== columns[sourceCol].find((t) => t.id === activeId)?.position) {
      moveTask(activeId, targetCol, newPosition, sourceCol)
    }
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
    setDialogOpen(true)
  }

  const handleNewTask = (status: TaskStatus = "todo") => {
    setEditingTask(null)
    setDefaultStatus(status)
    setDialogOpen(true)
  }

  const handleSave = async (
    data: TaskFormData,
    previousStatus?: TaskStatus,
  ) => {
    if (editingTask) {
      await updateTask(editingTask.id, data, previousStatus)
    } else {
      await createTask(data)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={() => handleNewTask("todo")}>
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-8rem)]">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-72">
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        tags={tags}
        onSave={handleSave}
        onDelete={editingTask ? deleteTask : undefined}
        onCreateTag={createTag}
        defaultStatus={defaultStatus}
      />
    </>
  )
}
