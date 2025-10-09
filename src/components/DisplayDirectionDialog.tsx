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
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>顯示方向</DialogTitle>
          <DialogDescription>
            選擇你在複習時想看到單字的方式
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={direction} onValueChange={setDirection}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="en-zh" id="en-zh" />
              <Label htmlFor="en-zh" className="cursor-pointer">
                英文 → 中文
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="zh-en" id="zh-en" />
              <Label htmlFor="zh-en" className="cursor-pointer">
                中文 → 英文
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="random" id="random" />
              <Label htmlFor="random" className="cursor-pointer">
                隨機 (混合)
              </Label>
            </div>
          </RadioGroup>
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
