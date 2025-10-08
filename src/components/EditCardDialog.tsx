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
import { Card as VocabCard, db } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [meaningZh, setMeaningZh] = useState("");
  const [meaningEn, setMeaningEn] = useState("");
  const [notes, setNotes] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState({
    phonetic: false,
    partOfSpeech: false,
    meaningEn: false,
    synonyms: false,
    antonyms: false,
    examples: false,
    notes: false,
  });
  const [newSynonym, setNewSynonym] = useState("");
  const [newAntonym, setNewAntonym] = useState("");
  const [newExample, setNewExample] = useState("");

  useEffect(() => {
    if (card) {
      setHeadword(card.headword || "");
      setPhonetic(card.phonetic || "");
      setPartOfSpeech(card.part_of_speech || "");
      setMeaningZh(card.meaning_zh || "");
      setMeaningEn(card.meaning_en || "");
      setNotes(card.notes || "");
      setSynonyms(card.detail?.synonyms || []);
      setAntonyms(card.detail?.antonyms || []);
      setExamples(card.detail?.examples || []);
    }
  }, [card]);

  const handleSave = () => {
    onSave({
      headword,
      phonetic,
      part_of_speech: partOfSpeech,
      meaning_zh: meaningZh,
      meaning_en: meaningEn,
      notes,
      detail: {
        synonyms,
        antonyms,
        examples,
        ipa: phonetic,
        level: card?.detail?.level,
      },
    });
    onOpenChange(false);
  };

  const addSynonym = () => {
    if (newSynonym.trim()) {
      setSynonyms([...synonyms, newSynonym.trim()]);
      setNewSynonym("");
    }
  };

  const addAntonym = () => {
    if (newAntonym.trim()) {
      setAntonyms([...antonyms, newAntonym.trim()]);
      setNewAntonym("");
    }
  };

  const addExample = () => {
    if (newExample.trim()) {
      setExamples([...examples, newExample.trim()]);
      setNewExample("");
    }
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
        setPartOfSpeech(detail.part_of_speech || "");
        setMeaningEn(detail.definition_en || "");
        setSynonyms(detail.synonyms || []);
        setAntonyms(detail.antonyms || []);
        setExamples(detail.examples || []);
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

  const handleAIFillSelected = async () => {
    if (!headword.trim()) {
      toast.error("請先輸入單字");
      return;
    }

    const hasSelection = Object.values(aiOptions).some(v => v);
    if (!hasSelection) {
      toast.error("請至少勾選一個項目");
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
        if (aiOptions.phonetic) setPhonetic(detail.ipa || "");
        if (aiOptions.partOfSpeech) setPartOfSpeech(detail.part_of_speech || "");
        if (aiOptions.meaningEn) setMeaningEn(detail.definition_en || "");
        if (aiOptions.synonyms) setSynonyms(detail.synonyms || []);
        if (aiOptions.antonyms) setAntonyms(detail.antonyms || []);
        if (aiOptions.examples) setExamples(detail.examples || []);
        if (aiOptions.notes) setNotes(detail.notes || "");
        toast.success("AI 已填寫選中項目");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯單字卡</DialogTitle>
          <DialogDescription>
            修改單字卡的詳細資訊
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
            AI 一鍵填寫
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIFillSelected}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            AI 填寫選中項
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
              <div className="flex items-center justify-between">
                <Label htmlFor="phonetic">音標 / IPA</Label>
                <Checkbox
                  checked={aiOptions.phonetic}
                  onCheckedChange={(checked) => 
                    setAiOptions(prev => ({ ...prev, phonetic: checked as boolean }))
                  }
                />
              </div>
              <Input
                id="phonetic"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/rɪˈsɪnd/"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pos">詞性</Label>
              <Checkbox
                checked={aiOptions.partOfSpeech}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, partOfSpeech: checked as boolean }))
                }
              />
            </div>
            <Input
              id="pos"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="noun, verb, adjective..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meaning-zh">中文釋義</Label>
            <Textarea
              id="meaning-zh"
              value={meaningZh}
              onChange={(e) => setMeaningZh(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meaning-en">英文定義</Label>
              <Checkbox
                checked={aiOptions.meaningEn}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, meaningEn: checked as boolean }))
                }
              />
            </div>
            <Textarea
              id="meaning-en"
              value={meaningEn}
              onChange={(e) => setMeaningEn(e.target.value)}
              rows={2}
              placeholder="to cancel or repeal officially"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>同義詞</Label>
              <Checkbox
                checked={aiOptions.synonyms}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, synonyms: checked as boolean }))
                }
              />
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {synonyms.map((syn, idx) => (
                <Badge key={idx} variant="secondary">
                  {syn}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setSynonyms(synonyms.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                placeholder="輸入同義詞後按 Enter"
                onKeyPress={(e) => e.key === "Enter" && addSynonym()}
              />
              <Button type="button" onClick={addSynonym}>新增</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>反義詞</Label>
              <Checkbox
                checked={aiOptions.antonyms}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, antonyms: checked as boolean }))
                }
              />
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {antonyms.map((ant, idx) => (
                <Badge key={idx} variant="secondary">
                  {ant}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setAntonyms(antonyms.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAntonym}
                onChange={(e) => setNewAntonym(e.target.value)}
                placeholder="輸入反義詞後按 Enter"
                onKeyPress={(e) => e.key === "Enter" && addAntonym()}
              />
              <Button type="button" onClick={addAntonym}>新增</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>例句</Label>
              <Checkbox
                checked={aiOptions.examples}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, examples: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-2 mb-2">
              {examples.map((ex, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                  <p className="flex-1 text-sm">{ex}</p>
                  <X
                    className="h-4 w-4 cursor-pointer mt-1"
                    onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="輸入例句"
                rows={2}
              />
              <Button type="button" onClick={addExample} className="self-end">新增</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">備註</Label>
              <Checkbox
                checked={aiOptions.notes}
                onCheckedChange={(checked) => 
                  setAiOptions(prev => ({ ...prev, notes: checked as boolean }))
                }
              />
            </div>
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
