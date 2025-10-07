import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface StudyRemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: {
    enabled: boolean;
    time: string;
    days: string[];
  };
  onSave: (settings: { enabled: boolean; time: string; days: string[] }) => void;
}

const WEEKDAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

export function StudyRemindersDialog({
  open,
  onOpenChange,
  currentSettings = { enabled: false, time: "09:00", days: [] },
  onSave,
}: StudyRemindersDialogProps) {
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [time, setTime] = useState(currentSettings.time);
  const [days, setDays] = useState<string[]>(currentSettings.days);

  const handleSave = () => {
    onSave({ enabled, time, days });
    onOpenChange(false);
  };

  const toggleDay = (dayId: string) => {
    setDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Study Reminders</DialogTitle>
          <DialogDescription>
            Get notified when it's time to review your vocabulary
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily study notifications
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Repeat On</Label>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.id}
                      variant={days.includes(day.id) ? "default" : "outline"}
                      size="sm"
                      className="w-14"
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">Note:</p>
                <p>
                  Browser notifications need to be enabled in your device settings.
                  You'll be prompted to allow notifications when you save these settings.
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
