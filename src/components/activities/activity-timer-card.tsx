import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Play, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategorySelect } from "@/components/activities/category-select";
import { formatElapsed } from "@/lib/activity-utils";
import { RATING_COLORS } from "@/types/activities";
import type {
  Activity,
  ActivityCategory,
  CategoryLookup,
  CategoryOption,
  CustomCategory,
  CustomCategoryFormData,
  TimerFormData,
} from "@/types/activities";

interface ActivityTimerCardProps {
  running: Activity | null;
  categories: CategoryOption[];
  getCategory: CategoryLookup;
  onCreateCategory: (
    data: CustomCategoryFormData,
  ) => Promise<CustomCategory | null>;
  onStart: (data: TimerFormData) => Promise<void>;
  onStop: () => Promise<void>;
  onDiscard: () => Promise<void>;
  onEdit: (activity: Activity) => void;
}

export function ActivityTimerCard({
  running,
  categories,
  getCategory,
  onCreateCategory,
  onStart,
  onStop,
  onDiscard,
  onEdit,
}: ActivityTimerCardProps) {
  if (running) {
    return (
      <RunningTimer
        activity={running}
        category={getCategory(running.category)}
        onStop={onStop}
        onDiscard={onDiscard}
        onEdit={() => onEdit(running)}
      />
    );
  }
  return (
    <IdleTimer
      categories={categories}
      getCategory={getCategory}
      onCreateCategory={onCreateCategory}
      onStart={onStart}
    />
  );
}

function IdleTimer({
  categories,
  getCategory,
  onCreateCategory,
  onStart,
}: {
  categories: CategoryOption[];
  getCategory: CategoryLookup;
  onCreateCategory: (
    data: CustomCategoryFormData,
  ) => Promise<CustomCategory | null>;
  onStart: (data: TimerFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("work");
  const [busy, setBusy] = useState(false);

  const canStart = title.trim().length > 0 && !busy;

  const handleStart = async () => {
    if (!canStart) return;
    setBusy(true);
    try {
      await onStart({
        title: title.trim(),
        category,
        rating: getCategory(category).defaultRating,
      });
      setTitle("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3 gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        What are you doing right now?
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Start a timer..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleStart();
          }}
          className="flex-1"
        />
        <div className="flex gap-2">
          <CategorySelect
            value={category}
            options={categories}
            onChange={setCategory}
            onCreateCategory={onCreateCategory}
            className="flex-1 sm:w-40"
          />
          <Button onClick={handleStart} disabled={!canStart}>
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RunningTimer({
  activity,
  category: cat,
  onStop,
  onDiscard,
  onEdit,
}: {
  activity: Activity;
  category: CategoryOption;
  onStop: () => Promise<void>;
  onDiscard: () => Promise<void>;
  onEdit: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const started = new Date(activity.started_at);
  const Icon = cat.icon;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      className="p-3 gap-3 border-l-4"
      style={{ borderLeftColor: RATING_COLORS[activity.rating] }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 min-w-0 items-center gap-3 text-left"
        >
          <div
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-md"
            style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{activity.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              {cat.label} · since {format(started, "HH:mm")}
            </p>
          </div>
        </button>
        <p className="shrink-0 text-xl font-bold font-mono tabular-nums">
          {formatElapsed(now - started.getTime())}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => run(onDiscard)}
        >
          <X className="h-4 w-4 mr-1" />
          Discard
        </Button>
        <Button size="sm" disabled={busy} onClick={() => run(onStop)}>
          <Square className="h-4 w-4 mr-1" />
          Stop
        </Button>
      </div>
    </Card>
  );
}
