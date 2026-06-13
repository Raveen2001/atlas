import { Card } from "@/components/ui/card"
import { AchievementMediaGrid } from "./achievement-media"
import type { Achievement } from "@/types/achievements"

interface AchievementCardProps {
  achievement: Achievement
  onEdit: () => void
}

export function AchievementCard({ achievement, onEdit }: AchievementCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-3 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{achievement.title}</p>
            {achievement.description && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                {achievement.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        </div>

        {achievement.media.length > 0 && (
          <AchievementMediaGrid media={achievement.media} />
        )}
      </div>
    </Card>
  )
}
