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

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
      // Get user settings
      const settings = await db.getUserSettings();
      setDailyGoal(settings.daily_goal);

      // Get all cards with stats and calculate error rates
      const allWordbooks = await db.getAllWordbooks();
      const errorCardsData: ErrorCard[] = [];
      
      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          if (stats && stats.shown_count > 0) {
            const errorRate = calculateErrorRate(stats.wrong_count, stats.shown_count);
            if (errorRate > 0) {
              errorCardsData.push({ card, stats, errorRate });
            }
          }
        }
      }
      
      // Sort by error rate and take top errors
      errorCardsData.sort((a, b) => b.errorRate - a.errorRate);
      setErrorCards(errorCardsData.slice(0, 5));
      
      // Calculate today's reviewed count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let count = 0;
      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            if (reviewDate >= today) {
              count++;
            }
          }
        }
      }
      setTodayCount(count);
      
      // Calculate 7-day average accuracy
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let totalCorrect = 0;
      let totalShown = 0;
      
      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            if (reviewDate >= sevenDaysAgo) {
              totalCorrect += stats.right_count || 0;
              totalShown += stats.shown_count || 0;
            }
          }
        }
      }
      
      const average = totalShown > 0 ? Math.round((totalCorrect / totalShown) * 100) : 0;
      setWeeklyAccuracy(average);
      
      // Calculate streak days
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      while (true) {
        let hasReviewOnDate = false;
        for (const wordbook of allWordbooks) {
          const cards = await db.getCardsByWordbook(wordbook.id);
          for (const card of cards) {
            const stats = await db.getCardStats(card.id);
            if (stats?.last_reviewed_at) {
              const reviewDate = new Date(stats.last_reviewed_at);
              reviewDate.setHours(0, 0, 0, 0);
              if (reviewDate.getTime() === checkDate.getTime()) {
                hasReviewOnDate = true;
                break;
              }
            }
          }
          if (hasReviewOnDate) break;
        }
        
        if (!hasReviewOnDate) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      setStreakDays(streak);

      // Calculate weekly progress (last 7 days)
      const progressData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        
        let dayCount = 0;
        for (const wordbook of allWordbooks) {
          const cards = await db.getCardsByWordbook(wordbook.id);
          for (const card of cards) {
            const stats = await db.getCardStats(card.id);
            if (stats?.last_reviewed_at) {
              const reviewDate = new Date(stats.last_reviewed_at);
              reviewDate.setHours(0, 0, 0, 0);
              if (reviewDate.getTime() === checkDate.getTime()) {
                dayCount++;
              }
            }
          }
        }
        progressData.push(dayCount);
      }
      setWeeklyProgress(progressData);

      // Calculate progress by level
      const levelStats: Record<string, { current: number; total: number }> = {
        Beginner: { current: 0, total: 0 },
        Intermediate: { current: 0, total: 0 },
        Advanced: { current: 0, total: 0 },
      };

      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        for (const card of cards) {
          const level = wordbook.level || "Beginner";
          const normalizedLevel = level.includes("TOEFL") || level.includes("IELTS") || level.includes("GRE")
            ? "Advanced" 
            : level.includes("大學") || level.includes("高中")
            ? "Intermediate" 
            : "Beginner";

          if (levelStats[normalizedLevel]) {
            levelStats[normalizedLevel].total++;
            const stats = await db.getCardStats(card.id);
            if (stats && stats.right_count > stats.wrong_count) {
              levelStats[normalizedLevel].current++;
            }
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
      setProgressByLevel(levelProgress);
      
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { value: TimeRange; label: string }[] = [
    { value: "7days", label: "7 Days" },
    { value: "30days", label: "30 Days" },
    { value: "all", label: "All Time" },
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxProgress = Math.max(...weeklyProgress);

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header with Tabs */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Statistics</h1>
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
              <p className="text-xs font-medium">Today</p>
              <p className="text-xs text-muted-foreground">Goal: {dailyGoal}</p>
            </div>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-yellow/20 rounded-2xl w-fit mx-auto">
              <Flame className="h-6 w-6 text-yellow" />
            </div>
            <p className="text-3xl font-bold">{streakDays}</p>
            <div>
              <p className="text-xs font-medium">days</p>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-xs text-success">Keep it up!</p>
            </div>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-success/20 rounded-2xl w-fit mx-auto">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <p className="text-3xl font-bold">{weeklyAccuracy}%</p>
            <div>
              <p className="text-xs font-medium">Accuracy</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Weekly Progress</h2>
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
          <h2 className="text-lg font-semibold">Progress by Level</h2>
          <div className="space-y-4">
            {progressByLevel.map((level) => (
              <div key={level.level} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{level.level}</span>
                  <span className="text-muted-foreground">
                    {level.current} / {level.total} words ({level.percentage}%)
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
          <h2 className="text-lg font-semibold">Words to Review</h2>
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
                      {stats.shown_count} attempts
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-destructive/20 text-destructive text-sm font-medium rounded-full">
                    {errorRate.toFixed(0)}% errors
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
