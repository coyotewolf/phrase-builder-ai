import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Globe, Volume2, Bell, Upload, Download, Info, Key } from "lucide-react";
import { db, UserSettings as UserSettingsType } from "@/lib/db";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { DailyGoalDialog } from "@/components/DailyGoalDialog";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { ImportWordbooksDialog } from "@/components/ImportWordbooksDialog";
import { DisplayDirectionDialog } from "@/components/DisplayDirectionDialog";
import { TTSSettingsDialog } from "@/components/TTSSettingsDialog";
import { StudyRemindersDialog } from "@/components/StudyRemindersDialog";

const Settings = () => {
  const [settings, setSettings] = useState<UserSettingsType>({
    id: 'default',
    daily_goal: 100,
    theme: 'dark',
    tts_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyGoalDialogOpen, setIsDailyGoalDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDisplayDirectionDialogOpen, setIsDisplayDirectionDialogOpen] = useState(false);
  const [isTTSDialogOpen, setIsTTSDialogOpen] = useState(false);
  const [isRemindersDialogOpen, setIsRemindersDialogOpen] = useState(false);

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
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">設定</h1>

        {/* Study Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">學習</h2>
          
          <Card className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setIsDailyGoalDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">每日目標</p>
                  <p className="text-sm text-muted-foreground">每天 {settings.daily_goal} 個單字</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4">
            <button 
              className="w-full flex items-center justify-between"
              onClick={() => setIsDisplayDirectionDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">顯示方向</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.display_direction === 'zh-en' ? '中文 → 英文' : 
                     settings.display_direction === 'random' ? '隨機' : '英文 → 中文'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>

          <Card className="p-4">
            <button 
              className="w-full flex items-center justify-between"
              onClick={() => setIsTTSDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Volume2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">語音播放</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.tts_enabled ? '已啟用' : '已停用'} • {settings.tts_voice === 'en-GB' ? '英式' : '美式'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">通知</h2>
          
          <Card className="p-4">
            <button 
              className="w-full flex items-center justify-between"
              onClick={() => setIsRemindersDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">學習提醒</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.reminder_enabled ? `已於 ${settings.reminder_time} 啟用` : '尚未啟用'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* AI API Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">AI API</h2>
          
          <Card className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setIsApiKeyDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Key className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Gemini API 金鑰</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.gemini_api_key ? "已設定" : "未設定"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Data Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">資料</h2>
          
          <Card className="p-4">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">匯入單詞書</p>
                  <p className="text-sm text-muted-foreground">從 CSV 檔案匯入</p>
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
                  <p className="font-medium">匯出資料</p>
                  <p className="text-sm text-muted-foreground">備份你的學習進度</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* About Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">關於</h2>
          
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
            透過間隔重複和 AI 生成內容，高效學習單字。
          </p>
        </div>
      </div>

      <DailyGoalDialog
        open={isDailyGoalDialogOpen}
        onOpenChange={setIsDailyGoalDialogOpen}
        currentGoal={settings.daily_goal}
        onSave={(goal) => updateSettings({ daily_goal: goal })}
      />

      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        currentApiKey={settings.gemini_api_key}
        onSave={(apiKey) => updateSettings({ gemini_api_key: apiKey })}
      />

      <ImportWordbooksDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={() => {
          toast.success("單詞書導入成功");
          loadSettings();
        }}
      />

      <DisplayDirectionDialog
        open={isDisplayDirectionDialogOpen}
        onOpenChange={setIsDisplayDirectionDialogOpen}
        currentDirection={settings.display_direction}
        onSave={(direction) => updateSettings({ display_direction: direction })}
      />

      <TTSSettingsDialog
        open={isTTSDialogOpen}
        onOpenChange={setIsTTSDialogOpen}
        currentSettings={{
          enabled: settings.tts_enabled,
          voice: settings.tts_voice || 'en-US',
          autoPlay: settings.tts_auto_play || false,
        }}
        onSave={(ttsSettings) => updateSettings({
          tts_enabled: ttsSettings.enabled,
          tts_voice: ttsSettings.voice,
          tts_auto_play: ttsSettings.autoPlay,
        })}
      />

      <StudyRemindersDialog
        open={isRemindersDialogOpen}
        onOpenChange={setIsRemindersDialogOpen}
        currentSettings={{
          enabled: settings.reminder_enabled || false,
          time: settings.reminder_time || '09:00',
          days: settings.reminder_days || [],
        }}
        onSave={(reminderSettings) => {
          updateSettings({
            reminder_enabled: reminderSettings.enabled,
            reminder_time: reminderSettings.time,
            reminder_days: reminderSettings.days,
          });
          if (reminderSettings.enabled && 'Notification' in window) {
            Notification.requestPermission();
          }
        }}
      />

      <BottomNav />
    </div>
  );
};

export default Settings;
