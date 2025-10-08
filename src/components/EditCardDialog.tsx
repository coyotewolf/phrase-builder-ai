import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card as VocabCard, CardMeaning, db } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: VocabCard | null;
  onSave: (updates: Partial<VocabCard>) => void;
  wordbookLevel?: string;
}

export function EditCardDialog({
  open,
  onOpenChange,
  card,
  onSave,
  wordbookLevel,
}: EditCardDialogProps) {
  const [headword, setHeadword] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [meanings, setMeanings] = useState<CardMeaning[]>([]);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (card) {
      setHeadword(card.headword || "");
      setPhonetic(card.phonetic || "");
      setMeanings(card.meanings || []);
      setNotes(card.notes || "");
    }
  }, [card]);

  const handleSave = () => {
    onSave({
      headword,
      phonetic,
      meanings,
      notes,
    });
    onOpenChange(false);
  };

  const addMeaning = () => {
    setMeanings([
      ...meanings,
      {
        part_of_speech: "",
        meaning_zh: "",
        meaning_en: "",
        synonyms: [],
        antonyms: [],
        examples: [],
      },
    ]);
  };

  const updateMeaning = (index: number, updates: Partial<CardMeaning>) => {
    const newMeanings = [...meanings];
    newMeanings[index] = { ...newMeanings[index], ...updates };
    setMeanings(newMeanings);
  };

  const removeMeaning = (index: number) => {
    setMeanings(meanings.filter((_, i) => i !== index));
  };

  const handleAIFillAll = async () => {
    if (!headword.trim()) {
      toast.error("請先輸入單字");
      return;
    }

    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先設定 Gemini API 密鑰");
      return;
    }

    try {
      setIsGenerating(true);
      const level = wordbookLevel || 'TOEFL';
      const details = await generateWordDetails(
        { 
          words: [headword], 
          level,
          limits: { synonyms: 10, antonyms: 10, examples: 5 }
        },
        settings.gemini_api_key
      );
      
      if (details && details.length > 0) {
        const detail = details[0];
        setPhonetic(detail.ipa || "");
        setMeanings(detail.meanings.map(m => ({
          part_of_speech: m.part_of_speech,
          meaning_zh: m.definition_zh,
          meaning_en: m.definition_en,
          synonyms: m.synonyms || [],
          antonyms: m.antonyms || [],
          examples: m.examples || [],
        })));
        setNotes(detail.notes || "");
        toast.success("AI 已完成填寫");
      }
    } catch (error) {
      console.error("Failed to generate details:", error);
      toast.error("AI 填寫失敗");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯單字卡</DialogTitle>
          <DialogDescription>
            修改單字卡的詳細資訊，支持多詞性分組
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIFillAll}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI 一鍵填寫所有詞性
          </Button>
        </div>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headword">單字 *</Label>
              <Input
                id="headword"
                value={headword}
                onChange={(e) => setHeadword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phonetic">音標 / IPA</Label>
              <Input
                id="phonetic"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/rɪˈsɪnd/"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>詞性與釋義</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMeaning}
              >
                <Plus className="h-4 w-4 mr-2" />
                新增詞性
              </Button>
            </div>

            {meanings.map((meaning, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">詞性 {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeaning(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>詞性</Label>
                  <Input
                    value={meaning.part_of_speech}
                    onChange={(e) =>
                      updateMeaning(index, { part_of_speech: e.target.value })
                    }
                    placeholder="noun, verb, adjective..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>中文釋義</Label>
                    <Textarea
                      value={meaning.meaning_zh}
                      onChange={(e) =>
                        updateMeaning(index, { meaning_zh: e.target.value })
                      }
                      rows={2}
                      placeholder="撤銷；廢除"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>英文定義</Label>
                    <Textarea
                      value={meaning.meaning_en}
                      onChange={(e) =>
                        updateMeaning(index, { meaning_en: e.target.value })
                      }
                      rows={2}
                      placeholder="to cancel or repeal officially"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>同義詞</Label>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {meaning.synonyms.map((syn, idx) => (
                      <Badge key={idx} variant="secondary">
                        {syn}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => {
                            const newSynonyms = meaning.synonyms.filter((_, i) => i !== idx);
                            updateMeaning(index, { synonyms: newSynonyms });
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入同義詞後按 Enter"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          if (input.value.trim()) {
                            updateMeaning(index, {
                              synonyms: [...meaning.synonyms, input.value.trim()],
                            });
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
                    {meaning.antonyms.map((ant, idx) => (
                      <Badge key={idx} variant="secondary">
                        {ant}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => {
                            const newAntonyms = meaning.antonyms.filter((_, i) => i !== idx);
                            updateMeaning(index, { antonyms: newAntonyms });
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入反義詞後按 Enter"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          if (input.value.trim()) {
                            updateMeaning(index, {
                              antonyms: [...meaning.antonyms, input.value.trim()],
                            });
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
                    {meaning.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-muted rounded"
                      >
                        <p className="flex-1 text-sm">{ex}</p>
                        <X
                          className="h-4 w-4 cursor-pointer mt-1"
                          onClick={() => {
                            const newExamples = meaning.examples.filter((_, i) => i !== idx);
                            updateMeaning(index, { examples: newExamples });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="輸入例句後按 Ctrl+Enter"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.ctrlKey) {
                          const input = e.currentTarget;
                          if (input.value.trim()) {
                            updateMeaning(index, {
                              examples: [...meaning.examples, input.value.trim()],
                            });
                            input.value = "";
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="額外的筆記或使用提示"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>儲存變更</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
