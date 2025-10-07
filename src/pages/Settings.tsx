import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Globe, Volume2, Bell, Upload, Download, Info } from "lucide-react";
import { db, UserSettings as UserSettingsType } from "@/lib/db";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Settings = () => {
  const [settings, setSettings] = useState<UserSettingsType>({
    id: 'default',
    daily_goal: 100,
    theme: 'dark',
    tts_enabled: true,
  });
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
      window.location.reload();
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("導入數據失敗，請確認文件格式正確");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-center text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* Study Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Study</h2>
          
          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Daily Goal</p>
                  <p className="text-sm text-muted-foreground">{settings.daily_goal} words per day</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Display Direction</p>
                  <p className="text-sm text-muted-foreground">English → Chinese</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Text-to-Speech</p>
                  <p className="text-sm text-muted-foreground">Voice pronunciation settings</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Notifications</h2>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Study Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified when it's time to study</p>
                </div>
              </div>
              <Switch
                checked={false}
                onCheckedChange={() => {}}
              />
            </div>
          </Card>
        </div>

        {/* Data Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Data</h2>
          
          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Import Wordbooks</p>
                  <p className="text-sm text-muted-foreground">Import from CSV file</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4">
            <button className="w-full flex items-center justify-between" onClick={handleExport}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Download className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">Backup your progress</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* About Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">About</h2>
          
          <Card className="p-4">
            <button className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Info className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Vocabulary Flow</p>
                  <p className="text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Footer Description */}
        <div className="text-center space-y-2 py-6">
          <h3 className="font-semibold">Vocabulary Flow</h3>
          <p className="text-sm text-muted-foreground px-4">
            Learn vocabulary efficiently with spaced repetition and AI-powered content generation.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
