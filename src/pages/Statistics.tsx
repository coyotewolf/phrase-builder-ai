import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, Card as CardType, CardStats } from "@/lib/db";
import { calculateErrorRate } from "@/lib/srs";
import BottomNav from "@/components/BottomNav";
import { ErrorCardsFilterDialog } from "@/components/ErrorCardsFilterDialog";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TimeRange>("7days");
  const [errorCards, setErrorCards] = useState<ErrorCard[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyAccuracy, setWeeklyAccuracy] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<{ learned: number; reviewed: number }[]>([]);
  const [progressLabels, setProgressLabels] = useState<string[]>([]);
  const [progressByLevel, setProgressByLevel] = useState<ProgressByLevel[]>([
    { level: "Beginner", current: 85, total: 100, percentage: 85, color: "bg-teal" },
    { level: "Intermediate", current: 120, total: 150, percentage: 80, color: "bg-yellow" },
    { level: "Advanced", current: 40, total: 80, percentage: 50, color: "bg-destructive" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isErrorFilterDialogOpen, setIsErrorFilterDialogOpen] = useState(false);

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
       * 5. 進度圖表（每週/每月）
       * 演算法：
       * - 7天模式：統計最近7天每天的學習和複習數量
       * - 30天模式：統計4週的學習和複習數量
       * 
       * 學習 vs 複習的定義：
       * - 學習：卡片首次加入（created_at 日期）
       * - 複習：卡片被複習（last_reviewed_at 日期，且不等於 created_at 日期）
       */
      
      if (activeTab === "7days") {
        // 7天模式：每天顯示
        const dailyLearned = new Map<string, Set<string>>();
        const dailyReviewed = new Map<string, Set<string>>();
        
        for (const { card, stats } of allCardsWithStats) {
          // 學習：卡片創建日期
          const createdDate = new Date(card.created_at);
          createdDate.setHours(0, 0, 0, 0);
          const createdKey = createdDate.toISOString();
          
          if (!dailyLearned.has(createdKey)) dailyLearned.set(createdKey, new Set());
          dailyLearned.get(createdKey)!.add(card.id);
          
          // 複習：最後複習日期（如果存在且不等於創建日期）
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            reviewDate.setHours(0, 0, 0, 0);
            const reviewKey = reviewDate.toISOString();
            
            // 只有當複習日期不同於創建日期時才算作複習
            if (reviewKey !== createdKey) {
              if (!dailyReviewed.has(reviewKey)) dailyReviewed.set(reviewKey, new Set());
              dailyReviewed.get(reviewKey)!.add(card.id);
            }
          }
        }
        
        const progressData: { learned: number; reviewed: number }[] = [];
        const labels: string[] = [];
        
        for (let i = 6; i >= 0; i--) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          checkDate.setHours(0, 0, 0, 0);
          const dateKey = checkDate.toISOString();
          
          progressData.push({
            learned: dailyLearned.get(dateKey)?.size || 0,
            reviewed: dailyReviewed.get(dateKey)?.size || 0
          });
          
          const dayOfWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][checkDate.getDay()];
          labels.push(dayOfWeek);
        }
        
        setWeeklyProgress(progressData);
        setProgressLabels(labels);
        
      } else if (activeTab === "all") {
        // 全部模式：按月顯示最近6個月
        const monthlyLearned = new Map<string, Set<string>>();
        const monthlyReviewed = new Map<string, Set<string>>();
        
        for (const { card, stats } of allCardsWithStats) {
          // 學習：卡片創建日期
          const createdDate = new Date(card.created_at);
          const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyLearned.has(monthKey)) monthlyLearned.set(monthKey, new Set());
          monthlyLearned.get(monthKey)!.add(card.id);
          
          // 複習：最後複習日期（如果存在且不等於創建日期）
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            const createdKey = createdDate.toISOString().split('T')[0];
            const reviewKey = reviewDate.toISOString().split('T')[0];
            
            // 只有當複習日期不同於創建日期時才算作複習
            if (reviewKey !== createdKey) {
              const reviewMonthKey = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}`;
              if (!monthlyReviewed.has(reviewMonthKey)) monthlyReviewed.set(reviewMonthKey, new Set());
              monthlyReviewed.get(reviewMonthKey)!.add(card.id);
            }
          }
        }
        
        const progressData: { learned: number; reviewed: number }[] = [];
        const labels: string[] = [];
        
        // 顯示最近6個月
        for (let i = 5; i >= 0; i--) {
          const checkDate = new Date();
          checkDate.setMonth(checkDate.getMonth() - i);
          const monthKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
          
          progressData.push({
            learned: monthlyLearned.get(monthKey)?.size || 0,
            reviewed: monthlyReviewed.get(monthKey)?.size || 0
          });
          
          labels.push(`${checkDate.getMonth() + 1}月`);
        }
        
        setWeeklyProgress(progressData);
        setProgressLabels(labels);
        
      } else {
        // 30天模式：按週顯示
        const weeklyLearned = [new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>()];
        const weeklyReviewed = [new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>()];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const { card, stats } of allCardsWithStats) {
          // 學習：卡片創建日期
          const createdDate = new Date(card.created_at);
          createdDate.setHours(0, 0, 0, 0);
          const daysAgoCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysAgoCreated >= 0 && daysAgoCreated < 30) {
            const weekIndex = 3 - Math.floor(daysAgoCreated / 7);
            if (weekIndex >= 0 && weekIndex < 4) {
              weeklyLearned[weekIndex].add(card.id);
            }
          }
          
          // 複習：最後複習日期
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            reviewDate.setHours(0, 0, 0, 0);
            const daysAgoReview = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // 只有當複習日期不同於創建日期時才算作複習
            const createdKey = createdDate.toISOString();
            const reviewKey = reviewDate.toISOString();
            
            if (reviewKey !== createdKey && daysAgoReview >= 0 && daysAgoReview < 30) {
              const weekIndex = 3 - Math.floor(daysAgoReview / 7);
              if (weekIndex >= 0 && weekIndex < 4) {
                weeklyReviewed[weekIndex].add(card.id);
              }
            }
          }
        }
        
        const progressData: { learned: number; reviewed: number }[] = weeklyLearned.map((learnedSet, index) => ({
          learned: learnedSet.size,
          reviewed: weeklyReviewed[index].size
        }));
        
        setWeeklyProgress(progressData);
        setProgressLabels(["第一週", "第二週", "第三週", "第四週"]);
      }

      /**
       * 6. 各程度進度
       * 演算法：按難度分級統計掌握情況
       * 分級規則（新）：
       * - Beginner: 國小、國中、高中、7000單
       * - Intermediate: 大學、TOEFL、IELTS
       * - Advanced: GRE、其他
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
        
        const level = wordbook.level || "Advanced";
        const normalizedLevel = 
          level.includes("國小") || level.includes("國中") || level.includes("高中") || level.includes("7000單")
            ? "Beginner"
          : level.includes("大學") || level.includes("TOEFL") || level.includes("IELTS")
            ? "Intermediate"
            : "Advanced"; // GRE 和其他都歸類為 Advanced

        if (levelStats[normalizedLevel]) {
          levelStats[normalizedLevel].total++;
          
          // 判斷是否已掌握：正確次數 > 錯誤次數
          if (stats && stats.right_count > stats.wrong_count) {
            levelStats[normalizedLevel].current++;
          }
        }
      }

      // 按優先級排序：Beginner > Intermediate > Advanced
      const levelOrder = ["Beginner", "Intermediate", "Advanced"];
      const levelProgress: ProgressByLevel[] = levelOrder
        .map(level => ({
          level,
          current: levelStats[level].current,
          total: levelStats[level].total,
          percentage: levelStats[level].total > 0 ? Math.round((levelStats[level].current / levelStats[level].total) * 100) : 0,
          color: level === "Beginner" ? "bg-teal" : level === "Intermediate" ? "bg-yellow" : "bg-pink-400",
        }))
        .filter(l => l.total > 0); // 只顯示有資料的級別
      
      setProgressByLevel(levelProgress);
      
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

  const maxProgress = Math.max(...weeklyProgress.map(p => Math.max(p.learned, p.reviewed)));

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
          <Card 
            className="p-4 text-center space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/statistics/today')}
          >
            <div className="p-3 bg-teal/20 rounded-2xl w-fit mx-auto">
              <Target className="h-6 w-6 text-teal" />
            </div>
            <p className="text-3xl font-bold">{todayCount}</p>
            <div>
              <p className="text-xs font-medium">今日</p>
              <p className="text-xs text-muted-foreground">目標：{dailyGoal}</p>
            </div>
          </Card>

          <Card 
            className="p-4 text-center space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/statistics/streak')}
          >
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

          <Card 
            className="p-4 text-center space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/statistics/accuracy')}
          >
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

        {/* Progress Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeTab === "30days" ? "每月進度" : activeTab === "all" ? "學習趨勢" : "每週進度"}
            </h2>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal rounded"></div>
                <span>學習</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow rounded"></div>
                <span>複習</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-36">
            {weeklyProgress.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative flex gap-1 items-end" style={{ height: "100px" }}>
                  <div
                    className="flex-1 bg-teal rounded-t transition-all"
                    style={{ 
                      height: `${maxProgress > 0 ? (data.learned / maxProgress) * 100 : 0}%`,
                      minHeight: data.learned > 0 ? "8px" : "0px"
                    }}
                  />
                  <div
                    className="flex-1 bg-yellow rounded-t transition-all"
                    style={{ 
                      height: `${maxProgress > 0 ? (data.reviewed / maxProgress) * 100 : 0}%`,
                      minHeight: data.reviewed > 0 ? "8px" : "0px"
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground font-medium space-y-0.5">
                  <div className="flex gap-2 justify-center">
                    <span className="text-teal">{data.learned > 0 ? data.learned : ''}</span>
                    <span className="text-yellow">{data.reviewed > 0 ? data.reviewed : ''}</span>
                  </div>
                  <div>{progressLabels[index]}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Progress by Level */}
        <Card id="progress-by-level" className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">各程度進度</h2>
          <div className="space-y-4">
            {progressByLevel.map((level) => (
              <div 
                key={level.level} 
                className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => navigate(`/wordbooks-by-level/${level.level}`)}
              >
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
        <Card 
          id="error-cards"
          className="p-6 space-y-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/statistics/error-cards')}
        >
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

      <ErrorCardsFilterDialog open={isErrorFilterDialogOpen} onOpenChange={setIsErrorFilterDialogOpen} />
      <BottomNav />
    </div>
  );
};

export default Statistics;
