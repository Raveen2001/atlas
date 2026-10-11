import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/activities-api";
import type {
  Activity,
  ActivityFormData,
  TimerFormData,
} from "@/types/activities";

export function useActivities(rangeStart: Date, rangeEnd: Date) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [running, setRunning] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const fromMs = rangeStart.getTime();
  const toMs = rangeEnd.getTime();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [inRange, active] = await Promise.all([
        api.fetchActivitiesInRange(user.id, new Date(fromMs), new Date(toMs)),
        api.fetchRunningActivity(user.id),
      ]);
      setActivities(inRange);
      setRunning(active);
      setNow(new Date());
    } catch (e) {
      toast.error("Failed to load activities");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, fromMs, toMs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Keep summaries moving while a timer runs
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [running]);

  const createActivity = useCallback(
    async (formData: ActivityFormData) => {
      if (!user) return;
      try {
        await api.createActivity(user.id, formData);
        await fetchAll();
        toast.success("Activity logged");
      } catch (e) {
        toast.error("Failed to log activity");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const updateActivity = useCallback(
    async (activityId: string, formData: ActivityFormData) => {
      try {
        await api.updateActivity(activityId, formData);
        await fetchAll();
        toast.success("Activity updated");
      } catch (e) {
        toast.error("Failed to update activity");
        console.error(e);
      }
    },
    [fetchAll],
  );

  const deleteActivity = useCallback(
    async (activityId: string) => {
      try {
        await api.deleteActivity(activityId);
        await fetchAll();
        toast.success("Activity deleted");
      } catch (e) {
        toast.error("Failed to delete activity");
        console.error(e);
      }
    },
    [fetchAll],
  );

  const startTimer = useCallback(
    async (formData: TimerFormData) => {
      if (!user) return;
      try {
        await api.startTimer(user.id, formData);
        await fetchAll();
        toast.success("Timer started");
      } catch (e) {
        toast.error("Failed to start timer");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const stopTimer = useCallback(async () => {
    if (!running) return;
    try {
      await api.stopTimer(running.id);
      await fetchAll();
      toast.success("Activity logged");
    } catch (e) {
      toast.error("Failed to stop timer");
      console.error(e);
    }
  }, [running, fetchAll]);

  const discardTimer = useCallback(async () => {
    if (!running) return;
    try {
      await api.deleteActivity(running.id);
      await fetchAll();
      toast.success("Timer discarded");
    } catch (e) {
      toast.error("Failed to discard timer");
      console.error(e);
    }
  }, [running, fetchAll]);

  return {
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
    refetch: fetchAll,
  };
}
