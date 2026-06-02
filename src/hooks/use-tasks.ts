import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/tasks-api"
import type {
  Task,
  TaskStatus,
  TaskFormData,
} from "@/types/tasks"

export type Columns = Record<TaskStatus, Task[]>

const emptyColumns: Columns = {
  todo: [],
  in_progress: [],
  done: [],
  blocked: [],
}

export function useTasks() {
  const { user } = useAuth()
  const [columns, setColumns] = useState<Columns>(emptyColumns)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      const tasks = await api.fetchBoardTasks(user.id)
      const grouped: Columns = {
        todo: [],
        in_progress: [],
        done: [],
        blocked: [],
      }
      for (const task of tasks) {
        grouped[task.status].push(task)
      }
      // Sort each column by position
      for (const status of Object.keys(grouped) as TaskStatus[]) {
        grouped[status].sort((a, b) => a.position - b.position)
      }
      setColumns(grouped)
    } catch (e) {
      toast.error("Failed to load tasks")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(
    async (formData: TaskFormData) => {
      if (!user) return
      try {
        const task = await api.createTask(user.id, formData)
        await fetchTasks() // Refetch to get tags populated
        toast.success("Task created")
        return task
      } catch (e) {
        toast.error("Failed to create task")
        console.error(e)
      }
    },
    [user, fetchTasks],
  )

  const updateTask = useCallback(
    async (taskId: string, formData: Partial<TaskFormData>, previousStatus?: TaskStatus) => {
      if (!user) return
      try {
        await api.updateTask(taskId, formData, previousStatus)
        await fetchTasks()
        toast.success("Task updated")
      } catch (e) {
        toast.error("Failed to update task")
        console.error(e)
      }
    },
    [user, fetchTasks],
  )

  const moveTask = useCallback(
    async (
      taskId: string,
      newStatus: TaskStatus,
      newPosition: number,
      previousStatus: TaskStatus,
    ) => {
      // Optimistic update
      const prevColumns = { ...columns }
      for (const s of Object.keys(prevColumns) as TaskStatus[]) {
        prevColumns[s] = [...prevColumns[s]]
      }

      setColumns((prev) => {
        const next = { ...prev }
        // Remove from old column
        for (const s of Object.keys(next) as TaskStatus[]) {
          next[s] = next[s].filter((t) => t.id !== taskId)
        }
        // Find the task from previous columns
        let task: Task | undefined
        for (const s of Object.keys(prev) as TaskStatus[]) {
          task = prev[s].find((t) => t.id === taskId)
          if (task) break
        }
        if (task) {
          const updated = { ...task, status: newStatus, position: newPosition }
          next[newStatus] = [...next[newStatus], updated].sort(
            (a, b) => a.position - b.position,
          )
        }
        return next
      })

      try {
        await api.moveTask(taskId, newStatus, newPosition, previousStatus)
      } catch (e) {
        // Rollback
        setColumns(prevColumns)
        toast.error("Failed to move task")
        console.error(e)
      }
    },
    [columns],
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await api.deleteTask(taskId)
        setColumns((prev) => {
          const next = { ...prev }
          for (const s of Object.keys(next) as TaskStatus[]) {
            next[s] = next[s].filter((t) => t.id !== taskId)
          }
          return next
        })
        toast.success("Task deleted")
      } catch (e) {
        toast.error("Failed to delete task")
        console.error(e)
      }
    },
    [],
  )

  return {
    columns,
    loading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    refetch: fetchTasks,
  }
}
