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
  { id: "mon", label: "週一" },
  { id: "tue", label: "週二" },
  { id: "wed", label: "週三" },
  { id: "thu", label: "週四" },
  { id: "fri", label: "週五" },
  { id: "sat", label: "週六" },
  { id: "sun", label: "週日" },
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
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>學習提醒</DialogTitle>
          <DialogDescription>
            在該複習單字時收到通知
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>啟用提醒</Label>
              <p className="text-sm text-muted-foreground">
                接收每日學習通知
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reminder-time">提醒時間</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>重複</Label>
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
                <p className="font-medium mb-1">注意：</p>
                <p>
                  瀏覽器通知需要在你的設備設定中啟用。
                  當你保存這些設定時，將會提示你允許通知。
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
