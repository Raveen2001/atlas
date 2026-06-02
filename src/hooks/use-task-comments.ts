import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/tasks-api"
import type { TaskComment } from "@/types/tasks"

export function useTaskComments(taskId: string | null) {
  const { user } = useAuth()
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!taskId) {
      setComments([])
      return
    }
    setLoading(true)
    api
      .fetchComments(taskId)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [taskId])

  const addComment = useCallback(
    async (content: string) => {
      if (!taskId || !user) return
      try {
        const comment = await api.addComment(taskId, user.id, content)
        setComments((prev) => [...prev, comment])
      } catch (e) {
        toast.error("Failed to add comment")
        console.error(e)
      }
    },
    [taskId, user],
  )

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await api.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e) {
      toast.error("Failed to delete comment")
      console.error(e)
    }
  }, [])

  return { comments, loading, addComment, deleteComment }
}
