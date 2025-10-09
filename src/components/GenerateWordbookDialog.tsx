import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { toast } from "sonner";
import * as wordlists from "@/data/preset-wordlists";

interface GenerateWordbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PresetWordbook {
  id: string;
  name: string;
  description: string;
  level: string;
  words: string[];
}

const PRESET_WORDBOOKS: PresetWordbook[] = [
  {
    id: "7000-all",
    name: "高中7000單 - 完整版",
    description: "高中必背7000單字完整列表",
    level: "高中",
    words: [
      ...wordlists.HIGH_SCHOOL_7000,
      ...wordlists.HIGH_SCHOOL_LEVEL_2,
      ...wordlists.HIGH_SCHOOL_LEVEL_3,
      ...wordlists.HIGH_SCHOOL_LEVEL_4,
      ...wordlists.HIGH_SCHOOL_LEVEL_5,
    ].slice(0, 7000)
  },
  {
    id: "7000-level1",
    name: "高中7000單 - Level 1",
    description: "最基礎必背1000單字",
    level: "高中",
    words: wordlists.HIGH_SCHOOL_7000
  },
  {
    id: "7000-level2",
    name: "高中7000單 - Level 2",
    description: "進階1000單字",
    level: "高中",
    words: wordlists.HIGH_SCHOOL_LEVEL_2
  },
  {
    id: "7000-level3",
    name: "高中7000單 - Level 3",
    description: "中階1500單字",
    level: "高中",
    words: wordlists.HIGH_SCHOOL_LEVEL_3
  },
  {
    id: "7000-level4",
    name: "高中7000單 - Level 4",
    description: "中高階1500單字",
    level: "高中",
    words: wordlists.HIGH_SCHOOL_LEVEL_4
  },
  {
    id: "7000-level5",
    name: "高中7000單 - Level 5",
    description: "高階2000單字",
    level: "高中",
    words: wordlists.HIGH_SCHOOL_LEVEL_5
  },
  {
    id: "toefl-3000",
    name: "托福核心3000單字",
    description: "托福考試高頻核心詞彙完整收錄",
    level: "TOEFL",
    words: wordlists.TOEFL_3000
  },
  {
    id: "gre-3000",
    name: "GRE核心3000單字",
    description: "GRE考試必備高階詞彙完整收錄",
    level: "GRE",
    words: wordlists.GRE_3000
  },
  {
    id: "ielts-core",
    name: "雅思核心詞彙3000",
    description: "IELTS 考試必備詞彙",
    level: "IELTS",
    words: wordlists.IELTS_CORE
  },
  {
    id: "toeic-core",
    name: "多益核心詞彙3000",
    description: "TOEIC 考試必備商務英語詞彙",
    level: "TOEIC",
    words: wordlists.TOEIC_CORE
  },
  {
    id: "sat-core",
    name: "SAT核心詞彙2000",
    description: "SAT 考試必備詞彙",
    level: "SAT",
    words: wordlists.SAT_CORE
  },
  {
    id: "business-english",
    name: "商務英語核心1500",
    description: "商務溝通必備詞彙",
    level: "大學",
    words: wordlists.BUSINESS_ENGLISH
  },
  {
    id: "academic-english",
    name: "學術英語核心1500",
    description: "學術寫作與研究必備詞彙",
    level: "大學",
    words: wordlists.ACADEMIC_ENGLISH
  },
  {
    id: "daily-english",
    name: "日常生活英語1000",
    description: "日常對話必備詞彙",
    level: "國中",
    words: wordlists.DAILY_ENGLISH
  }
];

export function GenerateWordbookDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateWordbookDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_WORDBOOKS[0].id);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customLevel, setCustomLevel] = useState("不限制");
  const [customWords, setCustomWords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("preset");

  const handleGenerate = async () => {
    let name: string;
    let description: string;
    let level: string;
    let words: string[];

    if (activeTab === "preset") {
      const preset = PRESET_WORDBOOKS.find(p => p.id === selectedPreset);
      if (!preset) return;
      name = preset.name;
      description = preset.description;
      level = preset.level;
      words = preset.words;
    } else {
      // Custom input
      if (!customName.trim()) {
        toast.error("請輸入單詞書名稱");
        return;
      }
      if (!customWords.trim()) {
        toast.error("請輸入單字列表");
        return;
      }
      
      // Parse words from textarea (one word per line, or comma-separated)
      words = customWords
        .split(/[\n,]/)
        .map(w => w.trim())
        .filter(w => w.length > 0);
      
      if (words.length === 0) {
        toast.error("請至少輸入一個單字");
        return;
      }
      
      if (words.length > 10000) {
        toast.error("單字數量不能超過 10000 個");
        return;
      }

      name = customName;
      description = customDescription || `自定義單詞書，包含 ${words.length} 個單字`;
      level = customLevel;
    }

    // Check API key
    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先在設定中設置 Gemini API 金鑰");
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: words.length });

    try {
      // Create wordbook
      const wordbook = await db.createWordbook({
        name,
        description,
        level,
      });

      // Generate cards in batches of 10
      const batchSize = 10;
      let successCount = 0;
      
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        
        try {
          const wordDetails = await generateWordDetails(
            {
              words: batch,
              level,
              limits: { synonyms: 4, antonyms: 4, examples: 2 },
            },
            settings.gemini_api_key
          );

          // Create cards from generated details
          for (const detail of wordDetails) {
            await db.createCard({
              wordbook_id: wordbook.id,
              headword: detail.headword,
              phonetic: detail.ipa,
              meanings: detail.meanings.map(m => ({
                part_of_speech: m.part_of_speech,
                meaning_zh: m.definition_zh,
                meaning_en: m.definition_en,
                synonyms: m.synonyms,
                antonyms: m.antonyms,
                examples: m.examples,
              })),
              notes: detail.notes,
              star: false,
              tags: [],
            });
            successCount++;
          }

          setProgress({ current: Math.min(i + batchSize, words.length), total: words.length });
          
          // Add delay to avoid rate limiting
          if (i + batchSize < words.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to generate batch starting at ${i}:`, error);
          toast.error(`批次 ${Math.floor(i / batchSize) + 1} 生成失敗，繼續處理...`);
          // Continue with next batch even if one fails
        }
      }

      toast.success(`成功生成 ${successCount} 個單字卡！`);
      
      // Reset custom form
      setCustomName("");
      setCustomDescription("");
      setCustomLevel("不限制");
      setCustomWords("");
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to generate wordbook:", error);
      toast.error("生成單詞書失敗，請稍後重試");
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 生成常用單詞書
          </DialogTitle>
          <DialogDescription>
            選擇預設單詞書或自定義單字列表，AI 將自動生成完整的單字卡內容
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">預設單詞書</TabsTrigger>
            <TabsTrigger value="custom">自定義</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4">
            <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset}>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {PRESET_WORDBOOKS.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <RadioGroupItem value={preset.id} id={preset.id} className="mt-1" />
                    <Label htmlFor={preset.id} className="flex-1 cursor-pointer">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{preset.name}</p>
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {preset.level}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {preset.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          共 {preset.words.length} 個單字
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">單詞書名稱 *</Label>
                <Input
                  id="custom-name"
                  placeholder="例如：我的專屬詞彙表"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-description">描述（可選）</Label>
                <Input
                  id="custom-description"
                  placeholder="簡單描述這個單詞書的內容"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-level">程度</Label>
                <select
                  id="custom-level"
                  className="w-full p-2 border rounded-md bg-background"
                  value={customLevel}
                  onChange={(e) => setCustomLevel(e.target.value)}
                >
                  <option value="不限制">不限制</option>
                  <option value="國小">國小</option>
                  <option value="國中">國中</option>
                  <option value="高中">高中</option>
                  <option value="大學">大學</option>
                  <option value="TOEFL">托福 (TOEFL)</option>
                  <option value="IELTS">雅思 (IELTS)</option>
                  <option value="TOEIC">多益 (TOEIC)</option>
                  <option value="GRE">GRE</option>
                  <option value="SAT">SAT</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-words">單字列表 * (每行一個單字，或用逗號分隔)</Label>
                <Textarea
                  id="custom-words"
                  placeholder="例如：&#10;apple&#10;banana&#10;cherry&#10;&#10;或：apple, banana, cherry"
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  已輸入 {customWords.split(/[\n,]/).filter(w => w.trim()).length} 個單字
                  （最多 10000 個）
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>正在生成單字卡...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              此過程可能需要較長時間，請耐心等待。大量單字可能需要數十分鐘。
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                開始生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
