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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DisplayDirectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDirection?: string;
  onSave: (direction: string) => void;
}

export function DisplayDirectionDialog({
  open,
  onOpenChange,
  currentDirection = "en-zh",
  onSave,
}: DisplayDirectionDialogProps) {
  const [direction, setDirection] = useState(currentDirection);

  const handleSave = () => {
    onSave(direction);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Display Direction</DialogTitle>
          <DialogDescription>
            Choose how you want to see words during review
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={direction} onValueChange={setDirection}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="en-zh" id="en-zh" />
              <Label htmlFor="en-zh" className="cursor-pointer">
                English → Chinese
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="zh-en" id="zh-en" />
              <Label htmlFor="zh-en" className="cursor-pointer">
                Chinese → English
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="random" id="random" />
              <Label htmlFor="random" className="cursor-pointer">
                Random (Mixed)
              </Label>
            </div>
          </RadioGroup>
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
