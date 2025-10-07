import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db, Wordbook } from "@/lib/db";
import { toast } from "sonner";

const Wordbooks = () => {
  const navigate = useNavigate();
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWordbookName, setNewWordbookName] = useState("");
  const [newWordbookDescription, setNewWordbookDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadWordbooks();
  }, []);

  const loadWordbooks = async () => {
    try {
      setIsLoading(true);
      const books = await db.getAllWordbooks();
      setWordbooks(books);
      
      // Load card counts
      const counts: Record<string, number> = {};
      for (const book of books) {
        const cards = await db.getCardsByWordbook(book.id);
        counts[book.id] = cards.length;
      }
      setCardCounts(counts);
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
      });
      
      toast.success("單詞書創建成功");
      setIsCreateDialogOpen(false);
      setNewWordbookName("");
      setNewWordbookDescription("");
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

  const getCardCount = async (wordbookId: string): Promise<number> => {
    try {
      const cards = await db.getCardsByWordbook(wordbookId);
      return cards.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <h1 className="text-3xl font-bold">單詞書</h1>
              <p className="text-muted-foreground">管理你的單詞集合</p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            新增單詞書
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordbooks.map((wordbook) => (
              <Card
                key={wordbook.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => navigate(`/wordbooks/${wordbook.id}`)}
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWordbook(wordbook.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mb-2 pr-8">{wordbook.name}</h3>
                {wordbook.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {wordbook.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {cardCounts[wordbook.id] || 0} 張卡片
                  </span>
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
    </div>
  );
};

export default Wordbooks;
