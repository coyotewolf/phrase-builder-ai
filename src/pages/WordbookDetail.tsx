import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Trash2, Upload, Sparkles, Edit, Settings } from "lucide-react";
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
import { EditCardDialog } from "@/components/EditCardDialog";
import { EditWordbookDialog } from "@/components/EditWordbookDialog";

const WordbookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wordbook, setWordbook] = useState<Wordbook | null>(null);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditWordbookDialogOpen, setIsEditWordbookDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newPhonetic, setNewPhonetic] = useState("");
  const [newPartOfSpeech, setNewPartOfSpeech] = useState("");
  const [newMeaningZh, setNewMeaningZh] = useState("");
  const [newMeaningEn, setNewMeaningEn] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newSynonyms, setNewSynonyms] = useState<string[]>([]);
  const [newAntonyms, setNewAntonyms] = useState<string[]>([]);
  const [newExamples, setNewExamples] = useState<string[]>([]);
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
        headword: newWord,
        phonetic: newPhonetic || undefined,
        part_of_speech: newPartOfSpeech || undefined,
        meaning_zh: newMeaningZh || undefined,
        meaning_en: newMeaningEn || undefined,
        notes: newNotes || undefined,
        star: false,
        tags: [],
        detail: {
          synonyms: newSynonyms,
          antonyms: newAntonyms,
          examples: newExamples,
          ipa: newPhonetic || undefined,
        },
      });
      
      toast.success("單字卡已新增");
      setIsAddDialogOpen(false);
      setNewWord("");
      setNewPhonetic("");
      setNewPartOfSpeech("");
      setNewMeaningZh("");
      setNewMeaningEn("");
      setNewNotes("");
      setNewSynonyms([]);
      setNewAntonyms([]);
      setNewExamples([]);
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
      const level = wordbook?.level || 'TOEFL';
      const details = await generateWordDetails(
        { 
          words: [newWord], 
          level,
          limits: { synonyms: 10, antonyms: 10, examples: 5 }
        },
        settings.gemini_api_key
      );
      
      if (details && details.length > 0) {
        const detail = details[0];
        setNewPhonetic(detail.ipa || "");
        setNewPartOfSpeech(detail.part_of_speech || "");
        setNewMeaningEn(detail.definition_en || "");
        setNewSynonyms(detail.synonyms || []);
        setNewAntonyms(detail.antonyms || []);
        setNewExamples(detail.examples || []);
        setNewNotes(detail.notes || "");
      }
      
      toast.success("已生成單字詳情");
    } catch (error) {
      console.error("Failed to generate details:", error);
      toast.error("生成失敗，請檢查 API 密鑰");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditCard = (card: VocabCard) => {
    setSelectedCard(card);
    setIsEditDialogOpen(true);
  };

  const handleSaveCard = async (updates: Partial<VocabCard>) => {
    if (!selectedCard) return;

    try {
      await db.updateCard(selectedCard.id, updates);
      toast.success("卡片已更新");
      loadData();
    } catch (error) {
      console.error("Failed to update card:", error);
      toast.error("更新失敗");
    }
  };

  const handleSaveWordbook = async (updates: Partial<Wordbook>) => {
    if (!id) return;

    try {
      await db.updateWordbook(id, updates);
      toast.success("單詞書已更新");
      loadData();
    } catch (error) {
      console.error("Failed to update wordbook:", error);
      toast.error("更新失敗");
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
          headword: csvCard.headword,
          meaning_zh: csvCard.meaning_zh,
          meaning_en: csvCard.meaning_en,
          phonetic: csvCard.ipa,
          star: false,
          tags: [],
          detail: {
            synonyms: [],
            antonyms: [],
            examples: [],
            ipa: csvCard.ipa,
          },
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{wordbook.name}</h1>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditWordbookDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              {wordbook.description && (
                <p className="text-muted-foreground">{wordbook.description}</p>
              )}
              {wordbook.level && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  {wordbook.level}
                </span>
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
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCard(card)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <h3 className="text-xl font-bold mb-2 pr-16">{card.headword}</h3>
                {card.phonetic && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {card.phonetic}
                  </p>
                )}
                {card.meaning_zh && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {card.meaning_zh}
                  </p>
                )}
                {card.meaning_en && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {card.meaning_en}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增單字卡</DialogTitle>
              <DialogDescription>
                輸入單字，可以使用 AI 自動生成詳情
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="word">單字 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="word"
                      placeholder="例如：rescind"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={handleGenerateDetails}
                      disabled={isGenerating || !newWord.trim()}
                      title="使用 AI 生成詳情"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phonetic">音標 / IPA</Label>
                  <Input
                    id="phonetic"
                    value={newPhonetic}
                    onChange={(e) => setNewPhonetic(e.target.value)}
                    placeholder="/rɪˈsɪnd/"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pos">詞性</Label>
                <Input
                  id="pos"
                  value={newPartOfSpeech}
                  onChange={(e) => setNewPartOfSpeech(e.target.value)}
                  placeholder="noun, verb, adjective..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meaning-zh">中文釋義</Label>
                <Textarea
                  id="meaning-zh"
                  value={newMeaningZh}
                  onChange={(e) => setNewMeaningZh(e.target.value)}
                  rows={2}
                  placeholder="撤銷；廢除"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meaning-en">英文定義</Label>
                <Textarea
                  id="meaning-en"
                  value={newMeaningEn}
                  onChange={(e) => setNewMeaningEn(e.target.value)}
                  rows={2}
                  placeholder="to cancel or repeal officially"
                />
              </div>

              <div className="space-y-2">
                <Label>同義詞</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {newSynonyms.map((syn, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                      {syn}
                      <button
                        type="button"
                        onClick={() => setNewSynonyms(newSynonyms.filter((_, i) => i !== idx))}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="輸入同義詞後按 Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          setNewSynonyms([...newSynonyms, input.value.trim()]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>反義詞</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {newAntonyms.map((ant, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                      {ant}
                      <button
                        type="button"
                        onClick={() => setNewAntonyms(newAntonyms.filter((_, i) => i !== idx))}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="輸入反義詞後按 Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          setNewAntonyms([...newAntonyms, input.value.trim()]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>例句</Label>
                <div className="space-y-2 mb-2">
                  {newExamples.map((ex, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                      <p className="flex-1 text-sm">{ex}</p>
                      <button
                        type="button"
                        onClick={() => setNewExamples(newExamples.filter((_, i) => i !== idx))}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="輸入例句"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          setNewExamples([...newExamples, input.value.trim()]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">按 Ctrl+Enter 新增例句</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="額外的筆記或使用提示"
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

        <EditCardDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          card={selectedCard}
          onSave={handleSaveCard}
          wordbookLevel={wordbook?.level}
        />

        <EditWordbookDialog
          open={isEditWordbookDialogOpen}
          onOpenChange={setIsEditWordbookDialogOpen}
          wordbook={wordbook}
          onSave={handleSaveWordbook}
        />
      </div>
    </div>
  );
};

export default WordbookDetail;
