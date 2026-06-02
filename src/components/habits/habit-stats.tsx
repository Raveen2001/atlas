import { Flame, Trophy, TrendingUp } from "lucide-react"
import { subDays } from "date-fns"
import { calculateCompletionRate } from "@/lib/habit-utils"
import type { HabitWithStats } from "@/types/habits"

interface HabitStatsProps {
  habit: HabitWithStats
}

export function HabitStats({ habit }: HabitStatsProps) {
  const rate = calculateCompletionRate(
    habit,
    habit.logs,
    subDays(new Date(), 30),
    new Date(),
  )

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
        <Flame className="h-4 w-4 text-orange-500 shrink-0" />
        <div>
          <p className="text-lg font-bold font-mono leading-none">
            {habit.currentStreak}
          </p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
        <div>
          <p className="text-lg font-bold font-mono leading-none">
            {habit.bestStreak}
          </p>
          <p className="text-xs text-muted-foreground">Best</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
        <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-lg font-bold font-mono leading-none">{rate}%</p>
          <p className="text-xs text-muted-foreground">30d</p>
        </div>
      </div>
    </div>
  )
}
