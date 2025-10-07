import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onSave,
  currentApiKey,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || "");

  const handleSave = () => {
    onSave(apiKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Gemini API 密鑰設置</DialogTitle>
          <DialogDescription>
            輸入你的 Google Gemini API 密鑰以啟用 AI 自動生成單詞詳細信息功能。
            密鑰將安全地存儲在你的瀏覽器本地。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API 密鑰</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="輸入你的 Gemini API 密鑰"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
            <div className="flex-1">
              <p className="font-medium mb-1">如何獲取 API 密鑰？</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>訪問 Google AI Studio</li>
                <li>登入你的 Google 帳號</li>
                <li>點擊「Get API Key」</li>
                <li>創建新的 API 密鑰或使用現有的</li>
                <li>複製密鑰並粘貼到上方</li>
              </ol>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                前往 Google AI Studio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
