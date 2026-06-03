import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import * as api from "@/lib/reminders-api";
import type { Reminder, ReminderFormData } from "@/types/reminders";

export function useReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetchReminders(user.id);
      setReminders(data);
    } catch (e) {
      toast.error("Failed to load reminders");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createReminder = useCallback(
    async (formData: ReminderFormData) => {
      if (!user) return;
      try {
        await api.createReminder(user.id, formData);
        await fetchAll();
        toast.success("Reminder created");
      } catch (e) {
        toast.error("Failed to create reminder");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const updateReminder = useCallback(
    async (reminderId: string, formData: ReminderFormData) => {
      if (!user) return;
      try {
        await api.updateReminder(reminderId, formData);
        await fetchAll();
        toast.success("Reminder updated");
      } catch (e) {
        toast.error("Failed to update reminder");
        console.error(e);
      }
    },
    [user, fetchAll],
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      try {
        await api.deleteReminder(reminderId);
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        toast.success("Reminder deleted");
      } catch (e) {
        toast.error("Failed to delete reminder");
        console.error(e);
      }
    },
    [],
  );

  const toggleReminder = useCallback(
    async (reminderId: string, enabled: boolean) => {
      // Optimistic update
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, enabled } : r)),
      );
      try {
        await api.toggleReminder(reminderId, enabled);
      } catch (e) {
        await fetchAll();
        toast.error("Failed to update reminder");
        console.error(e);
      }
    },
    [fetchAll],
  );

  const active = reminders.filter((r) => r.enabled);
  const disabled = reminders.filter((r) => !r.enabled);

  return {
    reminders,
    active,
    disabled,
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  };
}
