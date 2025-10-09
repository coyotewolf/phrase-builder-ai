import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface DailyGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoal: number;
  onSave: (goal: number) => void;
}

export const DailyGoalDialog = ({ open, onOpenChange, currentGoal, onSave }: DailyGoalDialogProps) => {
  const [goal, setGoal] = useState(currentGoal);

  useEffect(() => {
    setGoal(currentGoal);
  }, [currentGoal]);

  const handleSave = () => {
    onSave(goal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>每日目標</DialogTitle>
          <DialogDescription>
            設定你每天想學習的單字數量
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>每日單字數：{goal}</Label>
            <Slider
              value={[goal]}
              onValueChange={(value) => setGoal(value[0])}
              max={200}
              min={10}
              step={5}
            />
          </div>
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
};
