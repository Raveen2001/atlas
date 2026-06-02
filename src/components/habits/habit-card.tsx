import { Flame, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getTagStyle } from "@/lib/tag-colors"
import { getFrequencyLabel } from "@/lib/habit-utils"
import type { HabitWithStats } from "@/types/habits"

interface HabitCardProps {
  habit: HabitWithStats
  isDueToday: boolean
  onToggle: () => void
  expanded: boolean
  onExpand: () => void
}

export function HabitCard({
  habit,
  isDueToday,
  onToggle,
  expanded,
  onExpand,
}: HabitCardProps) {
  const colorStyle = getTagStyle(habit.color)

  return (
    <Card
      className="overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: colorStyle.bg === "#dbeafe" ? colorStyle.text : colorStyle.text }}
    >
      <div className="flex items-center gap-3 p-3">
        {isDueToday && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              habit.completedToday
                ? "border-green-500 bg-green-500 text-white"
                : "border-muted-foreground/30 hover:border-muted-foreground/50"
            }`}
          >
            {habit.completedToday && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onExpand}
        >
          <p
            className={`text-sm font-medium ${
              habit.completedToday && isDueToday
                ? "line-through text-muted-foreground"
                : ""
            }`}
          >
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
    </Card>
  )
}
