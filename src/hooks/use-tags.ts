import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/tasks-api"
import { getNextTagColor } from "@/lib/tag-colors"
import type { Tag } from "@/types/tasks"

export function useTags() {
  const { user } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTagsList = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.fetchTags(user.id)
      setTags(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTagsList()
  }, [fetchTagsList])

  const createTag = useCallback(
    async (name: string) => {
      if (!user) return null
      try {
        const color = getNextTagColor(tags.map((t) => t.color))
        const tag = await api.createTag(user.id, name.trim(), color)
        setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
        return tag
      } catch (e) {
        toast.error("Failed to create tag")
        console.error(e)
        return null
      }
    },
    [user, tags],
  )

  const deleteTag = useCallback(async (tagId: string) => {
    try {
      await api.deleteTag(tagId)
      setTags((prev) => prev.filter((t) => t.id !== tagId))
    } catch (e) {
      toast.error("Failed to delete tag")
      console.error(e)
    }
  }, [])

  return { tags, loading, createTag, deleteTag, refetch: fetchTagsList }
}
