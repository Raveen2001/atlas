import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/achievements-api"
import type { Achievement, AchievementFormData } from "@/types/achievements"

export function useAchievements() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.fetchAchievements(user.id)
      setAchievements(data)
    } catch (e) {
      toast.error("Failed to load achievements")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createAchievement = useCallback(
    async (formData: AchievementFormData) => {
      if (!user) return
      try {
        await api.createAchievement(user.id, formData)
        await fetchAll()
        toast.success("Achievement saved")
      } catch (e) {
        toast.error("Failed to save achievement")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const updateAchievement = useCallback(
    async (id: string, formData: AchievementFormData) => {
      if (!user) return
      try {
        await api.updateAchievement(id, formData)
        await fetchAll()
        toast.success("Achievement updated")
      } catch (e) {
        toast.error("Failed to update achievement")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const deleteAchievement = useCallback(
    async (achievement: Achievement) => {
      try {
        await api.deleteAchievement(achievement.id)
        const paths = achievement.media.map((m) => m.path)
        if (paths.length > 0) {
          api
            .deleteAchievementMedia(paths)
            .catch((e) => console.error("media cleanup failed", e))
        }
        setAchievements((prev) => prev.filter((a) => a.id !== achievement.id))
        toast.success("Achievement deleted")
      } catch (e) {
        toast.error("Failed to delete achievement")
        console.error(e)
      }
    },
    [],
  )

  return {
    achievements,
    loading,
    createAchievement,
    updateAchievement,
    deleteAchievement,
  }
}
