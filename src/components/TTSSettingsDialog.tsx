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
import { Switch } from "@/components/ui/switch";
import { Volume2 } from "lucide-react";
import { playPronunciation } from "@/lib/tts";

interface TTSSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: {
    enabled: boolean;
    voice: string;
    autoPlay: boolean;
  };
  onSave: (settings: { enabled: boolean; voice: string; autoPlay: boolean }) => void;
}

export function TTSSettingsDialog({
  open,
  onOpenChange,
  currentSettings = { enabled: true, voice: "en-US", autoPlay: false },
  onSave,
}: TTSSettingsDialogProps) {
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [voice, setVoice] = useState(currentSettings.voice);
  const [autoPlay, setAutoPlay] = useState(currentSettings.autoPlay);

  const handleSave = () => {
    onSave({ enabled, voice, autoPlay });
    onOpenChange(false);
  };

  const testVoice = (testVoice: string) => {
    playPronunciation("Hello, this is a test pronunciation", testVoice as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>語音播放設定</DialogTitle>
          <DialogDescription>
            設定單字學習的語音發音
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>啟用語音播放</Label>
              <p className="text-sm text-muted-foreground">
                開啟語音發音
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-3">
                <Label>語音腔調</Label>
                <RadioGroup value={voice} onValueChange={setVoice}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="en-US" id="en-US" />
                      <Label htmlFor="en-US" className="cursor-pointer">
                        美式英文
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testVoice("en-US")}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="en-GB" id="en-GB" />
                      <Label htmlFor="en-GB" className="cursor-pointer">
                        英式英文
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testVoice("en-GB")}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自動播放</Label>
                  <p className="text-sm text-muted-foreground">
                    卡片顯示時自動播放發音
                  </p>
                </div>
                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
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
