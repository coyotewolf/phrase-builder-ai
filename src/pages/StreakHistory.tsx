import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Calendar, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

interface DayRecord {
  date: Date;
  dateString: string;
  reviewCount: number;
  hasReview: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const StreakHistory = () => {
  const navigate = useNavigate();
  const [streakDays, setStreakDays] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyData, setWeeklyData] = useState<DayRecord[][]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reviewDatesMap, setReviewDatesMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadStreakHistory();
  }, [currentMonth]); // Reload when month changes

  const loadStreakHistory = async () => {
    try {
      setLoading(true);

      const allWordbooks = await db.getAllWordbooks();
      const reviewDatesMapTemp = new Map<string, number>();

      // Collect all review dates with counts
      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            reviewDate.setHours(0, 0, 0, 0);
            const dateKey = reviewDate.toISOString();
            
            reviewDatesMapTemp.set(dateKey, (reviewDatesMapTemp.get(dateKey) || 0) + 1);
          }
        }
      }

      setReviewDatesMap(reviewDatesMapTemp);

      // Calculate current streak (only once, not dependent on currentMonth)
      let currentStreak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      while (reviewDatesMapTemp.has(checkDate.toISOString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      setStreakDays(currentStreak);

      // Calculate total days with reviews
      setTotalDays(reviewDatesMapTemp.size);

      // Calculate longest streak
      const sortedDates = Array.from(reviewDatesMapTemp.keys())
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());
      
      let maxStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;

      for (const date of sortedDates) {
        if (prevDate) {
          const dayDiff = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = date;
      }
      maxStreak = Math.max(maxStreak, tempStreak);
      setLongestStreak(maxStreak);

      // Generate calendar data for current month
      generateMonthCalendar(currentMonth, reviewDatesMapTemp);
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load streak history:", error);
      setLoading(false);
    }
  };

  const generateMonthCalendar = (monthDate: Date, reviewMap: Map<string, number>) => {
    const weeks: DayRecord[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get first day of the month
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Get last day of the month
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    lastDay.setHours(0, 0, 0, 0);
    
    // Adjust to start from Sunday
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Generate weeks until we cover the whole month
    let currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || weeks.length === 0 || weeks[weeks.length - 1].length < 7) {
      const weekData: DayRecord[] = [];
      
      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toISOString();
        const reviewCount = reviewMap.get(dateKey) || 0;
        const isToday = currentDate.getTime() === today.getTime();
        const isFuture = currentDate.getTime() > today.getTime();
        const isCurrentMonth = currentDate.getMonth() === monthDate.getMonth();
        
        weekData.push({
          date: new Date(currentDate),
          dateString: dateKey,
          reviewCount,
          hasReview: reviewCount > 0,
          isToday,
          isFuture
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(weekData);
      
      // Stop if we've passed the last day and completed the week
      if (currentDate > lastDay && weekData[6].date > lastDay) {
        break;
      }
    }

    setWeeklyData(weeks);
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    generateMonthCalendar(newMonth, reviewDatesMap);
  };

  const handleNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Don't go beyond current month
    if (nextMonth <= today) {
      setCurrentMonth(nextMonth);
      generateMonthCalendar(nextMonth, reviewDatesMap);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    generateMonthCalendar(today, reviewDatesMap);
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return currentMonth.getFullYear() === today.getFullYear() && 
           currentMonth.getMonth() === today.getMonth();
  };

  const getDayColor = (record: DayRecord, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "bg-muted/20";
    if (record.isFuture) return "bg-muted/30";
    if (!record.hasReview) return "bg-muted/50";
    if (record.reviewCount >= 50) return "bg-teal";
    if (record.reviewCount >= 30) return "bg-teal/80";
    if (record.reviewCount >= 10) return "bg-teal/60";
    return "bg-teal/40";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/statistics")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">連續學習記錄</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-yellow/20 rounded-2xl w-fit mx-auto">
              <Flame className="h-6 w-6 text-yellow" />
            </div>
            <p className="text-3xl font-bold">{streakDays}</p>
            <p className="text-xs text-muted-foreground">目前連續</p>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-destructive/20 rounded-2xl w-fit mx-auto">
              <TrendingUp className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-3xl font-bold">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">最長連續</p>
          </Card>

          <Card className="p-4 text-center space-y-2">
            <div className="p-3 bg-teal/20 rounded-2xl w-fit mx-auto">
              <Calendar className="h-6 w-6 text-teal" />
            </div>
            <p className="text-3xl font-bold">{totalDays}</p>
            <p className="text-xs text-muted-foreground">總學習天數</p>
          </Card>
        </div>

        {/* Motivational Message */}
        <Card className="p-6 bg-gradient-to-r from-yellow/10 to-destructive/10 border-yellow/20">
          <div className="flex items-start gap-3">
            <Flame className="h-6 w-6 text-yellow flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <h3 className="font-semibold">
                {streakDays === 0 && "開始你的學習之旅！"}
                {streakDays > 0 && streakDays < 7 && "保持下去！"}
                {streakDays >= 7 && streakDays < 30 && "做得很好！"}
                {streakDays >= 30 && "你太棒了！"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {streakDays === 0 && "每天學習一點，養成良好習慣"}
                {streakDays > 0 && streakDays < 7 && `已經連續學習 ${streakDays} 天，繼續加油！`}
                {streakDays >= 7 && streakDays < 30 && `已經連續學習 ${streakDays} 天，習慣正在養成`}
                {streakDays >= 30 && `已經連續學習 ${streakDays} 天，你是學習達人！`}
              </p>
            </div>
          </div>
        </Card>

        {/* Calendar Heatmap */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">學習日曆</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="text-xs">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                disabled={isCurrentMonth()}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentMonth() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="text-xs"
                >
                  今天
                </Button>
              )}
            </div>
          </div>

          {/* Weekday labels */}
          <div className="flex gap-2">
            <div className="w-12" />
            {["日", "一", "二", "三", "四", "五", "六"].map((day, idx) => (
              <div key={idx} className="flex-1 text-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-2">
            {weeklyData.map((week, weekIdx) => {
              const firstDayOfWeek = week[0].date;
              const weekNumber = Math.ceil(firstDayOfWeek.getDate() / 7);
              
              return (
                <div key={weekIdx} className="flex gap-2">
                  <div className="w-12 text-xs text-muted-foreground flex items-center justify-end pr-1">
                    {weekIdx === 0 ? `第${weekNumber}週` : ""}
                  </div>
                  {week.map((day, dayIdx) => {
                    const isCurrentMonthDay = day.date.getMonth() === currentMonth.getMonth();
                    return (
                      <div
                        key={dayIdx}
                        className={`flex-1 aspect-square rounded ${getDayColor(day, isCurrentMonthDay)} transition-all hover:scale-110 cursor-pointer relative group`}
                        title={`${day.date.toLocaleDateString('zh-TW')} - ${day.reviewCount} 個單字`}
                      >
                        {day.isToday && (
                          <div className="absolute inset-0 rounded border-2 border-yellow" />
                        )}
                        {!isCurrentMonthDay && (
                          <div className="absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground/50">
                            {day.date.getDate()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <span>少</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-muted/50" />
              <div className="w-4 h-4 rounded bg-teal/40" />
              <div className="w-4 h-4 rounded bg-teal/60" />
              <div className="w-4 h-4 rounded bg-teal/80" />
              <div className="w-4 h-4 rounded bg-teal" />
            </div>
            <span>多</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StreakHistory;
