import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Reminder, ReminderFormData, Recurrence } from "@/types/reminders";
import { RECURRENCE_OPTIONS } from "@/types/reminders";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
  onSave: (data: ReminderFormData) => Promise<void>;
  onDelete?: (reminderId: string) => Promise<void>;
}

export function ReminderDialog({
  open,
  onOpenChange,
  reminder,
  onSave,
  onDelete,
}: ReminderDialogProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [remindTime, setRemindTime] = useState("");
  const [remindDate, setRemindDate] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setNote(reminder.note ?? "");
      setRemindTime(reminder.remind_time.slice(0, 5));
      setRemindDate(reminder.remind_date ?? "");
      setRecurrence(reminder.recurrence);
    } else {
      setTitle("");
      setNote("");
      setRemindTime("");
      setRemindDate(format(new Date(), "yyyy-MM-dd"));
      setRecurrence("once");
    }
  }, [reminder, open]);

  const handleSave = async () => {
    if (!title.trim() || !remindTime) return;
    if (recurrence === "once" && !remindDate) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        note: note.trim(),
        remind_time: remindTime,
        remind_date: recurrence === "once" ? remindDate : null,
        recurrence,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!reminder || !onDelete) return;
    await onDelete(reminder.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reminder ? "Edit Reminder" : "New Reminder"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g., Take medicine, Call mom..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim() && remindTime) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <Textarea
              placeholder="Optional details..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Time</label>
            <Input
              type="time"
              value={remindTime}
              onChange={(e) => setRemindTime(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Repeat</label>
            <Select
              value={recurrence}
              onValueChange={(v) => setRecurrence(v as Recurrence)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recurrence === "once" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={remindDate}
                onChange={(e) => setRemindDate(e.target.value)}
                className="w-44"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {reminder && onDelete && (
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
          <Button
            onClick={handleSave}
            disabled={
              !title.trim() ||
              !remindTime ||
              (recurrence === "once" && !remindDate) ||
              saving
            }
            size="sm"
          >
            {saving ? "Saving..." : reminder ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
