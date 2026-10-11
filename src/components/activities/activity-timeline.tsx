import { format, isSameDay } from "date-fns";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  activityEnd,
  activityMinutes,
  formatDuration,
} from "@/lib/activity-utils";
import type { TimelineItem } from "@/lib/activity-utils";
import { RATING_COLORS } from "@/types/activities";
import type { Activity, CategoryOption, CategoryLookup } from "@/types/activities";

interface ActivityTimelineProps {
  items: TimelineItem[];
  day: Date;
  now: Date;
  getCategory: CategoryLookup;
  onEdit: (activity: Activity) => void;
  onFillGap: (start: Date, minutes: number) => void;
}

export function ActivityTimeline({
  items,
  day,
  now,
  getCategory,
  onEdit,
  onFillGap,
}: ActivityTimelineProps) {
  return (
    <div className="space-y-2">
      {items.map((item) =>
        item.kind === "activity" ? (
          <ActivityRow
            key={item.activity.id}
            activity={item.activity}
            category={getCategory(item.activity.category)}
            day={day}
            now={now}
            onEdit={() => onEdit(item.activity)}
          />
        ) : (
          <button
            key={`gap-${item.start.getTime()}`}
            type="button"
            onClick={() => onFillGap(item.start, Math.round(item.minutes))}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="w-24 shrink-0 font-mono">
              {format(item.start, "HH:mm")} – {format(item.end, "HH:mm")}
            </span>
            <span className="flex-1">
              Untracked {formatDuration(item.minutes)}
            </span>
            <Plus className="h-3.5 w-3.5" />
          </button>
        ),
      )}
    </div>
  );
}

function timeLabel(date: Date, day: Date): string {
  return isSameDay(date, day) ? format(date, "HH:mm") : format(date, "d MMM HH:mm");
}

function ActivityRow({
  activity,
  category: cat,
  day,
  now,
  onEdit,
}: {
  activity: Activity;
  category: CategoryOption;
  day: Date;
  now: Date;
  onEdit: () => void;
}) {
  const Icon = cat.icon;
  const start = new Date(activity.started_at);
  const isRunning = activity.ended_at === null;

  return (
    <Card
      className="cursor-pointer p-0 gap-0 border-l-4"
      style={{ borderLeftColor: RATING_COLORS[activity.rating] }}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
          <p>{timeLabel(start, day)}</p>
          <p>{isRunning ? "now" : timeLabel(activityEnd(activity, now), day)}</p>
        </div>

        <div
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md"
          style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{activity.title}</p>
            {isRunning && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Running
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {cat.label}
            {activity.description && ` · ${activity.description}`}
          </p>
        </div>

        <p className="shrink-0 text-sm font-semibold font-mono">
          {formatDuration(activityMinutes(activity, now))}
        </p>
      </div>
    </Card>
  );
}
