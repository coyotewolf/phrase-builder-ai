import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ, Shuffle } from "lucide-react";

interface ReviewModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: 'ordered' | 'random') => void;
  wordbookName: string;
}

export function ReviewModeDialog({
  open,
  onOpenChange,
  onSelect,
  wordbookName,
}: ReviewModeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>選擇複習模式</DialogTitle>
          <DialogDescription>
            你想如何複習「{wordbookName}」？
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="h-auto py-6 justify-start"
            onClick={() => {
              onSelect('ordered');
              onOpenChange(false);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <ArrowDownAZ className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">順序複習</p>
                <p className="text-sm text-muted-foreground">按照單字順序依序複習</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 justify-start"
            onClick={() => {
              onSelect('random');
              onOpenChange(false);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-2xl">
                <Shuffle className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">隨機複習</p>
                <p className="text-sm text-muted-foreground">打亂順序隨機複習</p>
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
