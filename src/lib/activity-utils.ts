import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  startOfMinute,
} from "date-fns";
import type {
  Activity,
  ActivityCategory,
  ActivityRating,
} from "@/types/activities";

const MS_PER_MIN = 60_000;

export function activityStart(activity: Activity): Date {
  return new Date(activity.started_at);
}

/** A running timer ends "now". */
export function activityEnd(activity: Activity, now: Date = new Date()): Date {
  return activity.ended_at ? new Date(activity.ended_at) : now;
}

export function activityMinutes(
  activity: Activity,
  now: Date = new Date(),
): number {
  const ms =
    activityEnd(activity, now).getTime() - activityStart(activity).getTime();
  return Math.max(0, ms / MS_PER_MIN);
}

/** Minutes of `activity` that fall inside [from, to). */
export function minutesInRange(
  activity: Activity,
  from: Date,
  to: Date,
  now: Date = new Date(),
): number {
  const start = Math.max(activityStart(activity).getTime(), from.getTime());
  const end = Math.min(activityEnd(activity, now).getTime(), to.getTime());
  return Math.max(0, (end - start) / MS_PER_MIN);
}

export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export interface CategoryTotal {
  category: ActivityCategory;
  minutes: number;
}

export interface RangeSummary {
  logged: number;
  byRating: Record<ActivityRating, number>;
  byCategory: CategoryTotal[]; // sorted by minutes desc
  /** Time in the window (up to now) that has no entry. */
  untracked: number;
}

/** Window of the day that has already happened: midnight to min(end of day, now). */
function elapsedWindow(day: Date, now: Date): { from: Date; to: Date } {
  const from = startOfDay(day);
  const dayEnd = addDays(from, 1);
  const to = new Date(Math.min(dayEnd.getTime(), now.getTime()));
  return { from, to: to < from ? from : to };
}

export function summarizeRange(
  activities: Activity[],
  from: Date,
  to: Date,
  now: Date = new Date(),
): RangeSummary {
  const byRating: Record<ActivityRating, number> = {
    productive: 0,
    neutral: 0,
    wasted: 0,
  };
  const byCat = new Map<ActivityCategory, number>();
  let logged = 0;

  for (const a of activities) {
    const mins = minutesInRange(a, from, to, now);
    if (mins <= 0) continue;
    logged += mins;
    byRating[a.rating] += mins;
    byCat.set(a.category, (byCat.get(a.category) ?? 0) + mins);
  }

  const windowEnd = Math.min(to.getTime(), now.getTime());
  const windowMinutes = Math.max(0, (windowEnd - from.getTime()) / MS_PER_MIN);
  const covered = coveredMinutes(activities, from, new Date(windowEnd), now);

  return {
    logged,
    byRating,
    byCategory: [...byCat.entries()]
      .map(([category, minutes]) => ({ category, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    untracked: Math.max(0, windowMinutes - covered),
  };
}

export function summarizeDay(
  activities: Activity[],
  day: Date,
  now: Date = new Date(),
): RangeSummary {
  const from = startOfDay(day);
  return summarizeRange(activities, from, addDays(from, 1), now);
}

/** Union length of entries within [from, to), so overlaps aren't double counted. */
function coveredMinutes(
  activities: Activity[],
  from: Date,
  to: Date,
  now: Date,
): number {
  const intervals = activities
    .map((a) => [
      Math.max(activityStart(a).getTime(), from.getTime()),
      Math.min(activityEnd(a, now).getTime(), to.getTime()),
    ])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let cursor = -Infinity;
  for (const [s, e] of intervals) {
    if (e <= cursor) continue;
    total += e - Math.max(s, cursor);
    cursor = e;
  }
  return total / MS_PER_MIN;
}

export interface WeekDayTotals {
  key: string; // "yyyy-MM-dd"
  label: string; // "Mon"
  date: Date;
  productive: number;
  neutral: number;
  wasted: number;
  total: number;
}

export function summarizeWeek(
  activities: Activity[],
  weekStart: Date,
  now: Date = new Date(),
): WeekDayTotals[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(weekStart), i);
    const { byRating, logged } = summarizeDay(activities, date, now);
    return {
      key: format(date, "yyyy-MM-dd"),
      label: format(date, "EEE"),
      date,
      ...byRating,
      total: logged,
    };
  });
}

export interface WastedTotal {
  title: string;
  minutes: number;
  count: number;
}

/** Wasted entries in [from, to) grouped by title, biggest first. */
export function topWasted(
  activities: Activity[],
  from: Date,
  to: Date,
  now: Date = new Date(),
  limit = 5,
): WastedTotal[] {
  const groups = new Map<string, WastedTotal>();
  for (const a of activities) {
    if (a.rating !== "wasted") continue;
    const mins = minutesInRange(a, from, to, now);
    if (mins <= 0) continue;
    const key = a.title.trim().toLowerCase();
    const g = groups.get(key) ?? { title: a.title.trim(), minutes: 0, count: 0 };
    g.minutes += mins;
    g.count += 1;
    groups.set(key, g);
  }
  return [...groups.values()]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit);
}

export type TimelineItem =
  | { kind: "activity"; activity: Activity }
  | { kind: "gap"; start: Date; end: Date; minutes: number };

/** Day's entries in order, with untracked gaps of at least `minGap` minutes between them. */
export function buildTimeline(
  activities: Activity[],
  day: Date,
  now: Date = new Date(),
  minGap = 30,
): TimelineItem[] {
  const { from, to } = elapsedWindow(day, now);
  const sorted = [...activities].sort(
    (a, b) => activityStart(a).getTime() - activityStart(b).getTime(),
  );

  const items: TimelineItem[] = [];
  let cursor = from;
  const pushGap = (end: Date) => {
    const minutes = (end.getTime() - cursor.getTime()) / MS_PER_MIN;
    if (minutes >= minGap) {
      items.push({ kind: "gap", start: cursor, end, minutes });
    }
  };

  for (const a of sorted) {
    const start = activityStart(a);
    if (start > cursor) pushGap(start < to ? start : to);
    items.push({ kind: "activity", activity: a });
    const end = activityEnd(a, now);
    if (end > cursor) cursor = end;
  }
  if (cursor < to) pushGap(to);

  return items;
}

/** Sensible start for the next manual entry on `day`: right after the last logged entry. */
export function nextStartTime(
  activities: Activity[],
  day: Date,
  now: Date = new Date(),
): Date {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const lastEnd = activities
    .filter((a) => a.ended_at)
    .map((a) => activityEnd(a, now))
    .filter((end) => end >= dayStart && end <= dayEnd && end <= now)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (lastEnd) return startOfMinute(lastEnd);
  if (isSameDay(day, now)) {
    const rounded = startOfMinute(addMinutes(now, -30));
    rounded.setMinutes(rounded.getMinutes() - (rounded.getMinutes() % 5));
    return rounded < dayStart ? dayStart : rounded;
  }
  const nineAm = new Date(dayStart);
  nineAm.setHours(9);
  return nineAm;
}
