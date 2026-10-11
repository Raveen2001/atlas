import { useState, useEffect } from "react";
import { addMinutes, format, isSameDay } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CategorySelect } from "@/components/activities/category-select";
import { activityMinutes } from "@/lib/activity-utils";
import type {
  Activity,
  ActivityCategory,
  ActivityFormData,
  ActivityRating,
  CategoryLookup,
  CategoryOption,
  CustomCategory,
  CustomCategoryFormData,
} from "@/types/activities";
import { RATING_OPTIONS } from "@/types/activities";

const DURATION_CHIPS = [15, 30, 45, 60, 90, 120];

export interface ActivityDialogDefaults {
  start: Date;
  minutes?: number;
}

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  defaults: ActivityDialogDefaults;
  categories: CategoryOption[];
  getCategory: CategoryLookup;
  onCreateCategory: (
    data: CustomCategoryFormData,
  ) => Promise<CustomCategory | null>;
  onSave: (data: ActivityFormData) => Promise<void>;
  onDelete?: (activityId: string) => Promise<void>;
}

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  defaults,
  categories,
  getCategory,
  onCreateCategory,
  onSave,
  onDelete,
}: ActivityDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("work");
  const [rating, setRating] = useState<ActivityRating>("productive");
  const [ratingTouched, setRatingTouched] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isRunning = activity !== null && activity.ended_at === null;

  useEffect(() => {
    if (!open) return;
    if (activity) {
      const start = new Date(activity.started_at);
      const mins = Math.round(activityMinutes(activity));
      setTitle(activity.title);
      setCategory(activity.category);
      setRating(activity.rating);
      setRatingTouched(true);
      setDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setHours(String(Math.floor(mins / 60)));
      setMinutes(String(mins % 60));
      setDescription(activity.description ?? "");
    } else {
      const mins = defaults.minutes ?? 30;
      setTitle("");
      setCategory("work");
      setRating(getCategory("work").defaultRating);
      setRatingTouched(false);
      setDate(format(defaults.start, "yyyy-MM-dd"));
      setStartTime(format(defaults.start, "HH:mm"));
      setHours(String(Math.floor(mins / 60)));
      setMinutes(String(mins % 60));
      setDescription("");
    }
    // getCategory is left out so creating a category mid-edit doesn't reset the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, defaults, open]);

  const handleCategoryChange = (value: ActivityCategory) => {
    setCategory(value);
    if (!ratingTouched) setRating(getCategory(value).defaultRating);
  };

  const durationMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const start = date && startTime ? new Date(`${date}T${startTime}`) : null;
  const end = start ? addMinutes(start, durationMinutes) : null;

  const setDuration = (total: number) => {
    setHours(String(Math.floor(total / 60)));
    setMinutes(String(total % 60));
  };

  const canSave =
    title.trim().length > 0 &&
    start !== null &&
    !Number.isNaN(start.getTime()) &&
    (isRunning || durationMinutes > 0);

  const handleSave = async () => {
    if (!canSave || !start || !end) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        rating,
        started_at: start.toISOString(),
        ended_at: isRunning ? null : end.toISOString(),
        description: description.trim(),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activity || !onDelete) return;
    await onDelete(activity.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRunning
              ? "Running Activity"
              : activity
                ? "Edit Activity"
                : "Log Activity"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">What were you doing?</label>
            <Input
              placeholder="e.g., Deep work on Atlas, Instagram scrolling..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!activity}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <CategorySelect
              value={category}
              options={categories}
              onChange={handleCategoryChange}
              onCreateCategory={onCreateCategory}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">How was this time spent?</label>
            <SegmentedControl
              options={RATING_OPTIONS}
              value={rating}
              onChange={(v) => {
                setRating(v);
                setRatingTouched(true);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {!isRunning && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration</label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_CHIPS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDuration(m)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      durationMinutes === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">m</span>
                {start && end && durationMinutes > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ends {format(end, "HH:mm")}
                    {!isSameDay(start, end) && " (next day)"}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          {activity && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={!canSave || saving} size="sm">
            {saving ? "Saving..." : activity ? "Update" : "Log Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
