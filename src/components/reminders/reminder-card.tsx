import { Bell, BellOff, Clock, Calendar, Repeat } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import type { Reminder } from "@/types/reminders";

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: () => void;
  onToggle: () => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  once: "Once",
  daily: "Every day",
  weekdays: "Weekdays",
};

export function ReminderCard({ reminder, onEdit, onToggle }: ReminderCardProps) {
  const isPast =
    reminder.recurrence === "once" &&
    reminder.remind_date &&
    reminder.remind_date < format(new Date(), "yyyy-MM-dd");

  return (
    <Card
      className={`overflow-hidden transition-opacity ${
        !reminder.enabled || isPast ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {reminder.enabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
          <p className="text-sm font-medium truncate">{reminder.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {reminder.remind_time.slice(0, 5)}
            </span>
            {reminder.recurrence !== "once" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                {RECURRENCE_LABELS[reminder.recurrence]}
              </span>
            )}
            {reminder.recurrence === "once" && reminder.remind_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(reminder.remind_date + "T00:00:00"), "MMM d")}
              </span>
            )}
          </div>
          {reminder.note && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {reminder.note}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
