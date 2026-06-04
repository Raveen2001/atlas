import { useMemo } from "react"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { isHabitDueOnDate } from "@/lib/habit-utils"
import { getTagStyle } from "@/lib/tag-colors"
import type { HabitWithStats } from "@/types/habits"

const DAY_LABELS: Record<string, string> = {
  "0": "Su",
  "1": "Mo",
  "2": "Tu",
  "3": "We",
  "4": "Th",
  "5": "Fr",
  "6": "Sa",
}

interface HabitWeekViewProps {
  habit: HabitWithStats
  onToggleDate: (date: string) => void
}

export function HabitWeekView({ habit, onToggleDate }: HabitWeekViewProps) {
  const today = format(new Date(), "yyyy-MM-dd")

  const days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 6)
    return eachDayOfInterval({ start, end })
  }, [today])

  const loggedDates = useMemo(
    () => new Set(habit.logs.map((l) => l.logged_date)),
    [habit.logs],
  )

  const colorStyle = getTagStyle(habit.color)

  return (
    <div className="flex justify-between">
      {days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const isDue = isHabitDueOnDate(habit, day)
        const isCompleted = loggedDates.has(dateStr)
        const isToday = dateStr === today
        const label = DAY_LABELS[day.getDay()]

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            <span
              className={`text-[10px] font-medium ${
                isToday ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>

            {isDue ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleDate(dateStr)
                }}
                className="p-0.5"
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? "text-white"
                      : isToday
                        ? "border-2 border-muted-foreground/40"
                        : "border-2 border-muted-foreground/20"
                  }`}
                  style={
                    isCompleted
                      ? { backgroundColor: colorStyle.text }
                      : undefined
                  }
                >
                  {isCompleted && (
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
                </div>
              </button>
            ) : (
              <div className="p-0.5">
                <div className="h-6 w-6 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
