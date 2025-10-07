import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Download, Upload, Key, ArrowLeft } from "lucide-react";
import { db, UserSettings as UserSettingsType } from "@/lib/db";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettingsType>({
    id: 'default',
    daily_goal: 20,
    theme: 'system',
    tts_enabled: true,
  });
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await db.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("載入設置失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettingsType>) => {
    try {
      const newSettings = await db.updateUserSettings(updates);
      setSettings(newSettings);
      toast.success("設置已保存");
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("保存設置失敗");
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    updateSettings({ theme: checked ? 'dark' : 'light' });
  };

  const handleDailyGoalChange = (value: number[]) => {
    updateSettings({ daily_goal: value[0] });
  };

  const handleTtsToggle = (checked: boolean) => {
    updateSettings({ tts_enabled: checked });
  };

  const handleApiKeySave = (apiKey: string) => {
    updateSettings({ gemini_api_key: apiKey });
  };

  const handleExport = async () => {
    try {
      const data = await db.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocabulary-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("數據導出成功");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("導出數據失敗");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await db.importAllData(text);
      toast.success("數據導入成功");
      loadSettings();
      window.location.reload(); // Reload to reflect imported data
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("導入數據失敗，請確認文件格式正確");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">設置</h1>
            <p className="text-muted-foreground">個性化你的學習體驗</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">外觀</h2>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>深色模式</Label>
                <p className="text-sm text-muted-foreground">
                  切換應用主題
                </p>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">學習</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>每日學習目標</Label>
                <Slider
                  value={[settings.daily_goal]}
                  onValueChange={handleDailyGoalChange}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  每天學習 {settings.daily_goal} 張卡片
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>語音朗讀</Label>
                  <p className="text-sm text-muted-foreground">
                    自動朗讀單詞發音
                  </p>
                </div>
                <Switch
                  checked={settings.tts_enabled}
                  onCheckedChange={handleTtsToggle}
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">AI 功能</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gemini API 密鑰</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.gemini_api_key
                      ? "已配置（點擊更新）"
                      : "未配置（點擊設置）"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApiKeyDialogOpen(true)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {settings.gemini_api_key ? "更新" : "設置"}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">數據管理</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>導出數據</Label>
                  <p className="text-sm text-muted-foreground">
                    下載所有數據為 JSON 文件
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  導出
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>導入數據</Label>
                  <p className="text-sm text-muted-foreground">
                    從 JSON 文件恢復數據
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    導入
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImport}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        onSave={handleApiKeySave}
        currentApiKey={settings.gemini_api_key}
      />
    </div>
  );
};

export default Settings;
