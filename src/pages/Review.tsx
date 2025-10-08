import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Volume2, ChevronUp } from "lucide-react";
import { db, Card as VocabCard } from "@/lib/db";
import { calculateNextReview, answerToQuality } from "@/lib/srs";
import { toast } from "sonner";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const Review = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "due";
  
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    loadCards();
  }, [mode]);

  const loadCards = async () => {
    try {
      setLoading(true);
      console.log("Loading cards for mode:", mode);
      const allWordbooks = await db.getAllWordbooks();
      console.log("Found wordbooks:", allWordbooks.length);
      let allCards: VocabCard[] = [];
      
      for (const wordbook of allWordbooks) {
        const wordbookCards = await db.getCardsByWordbook(wordbook.id);
        allCards = [...allCards, ...wordbookCards];
      }
      console.log("Total cards:", allCards.length);

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

      console.log("Filtered cards:", filteredCards.length);
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
      
      const currentState = {
        ease: currentSRS?.ease || 2.5,
        interval_days: currentSRS?.interval_days || 1,
        repetitions: currentSRS?.repetitions || 0,
        due_at: currentSRS?.due_at || new Date().toISOString(),
      };
      
      const nextReview = calculateNextReview(currentState, quality);

      await db.createOrUpdateCardSRS(card.id, {
        ease: nextReview.ease,
        interval_days: nextReview.interval_days,
        repetitions: nextReview.repetitions,
        due_at: nextReview.due_at,
      });

      // Update stats
      const currentStats = await db.getCardStats(card.id);
      await db.createOrUpdateCardStats(card.id, {
        shown_count: (currentStats?.shown_count || 0) + 1,
        right_count: (currentStats?.right_count || 0) + (correct ? 1 : 0),
        wrong_count: (currentStats?.wrong_count || 0) + (correct ? 0 : 1),
        last_reviewed_at: new Date().toISOString(),
      });

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setIsDetailOpen(false);
        // Reset motion values for next card
        setTimeout(() => {
          x.set(0);
          y.set(0);
        }, 100);
      } else {
        toast.success("複習完成！");
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to update card:", error);
      toast.error("更新失敗");
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100;
    const verticalThreshold = -80; // Negative because we're dragging up
    
    // Check for vertical swipe (up)
    if (info.offset.y < verticalThreshold && Math.abs(info.offset.x) < swipeThreshold) {
      setIsDetailOpen(true);
      x.set(0);
      y.set(0);
      return;
    }
    
    // Check for horizontal swipe (left/right)
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const correct = info.offset.x > 0;
      // Animate card off screen
      const exitX = info.offset.x > 0 ? 500 : -500;
      x.set(exitX);
      
      // Wait for animation then handle answer
      setTimeout(() => {
        handleAnswer(correct);
      }, 200);
    } else {
      // Reset position if threshold not met
      x.set(0);
      y.set(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">沒有卡片需要複習</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {mode === "due" && "太棒了！你已經完成所有到期的複習"}
            {mode === "new" && "沒有新的單字卡"}
            {mode === "frequent-errors" && "沒有錯誤記錄"}
          </p>
          <Button onClick={() => navigate("/")}>返回首頁</Button>
        </Card>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Badge variant="secondary">
          {currentIndex + 1} / {cards.length}
        </Badge>
        <Button variant="ghost" size="icon">
          <Volume2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Swipe Instructions */}
      <div className="flex justify-between px-8 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            ←
          </div>
          <span>不知道</span>
        </div>
        <div className="flex items-center gap-2">
          <span>知道</span>
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            →
          </div>
        </div>
      </div>

      {/* Card Container with Stack Effect */}
      <div className="flex items-center justify-center px-4 relative" style={{ height: "calc(100vh - 280px)" }}>
        <div className="w-full max-w-md relative" style={{ height: "400px" }}>
          {/* Next card (underneath) */}
          {currentIndex < cards.length - 1 && (
            <Card
              className="absolute inset-0 shadow-xl"
              style={{
                transform: "scale(0.95) translateY(10px)",
                opacity: 0.5,
                zIndex: 0,
              }}
            >
              <div className="h-full flex items-center justify-center p-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-center break-words opacity-30">
                  {cards[currentIndex + 1].headword}
                </h1>
              </div>
            </Card>
          )}

          {/* Current card (on top) */}
          <motion.div
            style={{
              x,
              y,
              rotate,
              opacity,
              cursor: "grab",
              position: "absolute",
              inset: 0,
              zIndex: 1,
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
          >
            <div
              className="relative w-full h-full"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                onClick={(e) => {
                  // Only flip on click, not on drag
                  if (Math.abs(x.get()) < 5 && Math.abs(y.get()) < 5) {
                    setIsFlipped(!isFlipped);
                  }
                }}
              >
              {/* Front Side - Word Only */}
              <Card
                className="absolute inset-0 flex items-center justify-center p-8 shadow-2xl cursor-pointer backface-hidden"
                style={{
                  backfaceVisibility: "hidden",
                }}
              >
                <h1 className="text-4xl sm:text-5xl font-bold text-center break-words">
                  {currentCard.headword}
                </h1>
              </Card>

              {/* Back Side - Simple Meanings */}
              <Card
                className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 shadow-2xl cursor-pointer"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="space-y-3 text-center">
                  {currentCard.meanings && currentCard.meanings.length > 0 ? (
                    currentCard.meanings.map((meaning, idx) => {
                      const posAbbr = meaning.part_of_speech?.substring(0, 1) || '';
                      return (
                        <p key={idx} className="text-xl sm:text-2xl font-medium">
                          {posAbbr && <span className="text-muted-foreground">{posAbbr}. </span>}
                          {meaning.meaning_zh || meaning.meaning_en}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-xl text-muted-foreground">暫無釋義</p>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        </div>

        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-8 left-8 text-6xl font-bold text-destructive"
          style={{
            opacity: useTransform(x, [-100, 0], [1, 0]),
          }}
        >
          ✗
        </motion.div>
        <motion.div
          className="absolute top-8 right-8 text-6xl font-bold text-success"
          style={{
            opacity: useTransform(x, [0, 100], [0, 1]),
          }}
        >
          ✓
        </motion.div>
        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center text-2xl font-bold text-primary"
          style={{
            opacity: useTransform(y, [-100, 0], [1, 0]),
          }}
        >
          ↑ 詳細
        </motion.div>
      </div>

      {/* Tap to Flip Hint */}
      {!isFlipped && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          點擊卡片查看釋義 • 上滑查看詳細資訊
        </p>
      )}

      {/* Manual action buttons (alternative to swipe) */}
      <div className="fixed bottom-20 left-0 right-0 px-4 flex justify-center gap-4">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16"
          onClick={() => {
            x.set(-500);
            setTimeout(() => handleAnswer(false), 200);
          }}
        >
          <span className="text-2xl">✗</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-full px-6"
          onClick={() => setIsDetailOpen(true)}
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          詳細
        </Button>
        <Button
          variant="default"
          size="lg"
          className="rounded-full w-16 h-16 bg-success hover:bg-success/90"
          onClick={() => {
            x.set(500);
            setTimeout(() => handleAnswer(true), 200);
          }}
        >
          <span className="text-2xl">✓</span>
        </Button>
      </div>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">{currentCard.headword}</SheetTitle>
            {currentCard.phonetic && (
              <p className="text-muted-foreground">{currentCard.phonetic}</p>
            )}
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {currentCard.meanings && currentCard.meanings.length > 0 ? (
              currentCard.meanings.map((meaning, idx) => (
                <div key={idx} className="border-l-4 border-primary pl-4 space-y-3">
                  <h3 className="text-lg font-semibold">
                    {meaning.part_of_speech || `釋義 ${idx + 1}`}
                  </h3>

                {meaning.meaning_zh && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">中文釋義</p>
                    <p className="text-base">{meaning.meaning_zh}</p>
                  </div>
                )}

                {meaning.meaning_en && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">英文定義</p>
                    <p className="text-base">{meaning.meaning_en}</p>
                  </div>
                )}

                {meaning.examples && meaning.examples.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">例句</p>
                    <div className="space-y-2">
                      {meaning.examples.map((example, exIdx) => (
                        <p key={exIdx} className="text-sm italic bg-muted p-2 rounded">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {meaning.synonyms && meaning.synonyms.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">同義詞</p>
                    <p className="text-sm">{meaning.synonyms.join(", ")}</p>
                  </div>
                )}

                {meaning.antonyms && meaning.antonyms.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">反義詞</p>
                    <p className="text-sm">{meaning.antonyms.join(", ")}</p>
                  </div>
                )}
              </div>
            ))
            ) : (
              <p className="text-muted-foreground">此卡片暫無詳細釋義</p>
            )}

            {currentCard.notes && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">備註</p>
                <p className="text-sm">{currentCard.notes}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Review;
