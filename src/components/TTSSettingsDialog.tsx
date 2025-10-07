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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Text-to-Speech Settings</DialogTitle>
          <DialogDescription>
            Configure voice pronunciation for your vocabulary learning
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable TTS</Label>
              <p className="text-sm text-muted-foreground">
                Turn on voice pronunciation
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              <div className="space-y-3">
                <Label>Voice Accent</Label>
                <RadioGroup value={voice} onValueChange={setVoice}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="en-US" id="en-US" />
                      <Label htmlFor="en-US" className="cursor-pointer">
                        American English
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
                        British English
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
                  <Label>Auto-play</Label>
                  <p className="text-sm text-muted-foreground">
                    Play pronunciation automatically when card shows
                  </p>
                </div>
                <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
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
