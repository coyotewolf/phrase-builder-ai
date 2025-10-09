import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Globe, Volume2, Bell, Upload, Download, Info, Key, Brain } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db, UserSettings as UserSettingsType } from "@/lib/db";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { DailyGoalDialog } from "@/components/DailyGoalDialog";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { ImportWordbooksDialog } from "@/components/ImportWordbooksDialog";
import { DisplayDirectionDialog } from "@/components/DisplayDirectionDialog";
import { TTSSettingsDialog } from "@/components/TTSSettingsDialog";
import { StudyRemindersDialog } from "@/components/StudyRemindersDialog";
import { ReviewModeSelectionDialog } from "@/components/ReviewModeSelectionDialog"; // 引入 ReviewModeSelectionDialog

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettingsType>({
    id: 'default',
    daily_goal: 100,
    theme: 'dark',
    tts_enabled: true,
    review_mode: 'traditional',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyGoalDialogOpen, setIsDailyGoalDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDisplayDirectionDialogOpen, setIsDisplayDirectionDialogOpen] = useState(false);
  const [isTTSDialogOpen, setIsTTSDialogOpen] = useState(false);
  const [isRemindersDialogOpen, setIsRemindersDialogOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importData, setImportData] = useState<{ data: any; event: React.ChangeEvent<HTMLInputElement> } | null>(null);
  const [isReviewModeSelectionOpen, setIsReviewModeSelectionOpen] = useState(false); // 新增狀態來控制 ReviewModeSelectionDialog

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

  const handleReviewModeSelect = async (mode: 'traditional' | 'srs') => {
    try {
      if (settings.review_mode !== mode) {
        // Only reset SRS data if mode is actually changing
        // Reset SRS data: clear all card SRS records
        const allWordbooks = await db.getAllWordbooks();
        for (const wordbook of allWordbooks) {
          const cards = await db.getCardsByWordbook(wordbook.id);
          for (const card of cards) {
            // Reset SRS to default values but keep stats (shown/right/wrong counts)
            await db.createOrUpdateCardSRS(card.id, {
              ease: 2.5,
              interval_days: 1,
              repetitions: 0,
              due_at: new Date().toISOString(),
            });
          }
        }
        await updateSettings({ review_mode: mode });
        toast.success(`已切換至${mode === 'srs' ? 'SRS' : '傳統'}模式，SRS 記錄已重置`);
      }
      setIsReviewModeSelectionOpen(false);
    } catch (error) {
      console.error("Failed to change review mode:", error);
      toast.error("切換模式失敗");
    }
  };

  const handleExport = async () => {
    try {
      toast.info("正在準備導出數據...");
      const data = await db.exportAllData();
      
      // Parse to verify it's valid JSON
      const parsed = JSON.parse(data);
      const totalItems =
        (parsed.wordbooks?.length || 0) +
        (parsed.cards?.length || 0) +
        (parsed.card_stats?.length || 0) +
        (parsed.card_srs?.length || 0);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocabulary-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`數據導出成功！包含 ${parsed.wordbooks?.length || 0} 個單詞書，${parsed.cards?.length || 0} 張卡片`);
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("導出數據失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      toast.error("請選擇 JSON 格式的備份文件");
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error("文件大小超過限制（最大 50MB）");
      return;
    }

    try {
      toast.info("正在讀取文件...");
      const text = await file.text();
      
      // Validate JSON format
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        toast.error("文件格式無效，請確認是正確的備份文件");
        return;
      }

      // Validate data structure
      if (!data.wordbooks && !data.cards) {
        toast.error("備份文件格式不正確");
        return;
      }

      // Show confirmation dialog
      setImportData({ data, event });
      setIsImportConfirmOpen(true);
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("導入數據失敗：" + (error instanceof Error ? error.message : "請確認文件格式正確"));
      // Clear the file input on error
      event.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importData) return;

    try {
      toast.info("正在導入數據，請稍候...");
      const text = await importData.event.target.files![0].text();
      await db.importAllData(text);
      toast.success("數據導入成功！頁面將自動刷新");
      
      // Clear the file input
      importData.event.target.value = '';
      
      // Reset state
      setImportData(null);
      setIsImportConfirmOpen(false);
      
      // Reload settings and page
      await loadSettings();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to import data:", error);
      toast.error("導入數據失敗：" + (error instanceof Error ? error.message : "請確認文件格式正確"));
      if (importData.event.target) {
        importData.event.target.value = '';
      }
      setImportData(null);
      setIsImportConfirmOpen(false);
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
              onClick={() => setIsReviewModeSelectionOpen(true)} // 修改為開啟 ReviewModeSelectionDialog
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">複習模式</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.review_mode === 'srs' ? 'SRS 間隔重複' : '傳統模式（前一天）'}
                  </p>
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
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-backup"
            />
            <button
              className="w-full flex items-center justify-between"
              onClick={() => document.getElementById('import-backup')?.click()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">匯入備份數據</p>
                  <p className="text-sm text-muted-foreground">從 JSON 備份檔案還原</p>
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
                  <p className="text-sm text-muted-foreground">備份你的學習進度到 JSON 檔案</p>
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
            <button
              className="w-full flex items-center justify-between"
              onClick={() => navigate("/about")}
            >
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

      <AlertDialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
          <AlertDialogHeader>
            <AlertDialogTitle>確認導入備份數據</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>即將導入以下備份數據：</p>
              {importData && importData.data && (
                <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                  <p>• 單詞書：{importData.data.wordbooks?.length || 0} 個</p>
                  <p>• 卡片：{importData.data.cards?.length || 0} 張</p>
                  <p>• 統計數據：{importData.data.card_stats?.length || 0} 筆</p>
                  <p>• SRS 記錄：{importData.data.card_srs?.length || 0} 筆</p>
                </div>
              )}
              <p className="text-destructive font-semibold">
                警告：這將清除所有現有數據！
              </p>
              <p>請確保你已經導出並保存了當前的數據備份。</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setImportData(null);
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmImport}
              className="bg-destructive hover:bg-destructive/90"
            >
              確認導入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReviewModeSelectionDialog // 渲染 ReviewModeSelectionDialog
        open={isReviewModeSelectionOpen}
        onOpenChange={setIsReviewModeSelectionOpen}
        onSelect={handleReviewModeSelect}
      />

      <BottomNav />
    </div>
  );
};

export default Settings;
