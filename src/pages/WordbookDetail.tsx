import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Trash2, Upload, Sparkles } from "lucide-react";
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
import { db, Card as VocabCard, Wordbook } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { parseCSV } from "@/lib/csv";
import { toast } from "sonner";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";

const WordbookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wordbook, setWordbook] = useState<Wordbook | null>(null);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const book = await db.getWordbook(id);
      setWordbook(book || null);
      
      if (book) {
        const cardList = await db.getCardsByWordbook(id);
        setCards(cardList);
      }
    } catch (error) {
      console.error("Failed to load wordbook:", error);
      toast.error("載入單詞書失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newWord.trim() || !id) {
      toast.error("請輸入單字");
      return;
    }

    try {
      await db.createCard({
        wordbook_id: id,
        word: newWord,
        definition: newDefinition || undefined,
      });
      
      toast.success("單字卡已新增");
      setIsAddDialogOpen(false);
      setNewWord("");
      setNewDefinition("");
      loadData();
    } catch (error) {
      console.error("Failed to create card:", error);
      toast.error("新增單字卡失敗");
    }
  };

  const handleGenerateDetails = async () => {
    if (!newWord.trim()) {
      toast.error("請先輸入單字");
      return;
    }

    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先設定 Gemini API 密鑰");
      setIsApiKeyDialogOpen(true);
      return;
    }

    try {
      setIsGenerating(true);
      const details = await generateWordDetails([newWord], settings.gemini_api_key);
      
      if (details && details.length > 0) {
        setNewDefinition(details[0].definition || "");
      }
      
      toast.success("已生成單字詳情");
    } catch (error) {
      console.error("Failed to generate details:", error);
      toast.error("生成失敗，請檢查 API 密鑰");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("確定要刪除這張卡片嗎？")) return;

    try {
      await db.deleteCard(cardId);
      toast.success("卡片已刪除");
      loadData();
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast.error("刪除失敗");
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
      const text = await file.text();
      const csvCards = parseCSV(text);
      
      for (const csvCard of csvCards) {
        await db.createCard({
          wordbook_id: id,
          word: csvCard.headword,
          definition: csvCard.meaning_zh || csvCard.meaning_en,
          pronunciation: csvCard.ipa,
        });
      }
      
      toast.success(`已匯入 ${csvCards.length} 個單字`);
      loadData();
    } catch (error) {
      console.error("Failed to import CSV:", error);
      toast.error("匯入失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  if (!wordbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">找不到單詞書</h2>
          <Button onClick={() => navigate("/wordbooks")}>返回列表</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/wordbooks")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <h1 className="text-3xl font-bold">{wordbook.name}</h1>
              {wordbook.description && (
                <p className="text-muted-foreground">{wordbook.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              匯入 CSV
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新增單字卡
            </Button>
          </div>
        </div>

        {cards.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">還沒有單字卡</h3>
            <p className="text-sm text-muted-foreground mb-4">
              開始添加單字開始學習
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新增單字卡
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="p-6 hover:shadow-lg transition-shadow group relative"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold mb-2 pr-8">{card.word}</h3>
                {card.pronunciation && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {card.pronunciation}
                  </p>
                )}
                {card.definition && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {card.definition}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增單字卡</DialogTitle>
              <DialogDescription>
                輸入單字，可以使用 AI 自動生成詳情
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="word">單字</Label>
                <div className="flex gap-2">
                  <Input
                    id="word"
                    placeholder="例如：abandon"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleGenerateDetails}
                    disabled={isGenerating || !newWord.trim()}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="definition">釋義</Label>
                <Textarea
                  id="definition"
                  placeholder="單字的釋義和說明"
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleAddCard}>新增</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ApiKeyDialog
          open={isApiKeyDialogOpen}
          onOpenChange={setIsApiKeyDialogOpen}
          onSave={async (apiKey) => {
            await db.updateUserSettings({ gemini_api_key: apiKey });
            toast.success("API 密鑰已保存");
          }}
        />
      </div>
    </div>
  );
};

export default WordbookDetail;
