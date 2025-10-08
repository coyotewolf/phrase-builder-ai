import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Clock, TrendingUp, Zap, Play, Flame, BookText, Target } from "lucide-react";
import { db, Wordbook } from "@/lib/db";
import BottomNav from "@/components/BottomNav";
import { SideMenu } from "@/components/SideMenu";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

const Home = () => {
  const navigate = useNavigate();
  const [dueCount, setDueCount] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(100);
  const [totalWords, setTotalWords] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [allWordbooks, setAllWordbooks] = useState<Wordbook[]>([]);
  const [selectedWordbooks, setSelectedWordbooks] = useState<string[]>([]);
  const [showWordbookSelector, setShowWordbookSelector] = useState(false);

  useEffect(() => {
    loadWordbooks();
    loadStats();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedWordbooks]);

  const loadWordbooks = async () => {
    try {
      const wordbooks = await db.getAllWordbooks();
      setAllWordbooks(wordbooks);
      
      // Load saved selection from localStorage
      const saved = localStorage.getItem('selectedWordbooks');
      if (saved) {
        setSelectedWordbooks(JSON.parse(saved));
      } else {
        // Select all by default
        setSelectedWordbooks(wordbooks.map(w => w.id));
      }
    } catch (error) {
      console.error("Failed to load wordbooks:", error);
    }
  };

  const toggleWordbookSelection = (wordbookId: string) => {
    const newSelection = selectedWordbooks.includes(wordbookId)
      ? selectedWordbooks.filter(id => id !== wordbookId)
      : [...selectedWordbooks, wordbookId];
    
    setSelectedWordbooks(newSelection);
    localStorage.setItem('selectedWordbooks', JSON.stringify(newSelection));
  };

  const loadStats = async () => {
    try {
      const settings = await db.getUserSettings();
      setDailyGoal(settings.daily_goal);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter wordbooks based on selection
      const targetWordbooks = allWordbooks.filter(wb => 
        selectedWordbooks.length === 0 || selectedWordbooks.includes(wb.id)
      );
      
      let count = 0;
      let total = 0;
      let dueCardsCount = 0;
      
      for (const wordbook of targetWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        total += cards.length;
        
        for (const card of cards) {
          // Count due cards
          const srs = await db.getCardSRS(card.id);
          if (srs && new Date(srs.due_at) <= new Date()) {
            dueCardsCount++;
          }
          
          // Count today's reviewed cards
          const stats = await db.getCardStats(card.id);
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            reviewDate.setHours(0, 0, 0, 0);
            if (reviewDate.getTime() === today.getTime()) {
              count++;
            }
          }
        }
      }
      
      setTodayCompleted(count);
      setTotalWords(total);
      setDueCount(dueCardsCount);

      // Calculate streak
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      while (true) {
        let hasReview = false;
        for (const wordbook of targetWordbooks) {
          const cards = await db.getCardsByWordbook(wordbook.id);
          for (const card of cards) {
            const stats = await db.getCardStats(card.id);
            if (stats?.last_reviewed_at) {
              const reviewDate = new Date(stats.last_reviewed_at);
              reviewDate.setHours(0, 0, 0, 0);
              if (reviewDate.getTime() === checkDate.getTime()) {
                hasReview = true;
                break;
              }
            }
          }
          if (hasReview) break;
        }
        
        if (!hasReview) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      setStreakDays(streak);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早安！";
    if (hour < 18) return "午安！";
    return "晚安！";
  };

  const progressPercentage = dailyGoal > 0 ? Math.min((todayCompleted / dailyGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-2xl"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-2xl"
          onClick={() => setIsNotificationsOpen(true)}
        >
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 sm:px-6 space-y-6">
        {/* Greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{getGreeting()} 👋</h1>
          <p className="text-muted-foreground">
            今日進度：{todayCompleted}/{dailyGoal} 個單字
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Wordbook Selector */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">目標單詞書</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWordbookSelector(!showWordbookSelector)}
            >
              {showWordbookSelector ? "收起" : "選擇"}
            </Button>
          </div>
          
          {showWordbookSelector ? (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {allWordbooks.map((wordbook) => (
                  <div key={wordbook.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={wordbook.id}
                      checked={selectedWordbooks.includes(wordbook.id)}
                      onCheckedChange={() => toggleWordbookSelection(wordbook.id)}
                    />
                    <Label
                      htmlFor={wordbook.id}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {wordbook.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              已選擇 {selectedWordbooks.length} 本單詞書
            </p>
          )}
        </Card>

        {/* Start Learning */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">開始學習</h2>
          
          <Card
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/review?mode=due")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-background rounded-2xl">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">待複習</h3>
                  <p className="text-muted-foreground">
                    {String(dueCount).padStart(6, '0')} 張卡片
                  </p>
                </div>
              </div>
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/review?mode=frequent-errors")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/20 rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">常見錯誤</h3>
                  <p className="text-muted-foreground">練習容易錯的單字</p>
                </div>
              </div>
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/review?mode=new")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal/20 rounded-2xl">
                  <Zap className="h-8 w-8 text-teal" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">新單字</h3>
                  <p className="text-muted-foreground">學習新的單字</p>
                </div>
              </div>
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Your Progress */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">你的進度</h2>
          
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <Flame className="h-5 w-5 text-destructive mr-1" />
                </div>
                  <p className="text-4xl font-bold">{streakDays}</p>
                  <p className="text-sm text-muted-foreground">連續天數</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <BookText className="h-5 w-5 text-primary mr-1" />
                  </div>
                  <p className="text-4xl font-bold">{totalWords}</p>
                  <p className="text-sm text-muted-foreground">總單字數</p>
                </div>
                
                 <div 
                  className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate("/review?mode=due")}
                >
                  <div className="flex items-center justify-center">
                    <Target className="h-5 w-5 text-accent mr-1" />
                  </div>
                  <p className="text-4xl font-bold">{dueCount}</p>
                  <p className="text-sm text-muted-foreground">需要複習的單字</p>
                </div>
            </div>
          </Card>
        </div>
      </div>

      <SideMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} />
      <NotificationsSheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} />
      <BottomNav />
    </div>
  );
};

export default Home;
