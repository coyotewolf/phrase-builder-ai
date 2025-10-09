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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>選擇複習模式</DialogTitle>
          <DialogDescription>
            請選擇你偏好的複習方式，之後可在設定中隨時修改
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          <Button
            variant="outline"
            className="w-full h-auto flex-col items-start gap-2 p-4"
            onClick={() => handleSelect('traditional')}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-semibold">傳統模式</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              複習前一天的單字，適合循序漸進的學習
            </p>
          </Button>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-auto flex-col items-start gap-2 p-4"
              onClick={() => handleSelect('srs')}
            >
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <span className="font-semibold">SRS 間隔重複</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                根據記憶曲線智慧安排複習時間，提升長期記憶效率
              </p>
            </Button>
            <a 
              href="/srs-introduction" 
              className="text-xs text-primary hover:underline block text-center"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/srs-introduction';
              }}
            >
              了解更多關於 SRS 間隔重複系統 →
            </a>
          </div>
        </div>

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
