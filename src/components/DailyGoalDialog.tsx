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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Goal</DialogTitle>
          <DialogDescription>
            Set how many words you want to learn each day
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Words per day: {goal}</Label>
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
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
