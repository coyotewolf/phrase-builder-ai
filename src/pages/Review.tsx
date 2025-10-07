import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Volume2, Check, X } from "lucide-react";
import { db, Card as VocabCard } from "@/lib/db";
import { calculateNextReview, answerToQuality } from "@/lib/srs";
import { toast } from "sonner";

const Review = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "due";
  
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [mode]);

  const loadCards = async () => {
    try {
      setLoading(true);
      const allWordbooks = await db.getAllWordbooks();
      let allCards: VocabCard[] = [];
      
      for (const wordbook of allWordbooks) {
        const wordbookCards = await db.getCardsByWordbook(wordbook.id);
        allCards = [...allCards, ...wordbookCards];
      }

      let filteredCards = allCards;
      
      switch (mode) {
        case "due": {
          const dueCards = await Promise.all(
            allCards.map(async (card) => {
              const srs = await db.getCardSRS(card.id);
              return srs && new Date(srs.due_at) <= new Date() ? card : null;
            })
          );
          filteredCards = dueCards.filter((c): c is VocabCard => c !== null);
          break;
        }
        case "new": {
          const newCards = await Promise.all(
            allCards.map(async (card) => {
              const stats = await db.getCardStats(card.id);
              return !stats || stats.shown_count === 0 ? card : null;
            })
          );
          filteredCards = newCards.filter((c): c is VocabCard => c !== null);
          break;
        }
        case "frequent-errors": {
          const cardsWithStats = await Promise.all(
            allCards.map(async (card) => {
              const stats = await db.getCardStats(card.id);
              return { card, stats };
            })
          );
          filteredCards = cardsWithStats
            .filter(({ stats }) => stats && stats.shown_count > 0)
            .sort((a, b) => {
              const errorRateA = a.stats!.shown_count > 0 ? a.stats!.wrong_count / a.stats!.shown_count : 0;
              const errorRateB = b.stats!.shown_count > 0 ? b.stats!.wrong_count / b.stats!.shown_count : 0;
              return errorRateB - errorRateA;
            })
            .slice(0, 20)
            .map(({ card }) => card);
          break;
        }
        case "mixed":
          filteredCards = [...allCards].sort(() => Math.random() - 0.5);
          break;
        default:
          filteredCards = allCards;
      }

      setCards(filteredCards);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load cards:", error);
      toast.error("載入卡片失敗");
      setLoading(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    const card = cards[currentIndex];
    if (!card) return;

    try {
      // Update SRS
      const currentSRS = await db.getCardSRS(card.id);
      const quality = answerToQuality(correct);
      const newSRS = calculateNextReview(
        currentSRS || {
          ease: 2.5,
          interval_days: 1,
          repetitions: 0,
          due_at: new Date().toISOString(),
        },
        quality
      );
      await db.createOrUpdateCardSRS(card.id, newSRS);
      
      // Update stats
      const stats = await db.getCardStats(card.id);
      await db.createOrUpdateCardStats(card.id, {
        shown_count: (stats?.shown_count || 0) + 1,
        right_count: correct ? (stats?.right_count || 0) + 1 : (stats?.right_count || 0),
        wrong_count: correct ? (stats?.wrong_count || 0) : (stats?.wrong_count || 0) + 1,
        last_reviewed_at: new Date().toISOString(),
      });

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        toast.success("完成複習！");
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to update card:", error);
      toast.error("更新失敗");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">暫無卡片</h2>
          <p className="text-muted-foreground mb-6">目前沒有需要複習的卡片</p>
          <Button onClick={() => navigate("/")}>返回首頁</Button>
        </Card>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant="secondary">
            {currentIndex + 1} / {cards.length}
          </Badge>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Card */}
        <Card className="p-8 min-h-[400px] flex flex-col justify-between shadow-xl">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
            <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{currentCard.headword}</h2>
                {showAnswer && currentCard.phonetic && (
                  <p className="text-muted-foreground">{currentCard.phonetic}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {showAnswer && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {(currentCard.meaning_zh || currentCard.meaning_en) && (
                  <div>
                    <h3 className="font-semibold mb-2">釋義</h3>
                    <p className="text-muted-foreground">
                      {currentCard.meaning_zh || currentCard.meaning_en}
                    </p>
                  </div>
                )}
                {currentCard.detail?.examples && currentCard.detail.examples.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">例句</h3>
                    {currentCard.detail.examples.map((example, idx) => (
                      <p key={idx} className="text-muted-foreground italic mb-1">{example}</p>
                    ))}
                  </div>
                )}
                {currentCard.detail?.synonyms && currentCard.detail.synonyms.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">同義詞</h3>
                    <p className="text-muted-foreground">{currentCard.detail.synonyms.join(", ")}</p>
                  </div>
                )}
                {currentCard.detail?.antonyms && currentCard.detail.antonyms.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">反義詞</h3>
                    <p className="text-muted-foreground">{currentCard.detail.antonyms.join(", ")}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!showAnswer ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowAnswer(true)}
              >
                顯示答案
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => handleAnswer(false)}
                >
                  <X className="h-5 w-5 mr-2" />
                  不記得
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="h-5 w-5 mr-2" />
                  記得
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Review;
