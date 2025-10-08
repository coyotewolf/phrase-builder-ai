import { useState, useEffect } from "react";
import { Target, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, Card as CardType, CardStats } from "@/lib/db";
import { calculateErrorRate } from "@/lib/srs";
import BottomNav from "@/components/BottomNav";

interface ErrorCard {
  card: CardType;
  stats: CardStats;
  errorRate: number;
}

interface ProgressByLevel {
  level: string;
  current: number;
  total: number;
  percentage: number;
  color: string;
}

type TimeRange = "7days" | "30days" | "all";

const Statistics = () => {
  const [activeTab, setActiveTab] = useState<TimeRange>("7days");
  const [errorCards, setErrorCards] = useState<ErrorCard[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyAccuracy, setWeeklyAccuracy] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>([45, 38, 52, 41, 47, 35, 32]);
  const [progressByLevel, setProgressByLevel] = useState<ProgressByLevel[]>([
    { level: "Beginner", current: 85, total: 100, percentage: 85, color: "bg-teal" },
    { level: "Intermediate", current: 120, total: 150, percentage: 80, color: "bg-yellow" },
    { level: "Advanced", current: 40, total: 80, percentage: 50, color: "bg-destructive" },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [activeTab]);

  /**
   * 計算時間範圍的起始日期
   * 演算法：根據選擇的時間範圍返回對應的起始日期
   * - 7days: 7天前的00:00:00
   * - 30days: 30天前的00:00:00
   * - all: null（表示不限制時間）
   */
  const getStartDate = (range: TimeRange): Date | null => {
    if (range === "all") return null;
    
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const days = range === "7days" ? 7 : 30;
    date.setDate(date.getDate() - days);
    return date;
  };

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      // Get user settings
      const settings = await db.getUserSettings();
      setDailyGoal(settings.daily_goal);

      // Get time range filter
      const startDate = getStartDate(activeTab);

      // 獲取所有單詞書和卡片（優化：一次性載入所有數據）
      const allWordbooks = await db.getAllWordbooks();
      
      // 建立卡片-統計數據的映射表，減少重複查詢
      interface CardWithStats {
        card: CardType;
        stats: CardStats | null;
        wordbook: typeof allWordbooks[0];
      }
      const allCardsWithStats: CardWithStats[] = [];
      
      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          allCardsWithStats.push({ card, stats, wordbook });
        }
      }

      /**
       * 1. 高錯誤率單字卡計算
       * 演算法：錯誤率 = (錯誤次數 / 總顯示次數) × 100%
       * 篩選條件：
       * - 必須有統計數據且顯示次數 > 0
       * - 根據時間範圍篩選（如果有設定）
       * - 錯誤率 > 0
       * 排序：按錯誤率降序排列
       * 取前5名
       */
      const errorCardsData: ErrorCard[] = [];
      
      for (const { card, stats } of allCardsWithStats) {
        if (stats && stats.shown_count > 0) {
          // 時間範圍篩選
          if (startDate && stats.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            if (reviewDate < startDate) continue;
          }
          
          const errorRate = calculateErrorRate(stats.wrong_count, stats.shown_count);
          if (errorRate > 0) {
            errorCardsData.push({ card, stats, errorRate });
          }
        }
      }
      
      errorCardsData.sort((a, b) => b.errorRate - a.errorRate);
      setErrorCards(errorCardsData.slice(0, 5));
      
      /**
       * 2. 今日複習數量
       * 演算法：計算今天（00:00:00 至當前時間）複習過的卡片數量
       * 判斷方式：last_reviewed_at >= 今日00:00:00
       */
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayReviewed = allCardsWithStats.filter(({ stats }) => {
        if (!stats?.last_reviewed_at) return false;
        const reviewDate = new Date(stats.last_reviewed_at);
        return reviewDate >= today;
      });
      
      setTodayCount(todayReviewed.length);
      
      /**
       * 3. 準確率計算
       * 演算法：準確率 = (正確次數總和 / 顯示次數總和) × 100%
       * 時間範圍：根據選擇的tab（7天/30天/全部）
       * 篩選條件：last_reviewed_at 在時間範圍內
       * 四捨五入到整數
       */
      let totalCorrect = 0;
      let totalShown = 0;
      
      for (const { stats } of allCardsWithStats) {
        if (!stats) continue;
        
        // 時間範圍篩選
        if (startDate && stats.last_reviewed_at) {
          const reviewDate = new Date(stats.last_reviewed_at);
          if (reviewDate < startDate) continue;
        }
        
        totalCorrect += stats.right_count || 0;
        totalShown += stats.shown_count || 0;
      }
      
      const accuracy = totalShown > 0 ? Math.round((totalCorrect / totalShown) * 100) : 0;
      setWeeklyAccuracy(accuracy);
      
      /**
       * 4. 連續學習天數（Streak）
       * 演算法：從今天開始往前推，計算連續有複習記錄的天數
       * 邏輯：
       * - 從今天開始檢查
       * - 如果當天有任何卡片的 last_reviewed_at 是該天，計數+1
       * - 繼續檢查前一天
       * - 如果某天沒有複習記錄，停止計數
       * 優化：使用 Set 來儲存有複習的日期，避免重複檢查
       */
      const reviewDates = new Set<string>();
      for (const { stats } of allCardsWithStats) {
        if (stats?.last_reviewed_at) {
          const reviewDate = new Date(stats.last_reviewed_at);
          reviewDate.setHours(0, 0, 0, 0);
          reviewDates.add(reviewDate.toISOString());
        }
      }
      
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      while (reviewDates.has(checkDate.toISOString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      setStreakDays(streak);

      /**
       * 5. 每週進度圖表
       * 演算法：統計最近7天每天複習的卡片數量
       * 資料結構：[6天前, 5天前, ..., 昨天, 今天]
       * 計算方式：對每一天，計算 last_reviewed_at 在該天的卡片數量
       * 優化：使用 Map 來儲存每天的計數
       */
      const dailyCounts = new Map<string, number>();
      
      for (const { stats } of allCardsWithStats) {
        if (stats?.last_reviewed_at) {
          const reviewDate = new Date(stats.last_reviewed_at);
          reviewDate.setHours(0, 0, 0, 0);
          const dateKey = reviewDate.toISOString();
          dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
        }
      }
      
      const progressData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        const dateKey = checkDate.toISOString();
        progressData.push(dailyCounts.get(dateKey) || 0);
      }
      setWeeklyProgress(progressData);

      /**
       * 6. 各程度進度
       * 演算法：按難度分級統計掌握情況
       * 分級規則：
       * - Advanced: TOEFL/IELTS/GRE
       * - Intermediate: 大學/高中
       * - Beginner: 其他
       * 
       * 掌握標準：right_count > wrong_count
       * 百分比 = (已掌握數量 / 總數量) × 100%
       * 
       * 時間篩選：如果選擇了時間範圍，只統計該時間範圍內有複習記錄的卡片
       */
      const levelStats: Record<string, { current: number; total: number }> = {
        Beginner: { current: 0, total: 0 },
        Intermediate: { current: 0, total: 0 },
        Advanced: { current: 0, total: 0 },
      };

      for (const { card, stats, wordbook } of allCardsWithStats) {
        // 時間範圍篩選
        if (startDate && stats?.last_reviewed_at) {
          const reviewDate = new Date(stats.last_reviewed_at);
          if (reviewDate < startDate) continue;
        }
        
        // 如果沒有統計數據且有時間限制，跳過此卡片
        if (startDate && !stats) continue;
        
        const level = wordbook.level || "Beginner";
        const normalizedLevel = level.includes("TOEFL") || level.includes("IELTS") || level.includes("GRE")
          ? "Advanced" 
          : level.includes("大學") || level.includes("高中")
          ? "Intermediate" 
          : "Beginner";

        if (levelStats[normalizedLevel]) {
          levelStats[normalizedLevel].total++;
          
          // 判斷是否已掌握：正確次數 > 錯誤次數
          if (stats && stats.right_count > stats.wrong_count) {
            levelStats[normalizedLevel].current++;
          }
        }
      }

      const levelProgress: ProgressByLevel[] = Object.entries(levelStats).map(([level, data]) => ({
        level,
        current: data.current,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.current / data.total) * 100) : 0,
        color: level === "Beginner" ? "bg-teal" : level === "Intermediate" ? "bg-yellow" : "bg-destructive",
      }));
      setProgressByLevel(levelProgress.filter(l => l.total > 0)); // 只顯示有資料的級別
      
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { value: TimeRange; label: string }[] = [
    { value: "7days", label: "7 天" },
    { value: "30days", label: "30 天" },
    { value: "all", label: "全部" },
  ];

  const weekDays = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
  const maxProgress = Math.max(...weeklyProgress);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header with Tabs */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">統計</h1>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.value)}
                className="flex-1"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-teal/20 rounded-2xl w-fit mx-auto">
              <Target className="h-6 w-6 text-teal" />
            </div>
            <p className="text-3xl font-bold">{todayCount}</p>
            <div>
              <p className="text-xs font-medium">今日</p>
              <p className="text-xs text-muted-foreground">目標：{dailyGoal}</p>
            </div>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-yellow/20 rounded-2xl w-fit mx-auto">
              <Flame className="h-6 w-6 text-yellow" />
            </div>
            <p className="text-3xl font-bold">{streakDays}</p>
            <div>
              <p className="text-xs font-medium">天</p>
              <p className="text-xs text-muted-foreground">連續</p>
              <p className="text-xs text-success">繼續加油！</p>
            </div>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-success/20 rounded-2xl w-fit mx-auto">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <p className="text-3xl font-bold">{weeklyAccuracy}%</p>
            <div>
              <p className="text-xs font-medium">準確率</p>
              <p className="text-xs text-muted-foreground">最近 7 天</p>
            </div>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">每週進度</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyProgress.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-sm font-medium">{value}</span>
                <div className="w-full bg-muted rounded-t-lg relative" style={{ height: "100%" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      index === 2 ? "bg-success" : "bg-muted-foreground/30"
                    }`}
                    style={{ height: `${(value / maxProgress) * 100}%`, position: "absolute", bottom: 0 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{weekDays[index]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Progress by Level */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">各程度進度</h2>
          <div className="space-y-4">
            {progressByLevel.map((level) => (
              <div key={level.level} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{level.level}</span>
                  <span className="text-muted-foreground">
                    {level.current} / {level.total} 個單字 ({level.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${level.color} transition-all`}
                    style={{ width: `${level.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Words to Review */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">需要複習的單字</h2>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">載入中...</p>
          ) : errorCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              還沒有錯誤記錄
            </p>
          ) : (
            <div className="space-y-3">
              {errorCards.map(({ card, stats, errorRate }) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">{card.headword}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.shown_count} 次嘗試
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-destructive/20 text-destructive text-sm font-medium rounded-full">
                    {errorRate.toFixed(0)}% 錯誤率
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Statistics;
