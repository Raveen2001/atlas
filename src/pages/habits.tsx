import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HabitCard } from "@/components/habits/habit-card"
import { HabitDetail } from "@/components/habits/habit-detail"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { useHabits } from "@/hooks/use-habits"
import { isHabitDueOnDate } from "@/lib/habit-utils"
import type { Habit, HabitFormData } from "@/types/habits"

export function HabitsPage() {
  const {
    habits,
    todayDue,
    todayCompleted,
    loading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDate,
  } = useHabits()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSave = async (data: HabitFormData) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data)
    } else {
      await createHabit(data)
    }
  }

  const openCreate = () => {
    setEditingHabit(null)
    setDialogOpen(true)
  }

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const notDueToday = habits.filter((h) => !isHabitDueOnDate(h, new Date()))

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Habit
          </Button>
        </div>

        {/* Today's overview */}
        {todayDue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Today
              </h2>
              <span className="text-sm text-muted-foreground">
                {todayCompleted}/{todayDue.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{
                  width: `${todayDue.length > 0 ? (todayCompleted / todayDue.length) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="space-y-2">
              {todayDue
                .sort((a, b) => {
                  // Show uncompleted first
                  if (a.completedToday !== b.completedToday) {
                    return a.completedToday ? 1 : -1
                  }
                  return 0
                })
                .map((habit) => (
                  <div key={habit.id}>
                    <HabitCard
                      habit={habit}
                      onToggleDate={(date) => toggleDate(habit.id, date)}
                      expanded={expandedId === habit.id}
                      onExpand={() =>
                        setExpandedId(
                          expandedId === habit.id ? null : habit.id,
                        )
                      }
                    />
                    {expandedId === habit.id && (
                      <div className="mt-1 ml-2 border-l-2 border-muted pl-3">
                        <HabitDetail
                          habit={habit}
                          onEdit={() => openEdit(habit)}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Not due today */}
        {notDueToday.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Not due today
            </h2>
            <div className="space-y-2">
              {notDueToday.map((habit) => (
                <div key={habit.id}>
                  <HabitCard
                    habit={habit}
                    onToggleDate={(date) => toggleDate(habit.id, date)}
                    expanded={expandedId === habit.id}
                    onExpand={() =>
                      setExpandedId(
                        expandedId === habit.id ? null : habit.id,
                      )
                    }
                  />
                  {expandedId === habit.id && (
                    <div className="mt-1 ml-2 border-l-2 border-muted pl-3">
                      <HabitDetail
                        habit={habit}
                        onEdit={() => openEdit(habit)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {habits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No habits yet. Start tracking your daily routines.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Create your first habit
            </Button>
          </div>
        )}
      </div>

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editingHabit}
        onSave={handleSave}
        onDelete={editingHabit ? deleteHabit : undefined}
      />
    </>
  )
}
