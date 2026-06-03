import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import { useReminders } from "@/hooks/use-reminders";
import type { Reminder, ReminderFormData } from "@/types/reminders";

export function RemindersPage() {
  const {
    active,
    disabled,
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
  } = useReminders();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const handleSave = async (data: ReminderFormData) => {
    if (editingReminder) {
      await updateReminder(editingReminder.id, data);
    } else {
      await createReminder(data);
    }
  };

  const openCreate = () => {
    setEditingReminder(null);
    setDialogOpen(true);
  };

  const openEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setDialogOpen(true);
  };

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
          <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Reminder
          </Button>
        </div>

        {active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Active
            </h2>
            <div className="space-y-2">
              {active.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={() => openEdit(reminder)}
                  onToggle={() => toggleReminder(reminder.id, false)}
                />
              ))}
            </div>
          </div>
        )}

        {disabled.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Disabled
            </h2>
            <div className="space-y-2">
              {disabled.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onEdit={() => openEdit(reminder)}
                  onToggle={() => toggleReminder(reminder.id, true)}
                />
              ))}
            </div>
          </div>
        )}

        {active.length === 0 && disabled.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-4">
              No reminders yet. Create one to get notified.
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Create your first reminder
            </Button>
          </div>
        )}
      </div>

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={editingReminder}
        onSave={handleSave}
        onDelete={editingReminder ? deleteReminder : undefined}
      />
    </>
  );
}
