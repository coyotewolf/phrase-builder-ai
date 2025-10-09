import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentApiKey?: string;
  onSave: (apiKey: string) => void;
}

export const ApiKeyDialog = ({ open, onOpenChange, currentApiKey, onSave }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || "");

  useEffect(() => {
    setApiKey(currentApiKey || "");
  }, [currentApiKey, open]);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    onSave(apiKey.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Gemini API 金鑰</DialogTitle>
          <DialogDescription>
            輸入你的 Google Gemini API 金鑰以啟用 AI 功能
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 金鑰</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="輸入你的 Gemini API 金鑰"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              從{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
              取得你的 API 金鑰
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            儲存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
