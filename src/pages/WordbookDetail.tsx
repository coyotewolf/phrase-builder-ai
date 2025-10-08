import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Trash2, Upload, Sparkles, Edit, Settings, X, Play, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { db, Card as VocabCard, Wordbook } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { parseCSV } from "@/lib/csv";
import { toast } from "sonner";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { AddCardDialog } from "@/components/AddCardDialog";
import { EditCardDialog } from "@/components/EditCardDialog";
import { EditWordbookDialog } from "@/components/EditWordbookDialog";
import { RegenerateCardsDialog } from "@/components/RegenerateCardsDialog";
import { ReviewModeDialog } from "@/components/ReviewModeDialog";

const WordbookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [wordbook, setWordbook] = useState<Wordbook | null>(null);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditWordbookDialogOpen, setIsEditWordbookDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VocabCard | null>(null);
  const [pendingLevel, setPendingLevel] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [initialSelectionState, setInitialSelectionState] = useState<Map<string, boolean>>(new Map());
  const [isReviewModeDialogOpen, setIsReviewModeDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'alphabet' | 'created' | 'errors'>('created');
  const [cardsWithStats, setCardsWithStats] = useState<Array<VocabCard & { errorCount: number }>>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const longPressedCardId = useRef<string | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_DURATION = 500; // 500ms for long press
  const SCROLL_EDGE_THRESHOLD = 80; // pixels from edge to trigger scroll
  const MOVE_THRESHOLD = 10; // pixels of movement to cancel long press
  const SCROLL_SPEED = 10; // pixels per scroll tick

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
        
        // Load stats for each card
        const cardsWithStatsData = await Promise.all(
          cardList.map(async (card) => {
            const stats = await db.getCardStats(card.id);
            return {
              ...card,
              errorCount: stats?.wrong_count || 0
            };
          })
        );
        
        setCardsWithStats(cardsWithStatsData);
        sortCards(cardsWithStatsData, sortBy);
      }
    } catch (error) {
      console.error("Failed to load wordbook:", error);
      toast.error("載入單詞書失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const sortCards = (cardsList: Array<VocabCard & { errorCount: number }>, sortType: 'alphabet' | 'created' | 'errors') => {
    const sorted = [...cardsList].sort((a, b) => {
      switch (sortType) {
        case 'alphabet':
          return a.headword.localeCompare(b.headword, 'en');
        case 'errors':
          return b.errorCount - a.errorCount;
        case 'created':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    setCards(sorted);
  };

  useEffect(() => {
    if (cardsWithStats.length > 0) {
      sortCards(cardsWithStats, sortBy);
    }
  }, [sortBy]);

  const handleAddCard = async (cardData: {
    headword: string;
    phonetic: string;
    meanings: Array<{
      part_of_speech: string;
      meaning_zh: string;
      meaning_en: string;
      synonyms: string[];
      antonyms: string[];
      examples: string[];
    }>;
    notes: string;
  }) => {
    if (!id) return;

    try {
      await db.createCard({
        wordbook_id: id,
        headword: cardData.headword,
        phonetic: cardData.phonetic || undefined,
        meanings: cardData.meanings,
        notes: cardData.notes || undefined,
        star: false,
        tags: [],
      });
      
      toast.success("單字卡已新增");
      loadData();
    } catch (error) {
      console.error("Failed to create card:", error);
      toast.error("新增單字卡失敗");
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
      const levelChanged = updates.level && updates.level !== wordbook?.level;
      await db.updateWordbook(id, updates);
      toast.success("單詞書已更新");
      await loadData();
      
      // If level changed, show dialog to ask if user wants to regenerate all cards
      if (levelChanged && cards.length > 0) {
        setPendingLevel(updates.level!);
        setIsRegenerateDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to update wordbook:", error);
      toast.error("更新失敗");
    }
  };

  const handleRegenerateAllCards = async () => {
    if (!pendingLevel) return;
    
    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先設定 Gemini API 密鑰");
      setIsApiKeyDialogOpen(true);
      return;
    }

    setIsRegenerateDialogOpen(false);
    setIsRegenerating(true);
    
    try {
      // Reload cards to get the latest data
      const currentCards = await db.getCardsByWordbook(id!);
      toast.info(`開始重新生成 ${currentCards.length} 張單字卡...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < currentCards.length; i++) {
        const card = currentCards[i];
        try {
          toast.info(`正在處理 ${i + 1}/${currentCards.length}: ${card.headword}`);
          
          const details = await generateWordDetails(
            { 
              words: [card.headword], 
              level: pendingLevel,
              limits: { synonyms: 10, antonyms: 10, examples: 5 }
            },
            settings.gemini_api_key
          );
          
          if (details && details.length > 0) {
            const detail = details[0];
            await db.updateCard(card.id, {
              phonetic: detail.ipa || card.phonetic,
              meanings: detail.meanings.map(m => ({
                part_of_speech: m.part_of_speech,
                meaning_zh: m.definition_zh || "",
                meaning_en: m.definition_en || "",
                synonyms: m.synonyms || [],
                antonyms: m.antonyms || [],
                examples: m.examples || [],
              })),
              notes: detail.notes || card.notes,
            });
            successCount++;
          }
          
          // Small delay to avoid rate limiting
          if (i < currentCards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to regenerate card ${card.headword}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`✅ 成功重新生成所有 ${successCount} 張單字卡`);
      } else {
        toast.warning(`已重新生成 ${successCount} 張單字卡，${errorCount} 張失敗`);
      }
      await loadData();
    } catch (error) {
      console.error("Failed to regenerate cards:", error);
      toast.error("批量重新生成失敗");
    } finally {
      setIsRegenerating(false);
      setPendingLevel(null);
    }
  };

  const handleFillIncompleteCards = async () => {
    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先設定 Gemini API 密鑰");
      setIsApiKeyDialogOpen(true);
      return;
    }

    setIsFilling(true);
    
    try {
      const incompleteCards = cards.filter(card => {
        const hasNoPhonetic = !card.phonetic;
        const hasEmptyMeanings = !card.meanings || card.meanings.length === 0 || 
          card.meanings.some(m => !m.meaning_zh && !m.meaning_en);
        const hasNoDetails = card.meanings?.every(m => 
          (!m.synonyms || m.synonyms.length === 0) && 
          (!m.antonyms || m.antonyms.length === 0) && 
          (!m.examples || m.examples.length === 0)
        );
        return hasNoPhonetic || hasEmptyMeanings || hasNoDetails;
      });

      if (incompleteCards.length === 0) {
        toast.info("所有單字卡資料都已完整");
        return;
      }

      toast.info(`找到 ${incompleteCards.length} 張不完整的單字卡，開始補齊...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < incompleteCards.length; i++) {
        const card = incompleteCards[i];
        try {
          toast.info(`正在處理 ${i + 1}/${incompleteCards.length}: ${card.headword}`);
          
          const details = await generateWordDetails(
            { 
              words: [card.headword], 
              level: wordbook?.level || 'TOEFL',
              limits: { synonyms: 10, antonyms: 10, examples: 5 }
            },
            settings.gemini_api_key
          );
          
          if (details && details.length > 0) {
            const detail = details[0];
            await db.updateCard(card.id, {
              phonetic: detail.ipa || card.phonetic,
              meanings: detail.meanings.map(m => ({
                part_of_speech: m.part_of_speech,
                meaning_zh: m.definition_zh || "",
                meaning_en: m.definition_en || "",
                synonyms: m.synonyms || [],
                antonyms: m.antonyms || [],
                examples: m.examples || [],
              })),
              notes: detail.notes || card.notes,
            });
            successCount++;
          }
          
          if (i < incompleteCards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to fill card ${card.headword}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`✅ 成功補齊所有 ${successCount} 張單字卡`);
      } else {
        toast.warning(`已補齊 ${successCount} 張單字卡，${errorCount} 張失敗`);
      }
      await loadData();
    } catch (error) {
      console.error("Failed to fill incomplete cards:", error);
      toast.error("補齊失敗");
    } finally {
      setIsFilling(false);
    }
  };

  const enterSelectionMode = (cardId: string) => {
    setIsSelectionMode(true);
    setSelectedCardIds(new Set([cardId]));
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedCardIds(new Set());
    setIsDragging(false);
    setIsLongPressing(false);
    // Restore scrolling when exiting selection mode
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  };

  const startAutoScroll = (clientY: number) => {
    const windowHeight = window.innerHeight;
    
    // Only scroll if near edges
    if (clientY < SCROLL_EDGE_THRESHOLD) {
      // Near top edge - scroll up
      if (!autoScrollInterval.current) {
        autoScrollInterval.current = setInterval(() => {
          window.scrollBy(0, -SCROLL_SPEED);
        }, 16); // ~60fps
      }
    } else if (clientY > windowHeight - SCROLL_EDGE_THRESHOLD) {
      // Near bottom edge - scroll down
      if (!autoScrollInterval.current) {
        autoScrollInterval.current = setInterval(() => {
          window.scrollBy(0, SCROLL_SPEED);
        }, 16);
      }
    } else {
      // Not near edges - stop scrolling
      stopAutoScroll();
    }
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const handleCardLongPress = (cardId: string) => {
    longPressedCardId.current = cardId;
    
    // Ensure body scrolling is prevented
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    if (!isSelectionMode) {
      // Enter selection mode
      // Record state BEFORE toggling
      const stateMap = new Map<string, boolean>();
      cards.forEach(card => {
        stateMap.set(card.id, false); // All cards were unselected before entering selection mode
      });
      
      // Update all states together to ensure consistency
      setIsSelectionMode(true);
      setSelectedCardIds(new Set([cardId]));
      setIsDragging(true);
      setIsLongPressing(true);
      setInitialSelectionState(stateMap);
    } else {
      // In selection mode, record current state BEFORE toggling
      const stateMap = new Map<string, boolean>();
      cards.forEach(c => {
        stateMap.set(c.id, selectedCardIds.has(c.id));
      });
      
      // Then toggle the long-pressed card
      const newSelectedState = !selectedCardIds.has(cardId);
      const newSet = new Set(selectedCardIds);
      if (newSelectedState) {
        newSet.add(cardId);
      } else {
        newSet.delete(cardId);
      }
      
      setSelectedCardIds(newSet);
      setIsDragging(true);
      setIsLongPressing(true);
      setInitialSelectionState(stateMap);
    }
  };

  const handleCardTouchStart = (cardId: string, e: React.TouchEvent | React.MouseEvent) => {
    // Record touch start position
    if ('touches' in e) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      touchStartPos.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
    
    // In selection mode, immediately prevent scrolling to prepare for potential drag
    if (isSelectionMode && 'touches' in e) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    
    // Always start long press timer
    longPressTimer.current = setTimeout(() => {
      handleCardLongPress(cardId);
    }, LONG_PRESS_DURATION);
  };

  const handleCardTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Restore body scrolling when drag ends
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    touchStartPos.current = null;
    setIsDragging(false);
    setIsLongPressing(false);
    stopAutoScroll();
    setInitialSelectionState(new Map());
    longPressedCardId.current = null;
  };

  const handleCardTouchMove = (e: React.TouchEvent) => {
    // In selection mode with active timer, prevent scrolling immediately
    if (isSelectionMode && longPressTimer.current) {
      e.preventDefault();
    }
    
    // Only clear long press timer if moved beyond threshold AND not in selection mode
    if (longPressTimer.current && touchStartPos.current && !isSelectionMode) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      
      // If moved beyond threshold, user wants to scroll, clear timer and restore scrolling
      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        touchStartPos.current = null;
        setIsLongPressing(false);
        // Restore scrolling if long press was cancelled
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    }
  };

  const toggleCardSelection = (cardId: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedCardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const selectAllCards = () => {
    setSelectedCardIds(new Set(cards.map(card => card.id)));
  };

  const deselectAllCards = () => {
    setSelectedCardIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedCardIds.size === cards.length) {
      deselectAllCards();
    } else {
      selectAllCards();
    }
  };

  const handleBatchDelete = async () => {
    if (selectedCardIds.size === 0) return;
    
    if (!confirm(`確定要刪除選中的 ${selectedCardIds.size} 張單字卡嗎？`)) return;

    try {
      for (const cardId of selectedCardIds) {
        await db.deleteCard(cardId);
      }
      toast.success(`已刪除 ${selectedCardIds.size} 張單字卡`);
      setSelectedCardIds(new Set());
      setIsSelectionMode(false);
      loadData();
    } catch (error) {
      console.error("Failed to delete cards:", error);
      toast.error("刪除失敗");
    }
  };

  const handleBatchRegenerate = async () => {
    if (selectedCardIds.size === 0) return;
    
    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先設定 Gemini API 密鑰");
      setIsApiKeyDialogOpen(true);
      return;
    }

    setIsRegenerating(true);
    
    try {
      const selectedCards = cards.filter(card => selectedCardIds.has(card.id));
      toast.info(`開始重新生成 ${selectedCards.length} 張單字卡...`);
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i];
        try {
          toast.info(`正在處理 ${i + 1}/${selectedCards.length}: ${card.headword}`);
          
          const details = await generateWordDetails(
            { 
              words: [card.headword], 
              level: wordbook?.level || 'TOEFL',
              limits: { synonyms: 10, antonyms: 10, examples: 5 }
            },
            settings.gemini_api_key
          );
          
          if (details && details.length > 0) {
            const detail = details[0];
            await db.updateCard(card.id, {
              phonetic: detail.ipa || card.phonetic,
              meanings: detail.meanings.map(m => ({
                part_of_speech: m.part_of_speech,
                meaning_zh: m.definition_zh || "",
                meaning_en: m.definition_en || "",
                synonyms: m.synonyms || [],
                antonyms: m.antonyms || [],
                examples: m.examples || [],
              })),
              notes: detail.notes || card.notes,
            });
            successCount++;
          }
          
          if (i < selectedCards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Failed to regenerate card ${card.headword}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`✅ 成功重新生成所有 ${successCount} 張單字卡`);
      } else {
        toast.warning(`已重新生成 ${successCount} 張單字卡，${errorCount} 張失敗`);
      }
      setSelectedCardIds(new Set());
      setIsSelectionMode(false);
      await loadData();
    } catch (error) {
      console.error("Failed to batch regenerate:", error);
      toast.error("批量重新生成失敗");
    } finally {
      setIsRegenerating(false);
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
          phonetic: csvCard.ipa,
          meanings: [{
            part_of_speech: (csvCard as any).part_of_speech || "",
            meaning_zh: csvCard.meaning_zh,
            meaning_en: csvCard.meaning_en,
            synonyms: [],
            antonyms: [],
            examples: [],
          }],
          star: false,
          tags: [],
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20 overflow-x-hidden">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{wordbook.name}</h1>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsEditWordbookDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              {wordbook.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {wordbook.description}
                </p>
              )}
              {wordbook.level && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  {wordbook.level}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  排序
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('created')}>
                  按添加時間
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alphabet')}>
                  按字母順序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('errors')}>
                  按錯誤次數
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReviewModeDialogOpen(true)}
            >
              <Play className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">開始複習</span>
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">匯入 CSV</span>
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">新增單字卡</span>
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
          <>
            {isSelectionMode && (
              <div className="sticky top-0 z-50 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm pb-3 mb-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 bg-card rounded-lg border border-primary/20 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelSelectionMode}
                      className="hover:bg-destructive/10 shrink-0"
                    >
                      <X className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">取消</span>
                    </Button>
                    <div className="h-4 w-px bg-border shrink-0" />
                    <Checkbox
                      checked={selectedCardIds.size === cards.length && cards.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="shrink-0"
                    />
                    <span className="text-sm font-medium truncate">
                      <span className="hidden sm:inline">已選擇 </span>
                      <span className="font-semibold text-primary">{selectedCardIds.size}</span>
                      <span className="text-muted-foreground"> / {cards.length}</span>
                      <span className="hidden sm:inline"> 張卡片</span>
                      <span className="inline sm:hidden"> 張</span>
                    </span>
                  </div>
                  <div className="flex gap-2 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBatchRegenerate}
                      disabled={selectedCardIds.size === 0}
                      className="hover:bg-primary/10 flex-1 sm:flex-none"
                    >
                      <Sparkles className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">AI 重新生成</span>
                      <span className="inline sm:hidden">重新生成</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                      disabled={selectedCardIds.size === 0}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">刪除</span>
                      <span className="inline sm:hidden">刪除</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isSelectionMode && cards.length > 0 && (
              <div className="text-center text-sm text-muted-foreground mb-4 py-2 px-4 bg-muted/30 rounded-lg">
                💡 長按字卡進入選擇模式，滑動選取多個字卡
              </div>
            )}
            
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              style={{
                touchAction: (isSelectionMode && isDragging) ? 'none' : 'auto'
              }}
            >
              {cards.map((card) => {
                const isSelected = selectedCardIds.has(card.id);
                return (
                  <Card
                    key={card.id}
                    className={`p-6 transition-all group relative cursor-pointer select-none ${
                      isSelectionMode 
                        ? isSelected 
                          ? 'ring-2 ring-primary bg-primary/10' 
                          : 'hover:ring-2 hover:ring-primary/50'
                        : 'hover:shadow-lg'
                    }`}
                    style={{
                      touchAction: (isSelectionMode && isLongPressing) ? 'none' : 'auto'
                    }}
                    onTouchStart={(e) => {
                      handleCardTouchStart(card.id, e);
                    }}
                    onTouchEnd={(e) => {
                      handleCardTouchEnd();
                    }}
                    onTouchMove={(e) => {
                      handleCardTouchMove(e);
                      
                      // Always prevent default when dragging in selection mode
                      if (isDragging && isSelectionMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        
                        // Check if near edges and start/stop auto-scroll accordingly
                        startAutoScroll(touch.clientY);
                        
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const cardElement = element?.closest('[data-card-id]');
                        if (cardElement) {
                          const hoveredCardId = cardElement.getAttribute('data-card-id');
                          if (hoveredCardId) {
                            const wasInitiallySelected = initialSelectionState.get(hoveredCardId) || false;
                            const isCurrentlySelected = selectedCardIds.has(hoveredCardId);
                            
                            // Toggle based on initial state: if was selected, deselect; if wasn't, select
                            if (wasInitiallySelected && isCurrentlySelected) {
                              setSelectedCardIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(hoveredCardId);
                                return newSet;
                              });
                            } else if (!wasInitiallySelected && !isCurrentlySelected) {
                              setSelectedCardIds(prev => new Set(prev).add(hoveredCardId));
                            }
                          }
                        }
                      }
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      // Always start long press timer for drag functionality
                      handleCardTouchStart(card.id, e);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      handleCardTouchEnd();
                    }}
                    onMouseMove={(e) => {
                      if (isDragging && isSelectionMode) {
                        // Check if near edges and start/stop auto-scroll accordingly
                        startAutoScroll(e.clientY);
                      }
                    }}
                    onMouseEnter={() => {
                      if (isDragging && isSelectionMode) {
                        const wasInitiallySelected = initialSelectionState.get(card.id) || false;
                        const isCurrentlySelected = selectedCardIds.has(card.id);
                        
                        // Toggle based on initial state
                        if (wasInitiallySelected && isCurrentlySelected) {
                          setSelectedCardIds(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(card.id);
                            return newSet;
                          });
                        } else if (!wasInitiallySelected && !isCurrentlySelected) {
                          setSelectedCardIds(prev => new Set(prev).add(card.id));
                        }
                      }
                    }}
                    data-card-id={card.id}
                  >
                    {isSelectionMode && (
                      <div 
                        className="absolute top-4 left-4 z-10"
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                          toggleCardSelection(card.id, e);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggleCardSelection(card.id, e);
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="h-5 w-5 pointer-events-none"
                        />
                      </div>
                    )}
                    
                    {!isSelectionMode && (
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
                    )}
                    
                    <h3 className={`text-xl font-bold mb-2 break-words ${isSelectionMode ? 'pl-8' : 'pr-16'}`}>
                      {card.headword}
                    </h3>
                    {card.phonetic && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {card.phonetic}
                      </p>
                    )}
                    {card.meanings && card.meanings.length > 0 && (
                      <div className="space-y-1">
                        {card.meanings.map((meaning, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {meaning.part_of_speech && `${meaning.part_of_speech}. `}
                            {meaning.meaning_zh || meaning.meaning_en}
                          </p>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <AddCardDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={handleAddCard}
          wordbookLevel={wordbook?.level}
        />

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
          onFillIncomplete={handleFillIncompleteCards}
        />

        <RegenerateCardsDialog
          open={isRegenerateDialogOpen}
          onOpenChange={setIsRegenerateDialogOpen}
          onConfirm={handleRegenerateAllCards}
          level={pendingLevel || ""}
          cardCount={cards.length}
        />

        {(isRegenerating || isFilling) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-6 space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <p className="font-semibold">
                  {isRegenerating ? '正在重新生成單字卡...' : '正在補齊單字卡資料...'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                請稍候，這可能需要幾分鐘時間
              </p>
            </Card>
          </div>
        )}
      </div>

      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        currentApiKey={undefined}
        onSave={() => {}}
      />

      <AddCardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddCard}
        wordbookLevel={wordbook?.level}
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
        onFillIncomplete={handleFillIncompleteCards}
      />

      <RegenerateCardsDialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        onConfirm={handleRegenerateAllCards}
        level={pendingLevel || wordbook?.level || ""}
        cardCount={cards.length}
      />

      <ReviewModeDialog
        open={isReviewModeDialogOpen}
        onOpenChange={setIsReviewModeDialogOpen}
        onSelect={(mode) => navigate(`/review?mode=wordbook&wordbookId=${id}&order=${mode}`)}
        wordbookName={wordbook?.name || ""}
      />
    </div>
  );
};

export default WordbookDetail;
