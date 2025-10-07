import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Flame } from "lucide-react";
import { db, Card as CardType, CardStats } from "@/lib/db";
import { calculateErrorRate } from "@/lib/srs";

interface ErrorCard {
  card: CardType;
  stats: CardStats;
  errorRate: number;
}

const Statistics = () => {
  const navigate = useNavigate();
  const [errorCards, setErrorCards] = useState<ErrorCard[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      
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
      setErrorCards(errorCardsData.slice(0, 10));
      
      // Calculate today's reviewed count (simplified - counts cards reviewed today)
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
      
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回主頁
          </Button>
          <div>
            <h1 className="text-3xl font-bold">學習統計</h1>
            <p className="text-muted-foreground">追蹤你的學習進度</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今日完成</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">7天平均</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Flame className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">連續天數</p>
                <p className="text-2xl font-bold">5 天</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">常錯單字</h2>
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
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{card.word}</p>
                    {card.definition && (
                      <p className="text-sm text-muted-foreground">
                        {card.definition}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      錯誤 {stats.wrong_count} 次 / 總共 {stats.shown_count} 次
                    </p>
                  </div>
                  <span className="text-sm text-destructive font-medium">
                    錯誤率: {errorRate.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
