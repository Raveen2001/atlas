import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { HabitStats } from "./habit-stats"
import { HabitHeatmap } from "./habit-heatmap"
import type { HabitWithStats } from "@/types/habits"

interface HabitDetailProps {
  habit: HabitWithStats
  onEdit: () => void
}

export function HabitDetail({ habit, onEdit }: HabitDetailProps) {
  return (
    <div className="space-y-4 px-3 pb-4">
      {habit.description && (
        <p className="text-sm text-muted-foreground">{habit.description}</p>
      )}

      <HabitStats habit={habit} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Activity</h4>
          <Button variant="ghost" size="xs" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
        <HabitHeatmap
          habit={habit}
          logs={habit.logs}
          color={habit.color}
          days={180}
        />
      </div>
    </div>
  )
}
