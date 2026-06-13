import { useState, useMemo } from "react"
import { Plus, Trophy } from "lucide-react"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { AchievementCard } from "@/components/achievements/achievement-card"
import { AchievementDialog } from "@/components/achievements/achievement-dialog"
import { useAchievements } from "@/hooks/use-achievements"
import type { Achievement, AchievementFormData } from "@/types/achievements"

function formatDateHeading(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return "Today"
  if (isYesterday(d)) return "Yesterday"
  return format(d, "EEEE, MMM d, yyyy")
}

export function AchievementsPage() {
  const { achievements, loading, createAchievement, updateAchievement, deleteAchievement } =
    useAchievements()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, Achievement[]>()
    for (const a of achievements) {
      const list = map.get(a.achieved_date) ?? []
      list.push(a)
      map.set(a.achieved_date, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? -1 : 1))
  }, [achievements])

  const handleSave = async (data: AchievementFormData) => {
    if (editing) {
      await updateAchievement(editing.id, data)
    } else {
      await createAchievement(data)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (achievement: Achievement) => {
    setEditing(achievement)
    setDialogOpen(true)
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
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm mb-4">
              No achievements yet. Log your first win.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Log an achievement
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, items]) => (
              <section key={date} className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {formatDateHeading(date)}
                </h2>
                <div className="space-y-2">
                  {items.map((a) => (
                    <AchievementCard
                      key={a.id}
                      achievement={a}
                      onEdit={() => openEdit(a)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AchievementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        achievement={editing}
        onSave={handleSave}
        onDelete={editing ? deleteAchievement : undefined}
      />
    </>
  )
}
