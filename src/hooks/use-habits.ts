import { useState, useEffect, useCallback, useMemo } from "react"
import { format, subDays } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import * as api from "@/lib/habits-api"
import {
  calculateCurrentStreak,
  calculateBestStreak,
  isHabitDueOnDate,
} from "@/lib/habit-utils"
import type { Habit, HabitLog, HabitFormData, HabitWithStats } from "@/types/habits"

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([])
  const [allLogs, setAllLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    try {
      const today = format(new Date(), "yyyy-MM-dd")
      const yearAgo = format(subDays(new Date(), 365), "yyyy-MM-dd")

      const [habitsData, todayLogsData, yearLogs] = await Promise.all([
        api.fetchHabits(user.id),
        api.fetchTodayLogs(user.id),
        api.fetchAllHabitLogs(user.id, yearAgo, today),
      ])

      setHabits(habitsData)
      setTodayLogs(todayLogsData)
      setAllLogs(yearLogs)
    } catch (e) {
      toast.error("Failed to load habits")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createHabit = useCallback(
    async (formData: HabitFormData) => {
      if (!user) return
      try {
        await api.createHabit(user.id, formData)
        await fetchAll()
        toast.success("Habit created")
      } catch (e) {
        toast.error("Failed to create habit")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const updateHabit = useCallback(
    async (habitId: string, formData: Partial<HabitFormData>) => {
      if (!user) return
      try {
        await api.updateHabit(habitId, formData)
        await fetchAll()
        toast.success("Habit updated")
      } catch (e) {
        toast.error("Failed to update habit")
        console.error(e)
      }
    },
    [user, fetchAll],
  )

  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        await api.deleteHabit(habitId)
        setHabits((prev) => prev.filter((h) => h.id !== habitId))
        toast.success("Habit deleted")
      } catch (e) {
        toast.error("Failed to delete habit")
        console.error(e)
      }
    },
    [],
  )

  const toggleToday = useCallback(
    async (habitId: string) => {
      if (!user) return
      const today = format(new Date(), "yyyy-MM-dd")

      // Optimistic update
      const isDone = todayLogs.some((l) => l.habit_id === habitId)
      if (isDone) {
        setTodayLogs((prev) => prev.filter((l) => l.habit_id !== habitId))
      } else {
        setTodayLogs((prev) => [
          ...prev,
          {
            id: "temp-" + habitId,
            habit_id: habitId,
            user_id: user.id,
            logged_date: today,
            created_at: new Date().toISOString(),
          },
        ])
      }

      try {
        await api.toggleHabitLog(habitId, user.id, today)
        // Refetch logs to get accurate IDs
        const [updatedToday, updatedAll] = await Promise.all([
          api.fetchTodayLogs(user.id),
          api.fetchAllHabitLogs(
            user.id,
            format(subDays(new Date(), 365), "yyyy-MM-dd"),
            today,
          ),
        ])
        setTodayLogs(updatedToday)
        setAllLogs(updatedAll)
      } catch (e) {
        // Rollback
        await fetchAll()
        toast.error("Failed to update habit")
        console.error(e)
      }
    },
    [user, todayLogs, fetchAll],
  )

  const habitsWithStats: HabitWithStats[] = useMemo(
    () =>
      habits.map((habit) => {
        const habitLogs = allLogs.filter((l) => l.habit_id === habit.id)
        return {
          ...habit,
          logs: habitLogs,
          currentStreak: calculateCurrentStreak(habit, habitLogs),
          bestStreak: calculateBestStreak(habit, habitLogs),
          completedToday: todayLogs.some((l) => l.habit_id === habit.id),
        }
      }),
    [habits, allLogs, todayLogs],
  )

  const todayDue = useMemo(
    () => habitsWithStats.filter((h) => isHabitDueOnDate(h, new Date())),
    [habitsWithStats],
  )

  const todayCompleted = useMemo(
    () => todayDue.filter((h) => h.completedToday).length,
    [todayDue],
  )

  return {
    habits: habitsWithStats,
    todayDue,
    todayCompleted,
    allLogs,
    loading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleToday,
    refetch: fetchAll,
  }
}
