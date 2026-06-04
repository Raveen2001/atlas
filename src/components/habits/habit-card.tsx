import { Flame, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getTagStyle } from "@/lib/tag-colors"
import { getFrequencyLabel } from "@/lib/habit-utils"
import { HabitWeekView } from "./habit-week-view"
import type { HabitWithStats } from "@/types/habits"

interface HabitCardProps {
  habit: HabitWithStats
  onToggleDate: (date: string) => void
  expanded: boolean
  onExpand: () => void
}

export function HabitCard({
  habit,
  onToggleDate,
  expanded,
  onExpand,
}: HabitCardProps) {
  const colorStyle = getTagStyle(habit.color)

  return (
    <Card
      className="overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: colorStyle.text }}
    >
      <div className="flex items-center gap-3 px-3 pt-3 pb-1">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onExpand}
        >
          <p className="text-sm font-medium">
            {habit.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {getFrequencyLabel(habit)}
            </span>
            {habit.reminder_time && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {habit.reminder_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-orange-500 shrink-0">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold">{habit.currentStreak}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onExpand}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="px-3 pb-3">
        <HabitWeekView habit={habit} onToggleDate={onToggleDate} />
      </div>
    </Card>
  )
}
