import { useMemo, useState } from "react";
import { addDays, startOfDay, startOfWeek } from "date-fns";
import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ActivityDialog } from "@/components/activities/activity-dialog";
import type { ActivityDialogDefaults } from "@/components/activities/activity-dialog";
import { ActivityTimerCard } from "@/components/activities/activity-timer-card";
import { ActivityTimeline } from "@/components/activities/activity-timeline";
import { DayNavigator } from "@/components/activities/day-navigator";
import { DaySummary } from "@/components/activities/day-summary";
import { WeekChart } from "@/components/activities/week-chart";
import { CategoryManagerDialog } from "@/components/activities/category-manager-dialog";
import { useActivities } from "@/hooks/use-activities";
import { useActivityCategories } from "@/hooks/use-activity-categories";
import {
  buildTimeline,
  formatDuration,
  nextStartTime,
  summarizeDay,
  summarizeRange,
  summarizeWeek,
  topWasted,
} from "@/lib/activity-utils";
import type { Activity, ActivityFormData } from "@/types/activities";

type View = "day" | "week";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
];

export function ActivitiesPage() {
  const [view, setView] = useState<View>("day");
  const [day, setDay] = useState(() => startOfDay(new Date()));

  const weekStart = useMemo(
    () => startOfWeek(day, { weekStartsOn: 1 }),
    [day],
  );
  const rangeStart = view === "day" ? day : weekStart;
  const rangeEnd = useMemo(
    () => addDays(rangeStart, view === "day" ? 1 : 7),
    [rangeStart, view],
  );

  const {
    activities,
    running,
    loading,
    now,
    createActivity,
    updateActivity,
    deleteActivity,
    startTimer,
    stopTimer,
    discardTimer,
    refetch,
  } = useActivities(rangeStart, rangeEnd);
  const {
    custom: customCategories,
    options: categoryOptions,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useActivityCategories();
  const [managerOpen, setManagerOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [defaults, setDefaults] = useState<ActivityDialogDefaults>(() => ({
    start: new Date(),
  }));

  const daySummary = useMemo(
    () => summarizeDay(activities, day, now),
    [activities, day, now],
  );
  const timeline = useMemo(
    () => buildTimeline(activities, day, now),
    [activities, day, now],
  );
  const weekSummary = useMemo(
    () => summarizeRange(activities, weekStart, addDays(weekStart, 7), now),
    [activities, weekStart, now],
  );
  const weekDays = useMemo(
    () => summarizeWeek(activities, weekStart, now),
    [activities, weekStart, now],
  );
  const wasters = useMemo(
    () => topWasted(activities, weekStart, addDays(weekStart, 7), now),
    [activities, weekStart, now],
  );

  const openCreate = (start?: Date, minutes?: number) => {
    setEditing(null);
    setDefaults({
      start: start ?? nextStartTime(activities, day, new Date()),
      minutes,
    });
    setDialogOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setDialogOpen(true);
  };

  const handleSave = async (data: ActivityFormData) => {
    if (editing) {
      await updateActivity(editing.id, data);
    } else {
      await createActivity(data);
    }
  };

  const hasDayEntries = timeline.some((i) => i.kind === "activity");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setManagerOpen(true)}
            >
              <Tags className="h-4 w-4 mr-1" />
              Categories
            </Button>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="h-4 w-4 mr-1" />
              Log Activity
            </Button>
          </div>
        </div>

        <ActivityTimerCard
          running={running}
          categories={categoryOptions}
          getCategory={getCategory}
          onCreateCategory={createCategory}
          onStart={startTimer}
          onStop={stopTimer}
          onDiscard={discardTimer}
          onEdit={openEdit}
        />

        <div className="space-y-3">
          <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} />
          <DayNavigator mode={view} date={day} onChange={setDay} />
        </div>

        {view === "day" ? (
          <>
            {daySummary.logged > 0 && (
              <DaySummary summary={daySummary} getCategory={getCategory} />
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Timeline
              </h2>
              {!hasDayEntries && (
                <p className="text-sm text-muted-foreground">
                  Nothing logged yet. Start a timer or tap an untracked block
                  to fill it in.
                </p>
              )}
              <ActivityTimeline
                items={timeline}
                day={day}
                now={now}
                getCategory={getCategory}
                onEdit={openEdit}
                onFillGap={(start, minutes) => openCreate(start, minutes)}
              />
            </div>
          </>
        ) : (
          <>
            <WeekChart
              days={weekDays}
              onSelectDay={(date) => {
                setDay(startOfDay(date));
                setView("day");
              }}
            />

            {weekSummary.logged > 0 && (
              <DaySummary summary={weekSummary} getCategory={getCategory} />
            )}

            {wasters.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Top time-wasters
                </h2>
                {wasters.map((w) => (
                  <div
                    key={w.title.toLowerCase()}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      {w.title}
                      {w.count > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · {w.count}×
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-red-600">
                      {formatDuration(w.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ActivityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={editing}
        defaults={defaults}
        categories={categoryOptions}
        getCategory={getCategory}
        onCreateCategory={createCategory}
        onSave={handleSave}
        onDelete={editing ? deleteActivity : undefined}
      />

      <CategoryManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        custom={customCategories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={async (categoryId) => {
          await deleteCategory(categoryId);
          await refetch();
        }}
      />
    </>
  );
}
