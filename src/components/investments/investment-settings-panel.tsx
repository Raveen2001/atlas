import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  InvestmentSettings,
  InvestmentSettingsFormData,
} from "@/types/investments";
import { DEFAULT_SETTINGS } from "@/types/investments";

interface InvestmentSettingsPanelProps {
  settings: InvestmentSettings | null;
  onUpdate: (data: InvestmentSettingsFormData) => Promise<void>;
}

export function InvestmentSettingsPanel({
  settings,
  onUpdate,
}: InvestmentSettingsPanelProps) {
  const [form, setForm] =
    useState<InvestmentSettingsFormData>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (settings) {
      setForm({
        buy_reminder_enabled: settings.buy_reminder_enabled,
        buy_reminder_time: settings.buy_reminder_time.slice(0, 5),
        log_reminder_enabled: settings.log_reminder_enabled,
        log_reminder_time: settings.log_reminder_time.slice(0, 5),
        followup_enabled: settings.followup_enabled,
        end_of_day_time: settings.end_of_day_time.slice(0, 5),
      });
    }
  }, [settings]);

  const save = useCallback(
    (updates: Partial<InvestmentSettingsFormData>) => {
      const updated = { ...form, ...updates };
      setForm(updated);
      onUpdate(updated);
    },
    [form, onUpdate],
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Buy reminder */}
        <ReminderRow
          label="Buy stocks reminder"
          description="Reminder before market closes"
          enabled={form.buy_reminder_enabled}
          onToggle={(v) => save({ buy_reminder_enabled: v })}
          time={form.buy_reminder_time}
          onTimeChange={(v) => save({ buy_reminder_time: v })}
        />

        <div className="border-t" />

        {/* Log P&L reminder */}
        <ReminderRow
          label="Log P&L reminder"
          description="Reminder to log after market closes"
          enabled={form.log_reminder_enabled}
          onToggle={(v) => save({ log_reminder_enabled: v })}
          time={form.log_reminder_time}
          onTimeChange={(v) => save({ log_reminder_time: v })}
        />

        <div className="border-t" />

        {/* Follow-up reminders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Follow-up reminders</p>
              <p className="text-xs text-muted-foreground">
                Hourly until logged or end of day
              </p>
            </div>
            <ToggleButton
              enabled={form.followup_enabled}
              onToggle={(v) => save({ followup_enabled: v })}
            />
          </div>
          {form.followup_enabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Stop at</span>
              <Input
                type="time"
                value={form.end_of_day_time}
                onChange={(e) => save({ end_of_day_time: e.target.value })}
                className="w-28 h-8 text-sm"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderRow({
  label,
  description,
  enabled,
  onToggle,
  time,
  onTimeChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  time: string;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ToggleButton enabled={enabled} onToggle={onToggle} />
      </div>
      {enabled && (
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-28 h-8 text-sm"
        />
      )}
    </div>
  );
}

function ToggleButton({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
