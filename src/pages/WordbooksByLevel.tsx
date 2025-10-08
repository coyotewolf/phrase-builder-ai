import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, Wordbook } from "@/lib/db";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface WordbookWithStats extends Wordbook {
  cardCount: number;
  dueCount: number;
}

const WordbooksByLevel = () => {
  const navigate = useNavigate();
  const { level } = useParams<{ level: string }>();
  const [wordbooks, setWordbooks] = useState<WordbookWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getLevelDisplayName = (level: string) => {
    switch (level) {
      case "Beginner": return "初級";
      case "Intermediate": return "中級";
      case "Advanced": return "高級";
      default: return level;
    }
  };

  const isWordbookInLevel = (wordbookLevel: string | null, targetLevel: string) => {
    if (!wordbookLevel) return targetLevel === "Advanced";
    
    switch (targetLevel) {
      case "Beginner":
        return wordbookLevel.includes("國小") || 
               wordbookLevel.includes("國中") || 
               wordbookLevel.includes("高中") || 
               wordbookLevel.includes("7000單");
      case "Intermediate":
        return wordbookLevel.includes("大學") || 
               wordbookLevel.includes("TOEFL") || 
               wordbookLevel.includes("IELTS");
      case "Advanced":
        return wordbookLevel.includes("GRE") || 
               (!wordbookLevel.includes("國小") && 
                !wordbookLevel.includes("國中") && 
                !wordbookLevel.includes("高中") && 
                !wordbookLevel.includes("7000單") &&
                !wordbookLevel.includes("大學") && 
                !wordbookLevel.includes("TOEFL") && 
                !wordbookLevel.includes("IELTS"));
      default:
        return false;
    }
  };

  useEffect(() => {
    loadWordbooks();
  }, [level]);

  const loadWordbooks = async () => {
    try {
      setIsLoading(true);
      const books = await db.getAllWordbooks();
      
      // Filter wordbooks by level
      const filteredBooks = books.filter(book => 
        isWordbookInLevel(book.level, level || "")
      );
      
      const booksWithStats = await Promise.all(
        filteredBooks.map(async (book) => {
          const cards = await db.getCardsByWordbook(book.id);
          const allDueCards = await db.getDueCards();
          const dueCardIds = new Set(allDueCards.map(srs => srs.card_id));
          const bookDueCount = cards.filter(card => dueCardIds.has(card.id)).length;
          
          return {
            ...book,
            cardCount: cards.length,
            dueCount: bookDueCount,
          };
        })
      );
      
      setWordbooks(booksWithStats);
    } catch (error) {
      console.error("Failed to load wordbooks:", error);
      toast.error("載入單詞書失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/statistics")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{getLevelDisplayName(level || "")} 單詞書</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">載入中...</p>
          </div>
        ) : wordbooks.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">此程度沒有單詞書</h3>
            <p className="text-sm text-muted-foreground mb-4">
              這個程度目前還沒有任何單詞書
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {wordbooks.map((wordbook) => (
              <Card
                key={wordbook.id}
                className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/wordbooks/${wordbook.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-semibold">{wordbook.name}</h3>
                    {wordbook.description && (
                      <p className="text-sm text-muted-foreground">
                        {wordbook.description}
                      </p>
                    )}
                    {wordbook.level && (
                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {wordbook.level}
                      </span>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        {wordbook.cardCount} 張卡片
                      </span>
                      {wordbook.dueCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <Clock className="h-4 w-4" />
                          {wordbook.dueCount} 待複習
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default WordbooksByLevel;
