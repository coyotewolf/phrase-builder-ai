import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db, Wordbook } from "@/lib/db";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface WordbookWithStats extends Wordbook {
  cardCount: number;
  dueCount: number;
}

const Wordbooks = () => {
  const navigate = useNavigate();
  const [wordbooks, setWordbooks] = useState<WordbookWithStats[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWordbookName, setNewWordbookName] = useState("");
  const [newWordbookDescription, setNewWordbookDescription] = useState("");
  const [newWordbookLevel, setNewWordbookLevel] = useState("不限制");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWordbooks();
  }, []);

  const loadWordbooks = async () => {
    try {
      setIsLoading(true);
      const books = await db.getAllWordbooks();
      
      const booksWithStats = await Promise.all(
        books.map(async (book) => {
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

  const handleCreateWordbook = async () => {
    if (!newWordbookName.trim()) {
      toast.error("請輸入單詞書名稱");
      return;
    }

    try {
      await db.createWordbook({
        name: newWordbookName,
        description: newWordbookDescription,
        level: newWordbookLevel,
      });
      
      toast.success("單詞書創建成功");
      setIsCreateDialogOpen(false);
      setNewWordbookName("");
      setNewWordbookDescription("");
      setNewWordbookLevel("不限制");
      loadWordbooks();
    } catch (error) {
      console.error("Failed to create wordbook:", error);
      toast.error("創建單詞書失敗");
    }
  };

  const handleDeleteWordbook = async (id: string) => {
    if (!confirm("確定要刪除這個單詞書嗎？此操作無法撤銷。")) {
      return;
    }

    try {
      await db.deleteWordbook(id);
      toast.success("單詞書已刪除");
      loadWordbooks();
    } catch (error) {
      console.error("Failed to delete wordbook:", error);
      toast.error("刪除單詞書失敗");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">單詞書</h1>
          <Button
            size="icon"
            className="rounded-2xl"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">載入中...</p>
          </div>
        ) : wordbooks.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">還沒有單詞書</h3>
            <p className="text-sm text-muted-foreground mb-4">
              創建你的第一個單詞書開始學習
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              創建單詞書
            </Button>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWordbook(wordbook.id);
                        }}
                      >
                        刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>創建新單詞書</DialogTitle>
              <DialogDescription>
                為你的單詞書起個名字，並添加簡短描述
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">名稱</Label>
                <Input
                  id="name"
                  placeholder="例如：托福核心詞彙"
                  value={newWordbookName}
                  onChange={(e) => setNewWordbookName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">描述（可選）</Label>
                <Textarea
                  id="description"
                  placeholder="簡單描述這個單詞書的內容"
                  value={newWordbookDescription}
                  onChange={(e) => setNewWordbookDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="level">程度</Label>
                <Select value={newWordbookLevel} onValueChange={setNewWordbookLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="不限制">不限制</SelectItem>
                    <SelectItem value="國小">國小</SelectItem>
                    <SelectItem value="國中">國中</SelectItem>
                    <SelectItem value="高中">高中</SelectItem>
                    <SelectItem value="大學">大學</SelectItem>
                    <SelectItem value="TOEFL">托福 (TOEFL)</SelectItem>
                    <SelectItem value="IELTS">雅思 (IELTS)</SelectItem>
                    <SelectItem value="TOEIC">多益 (TOEIC)</SelectItem>
                    <SelectItem value="GRE">GRE</SelectItem>
                    <SelectItem value="GMAT">GMAT</SelectItem>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="CEFR-A1">CEFR A1</SelectItem>
                    <SelectItem value="CEFR-A2">CEFR A2</SelectItem>
                    <SelectItem value="CEFR-B1">CEFR B1</SelectItem>
                    <SelectItem value="CEFR-B2">CEFR B2</SelectItem>
                    <SelectItem value="CEFR-C1">CEFR C1</SelectItem>
                    <SelectItem value="CEFR-C2">CEFR C2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleCreateWordbook}>創建</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNav />
    </div>
  );
};

export default Wordbooks;
