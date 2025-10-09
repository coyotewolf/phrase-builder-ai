import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Brain, Info } from "lucide-react";

interface ReviewModeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: 'traditional' | 'srs') => void;
}

export function ReviewModeSelectionDialog({ 
  open, 
  onOpenChange, 
  onSelect 
}: ReviewModeSelectionDialogProps) {
  const handleSelect = (mode: 'traditional' | 'srs') => {
    onSelect(mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>選擇複習模式</DialogTitle>
          <DialogDescription>
            請選擇你偏好的複習方式，之後可在設定中隨時修改
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button
            variant="outline"
            className="w-full h-auto aspect-square flex-col items-center justify-center gap-2 p-4 text-center"
            onClick={() => handleSelect('traditional')}
          >
            <Calendar className="h-8 w-8" />
            <div className="space-y-1">
              <p className="font-semibold">傳統模式</p>
              <p className="text-xs text-muted-foreground">
                複習前一天的單字
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto aspect-square flex-col items-center justify-center gap-2 p-4 text-center"
            onClick={() => handleSelect('srs')}
          >
            <Brain className="h-8 w-8" />
            <div className="space-y-1">
              <p className="font-semibold">SRS 間隔重複</p>
              <p className="text-xs text-muted-foreground">
                智慧安排複習
              </p>
            </div>
          </Button>
        </div>
        <a
          href="/srs-introduction"
          className="text-xs text-primary hover:underline block text-center mt-3"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/srs-introduction';
          }}
        >
          了解更多關於 SRS 間隔重複系統 →
        </a>

        <div className="flex items-start gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            切換模式時，SRS 記錄將會重置，只保留已複習和未複習的區別
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
