import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { db, Card as VocabCard } from "@/lib/db";
import { calculateErrorRate } from "@/lib/srs";
import { CardDetailDialog } from "@/components/CardDetailDialog";

interface ReviewedCardData {
  card: VocabCard;
  correctCount: number;
  wrongCount: number;
  lastReviewedAt: string;
  errorRate: number;
  isNew: boolean;
}

const TodayReviewed = () => {
  const navigate = useNavigate();
  const [reviewedCards, setReviewedCards] = useState<ReviewedCardData[]>([]);
  const [newCards, setNewCards] = useState<ReviewedCardData[]>([]);
  const [reviewCards, setReviewCards] = useState<ReviewedCardData[]>([]);
  const [totalReviewed, setTotalReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadTodayReviewed();
  }, []);

  const loadTodayReviewed = async () => {
    try {
      setLoading(true);
      
      const settings = await db.getUserSettings();
      setDailyGoal(settings.daily_goal);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allWordbooks = await db.getAllWordbooks();
      const reviewedCardsData: ReviewedCardData[] = [];
      let totalCorrect = 0;
      let totalWrong = 0;

      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          
          if (stats?.last_reviewed_at) {
            const reviewDate = new Date(stats.last_reviewed_at);
            reviewDate.setHours(0, 0, 0, 0);
            
            if (reviewDate.getTime() === today.getTime()) {
              const errorRate = calculateErrorRate(stats.wrong_count, stats.shown_count);
              const isNew = stats.shown_count === 1;
              
              reviewedCardsData.push({
                card,
                correctCount: stats.right_count,
                wrongCount: stats.wrong_count,
                lastReviewedAt: stats.last_reviewed_at,
                errorRate,
                isNew
              });

              totalCorrect += stats.right_count;
              totalWrong += stats.wrong_count;
            }
          }
        }
      }

      // Sort by last reviewed time (most recent first)
      reviewedCardsData.sort((a, b) => 
        new Date(b.lastReviewedAt).getTime() - new Date(a.lastReviewedAt).getTime()
      );

      // Separate new and review cards
      const newCardsData = reviewedCardsData.filter(c => c.isNew);
      const reviewCardsData = reviewedCardsData.filter(c => !c.isNew);

      setReviewedCards(reviewedCardsData);
      setNewCards(newCardsData);
      setReviewCards(reviewCardsData);
      setTotalReviewed(reviewedCardsData.length);
      setCorrectCount(totalCorrect);
      setWrongCount(totalWrong);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load today's reviewed cards:", error);
      setLoading(false);
    }
  };

  const handleCardClick = (card: VocabCard) => {
    setSelectedCard(card);
    setIsDetailDialogOpen(true);
  };

  const progressPercentage = dailyGoal > 0 ? Math.min((totalReviewed / dailyGoal) * 100, 100) : 0;
  const accuracyRate = totalReviewed > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;

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
          <h1 className="text-xl font-bold">今日學習</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Stats Summary */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">今日進度</h2>
            <Badge variant={progressPercentage >= 100 ? "default" : "secondary"} className="text-lg px-3 py-1">
              {totalReviewed} / {dailyGoal}
            </Badge>
          </div>
          
          <Progress value={progressPercentage} className="h-3" />
          
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">{correctCount}</p>
              <p className="text-xs text-muted-foreground">正確</p>
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
              <p className="text-xs text-muted-foreground">錯誤</p>
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{accuracyRate}%</p>
              <p className="text-xs text-muted-foreground">準確率</p>
            </div>
          </div>
        </Card>

        {/* New Cards Section */}
        {newCards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">新學單字</h2>
              <Badge variant="secondary" className="text-sm">
                {newCards.length} 個
              </Badge>
            </div>
            
            {newCards.map(({ card, correctCount, wrongCount, lastReviewedAt, errorRate }) => {
              const reviewTime = new Date(lastReviewedAt);
              const timeString = reviewTime.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              return (
                <Card 
                  key={card.id} 
                  className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold truncate">{card.headword}</h3>
                        <Badge variant="default" className="text-xs flex-shrink-0">新</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeString}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        {correctCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        {wrongCount}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Cards Section */}
        {reviewCards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">複習單字</h2>
              <Badge variant="secondary" className="text-sm">
                {reviewCards.length} 個
              </Badge>
            </div>
            
            {reviewCards.map(({ card, correctCount, wrongCount, lastReviewedAt, errorRate }) => {
              const reviewTime = new Date(lastReviewedAt);
              const timeString = reviewTime.toLocaleTimeString('zh-TW', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              return (
                <Card 
                  key={card.id} 
                  className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold truncate mb-1">{card.headword}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeString}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        {correctCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        {wrongCount}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {reviewedCards.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">今天還沒有複習記錄</p>
          </Card>
        )}

        {/* Motivational Message */}
        {totalReviewed >= dailyGoal && (
          <Card className="p-6 bg-gradient-to-r from-teal/10 to-success/10 border-success/20">
            <div className="text-center space-y-2">
              <p className="text-2xl">🎉</p>
              <h3 className="text-lg font-semibold">太棒了！</h3>
              <p className="text-sm text-muted-foreground">你已經完成今天的學習目標</p>
            </div>
          </Card>
        )}
      </div>

      <CardDetailDialog 
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        card={selectedCard}
      />
    </div>
  );
};

export default TodayReviewed;
