import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db, Card as VocabCard, CardStats } from "@/lib/db";
import { calculateErrorRate } from "@/lib/srs";
import { CardDetailDialog } from "@/components/CardDetailDialog";

interface ErrorCardData {
  card: VocabCard;
  stats: CardStats;
  errorRate: number;
}

const AllErrorCards = () => {
  const navigate = useNavigate();
  const [errorCards, setErrorCards] = useState<ErrorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadErrorCards();
  }, []);

  const loadErrorCards = async () => {
    try {
      setLoading(true);

      const allWordbooks = await db.getAllWordbooks();
      const errorCardsData: ErrorCardData[] = [];

      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        
        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          
          if (stats && stats.shown_count > 0) {
            const errorRate = calculateErrorRate(stats.wrong_count, stats.shown_count);
            if (errorRate > 0) {
              errorCardsData.push({
                card,
                stats,
                errorRate
              });
            }
          }
        }
      }

      // Sort by error rate (highest first)
      errorCardsData.sort((a, b) => b.errorRate - a.errorRate);
      setErrorCards(errorCardsData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load error cards:", error);
      setLoading(false);
    }
  };

  const handleCardClick = (card: VocabCard) => {
    setSelectedCard(card);
    setIsDetailDialogOpen(true);
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
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/statistics")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">需要複習的單字</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary */}
        <Card className="p-6">
          <div className="text-center space-y-2">
            <p className="text-4xl font-bold">{errorCards.length}</p>
            <p className="text-sm text-muted-foreground">個單字需要複習</p>
          </div>
        </Card>

        {/* Error Cards List */}
        {errorCards.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">沒有需要複習的單字</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {errorCards.map(({ card, stats, errorRate }) => (
              <Card 
                key={card.id} 
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleCardClick(card)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate mb-1">{card.headword}</h3>
                    <p className="text-xs text-muted-foreground">
                      {stats.shown_count} 次嘗試
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge 
                      variant={errorRate < 30 ? "default" : errorRate < 60 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {errorRate.toFixed(0)}% 錯誤率
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>✓ {stats.right_count}</span>
                      <span>✗ {stats.wrong_count}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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

export default AllErrorCards;
