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
import { Loader2, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { generateWordDetails } from "@/lib/gemini-api";
import { toast } from "sonner";

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
    id: "7000-basic",
    name: "高中7000單 - 基礎篇",
    description: "高中必背7000單字的基礎1000字",
    level: "高中",
    words: [
      "abandon", "ability", "able", "about", "above", "abroad", "absence", "absent", "absolute", "absolutely",
      "absorb", "abstract", "absurd", "abuse", "academic", "accept", "access", "accident", "accompany", "accomplish",
      "according", "account", "accurate", "accuse", "achieve", "acid", "acknowledge", "acquire", "across", "act",
      "action", "active", "activity", "actor", "actual", "actually", "adapt", "add", "addition", "address",
      "adequate", "adjust", "administration", "admire", "admit", "adopt", "adult", "advance", "advanced", "advantage",
      "adventure", "advertise", "advice", "advise", "advocate", "affair", "affect", "afford", "afraid", "after",
      "afternoon", "again", "against", "age", "agency", "agenda", "agent", "aggressive", "ago", "agree",
      "agreement", "agriculture", "ahead", "aid", "aim", "air", "aircraft", "airline", "airport", "alarm",
      "album", "alcohol", "alert", "alien", "alike", "alive", "all", "alliance", "allow", "ally",
      "almost", "alone", "along", "aloud", "alphabet", "already", "also", "alter", "alternative", "although",
      "altogether", "always", "amazing", "ambition", "ambulance", "among", "amount", "amuse", "analysis", "analyze"
    ]
  },
  {
    id: "toefl-3000",
    name: "托福關鍵3000單字",
    description: "托福考試高頻核心詞彙精選",
    level: "TOEFL",
    words: [
      "abstract", "academic", "accelerate", "access", "accommodate", "accomplish", "accumulate", "accurate", "achieve", "acknowledge",
      "acquire", "adapt", "adequate", "adjacent", "adjust", "administration", "advocate", "aesthetic", "affect", "aggregate",
      "agriculture", "allocate", "alter", "alternative", "ambiguous", "analogous", "analyze", "annual", "anticipate", "apparent",
      "append", "appreciate", "approach", "appropriate", "approximate", "arbitrary", "area", "aspect", "assemble", "assess",
      "assign", "assist", "assume", "assure", "attach", "attain", "attitude", "attribute", "author", "authority",
      "automate", "available", "aware", "benefit", "bias", "bond", "brief", "bulk", "capable", "capacity",
      "category", "cease", "challenge", "channel", "chapter", "chart", "chemical", "circumstance", "cite", "civil",
      "clarify", "classic", "clause", "code", "coherent", "coincide", "collapse", "colleague", "commission", "commit",
      "commodity", "communicate", "community", "compatible", "compensate", "compile", "complement", "complex", "component", "compound",
      "comprehensive", "comprise", "compute", "conceive", "concentrate", "concept", "conclude", "concurrent", "conduct", "confer"
    ]
  },
  {
    id: "gre-3000",
    name: "GRE核心3000單字",
    description: "GRE考試必備高階詞彙",
    level: "GRE",
    words: [
      "abate", "aberrant", "abeyance", "abscond", "abstemious", "admonish", "adulterate", "aesthetic", "aggregate", "alacrity",
      "alleviate", "amalgamate", "ambiguous", "ambivalent", "ameliorate", "amenable", "anachronism", "analogous", "anarchy", "anomalous",
      "antipathy", "apathy", "appease", "approbation", "appropriate", "arcane", "archaic", "arduous", "artless", "ascetic",
      "assuage", "attenuate", "audacious", "austere", "autonomous", "aver", "banal", "belie", "beneficent", "bolster",
      "bombastic", "boorish", "burgeon", "burnish", "buttress", "capricious", "castigation", "catalyst", "caustic", "censure",
      "chasten", "chicanery", "coagulate", "coda", "cogent", "commensurate", "compendium", "complaisant", "conciliatory", "condone",
      "confound", "connoisseur", "contentious", "contrite", "conundrum", "conventional", "convoluted", "copious", "corroborate", "cosmopolitan",
      "covet", "craft", "craven", "credulous", "cryptic", "culpable", "cynicism", "daunt", "decorum", "default",
      "deference", "deflect", "deft", "delineate", "demur", "denigrate", "deride", "derivative", "desiccate", "desultory",
      "deterrent", "detraction", "devoid", "diatribe", "dichotomy", "diffident", "diffuse", "digression", "dilettante", "discerning"
    ]
  }
];

export function GenerateWordbookDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateWordbookDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_WORDBOOKS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleGenerate = async () => {
    const preset = PRESET_WORDBOOKS.find(p => p.id === selectedPreset);
    if (!preset) return;

    // Check API key
    const settings = await db.getUserSettings();
    if (!settings.gemini_api_key) {
      toast.error("請先在設定中設置 Gemini API 金鑰");
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: preset.words.length });

    try {
      // Create wordbook
      const wordbook = await db.createWordbook({
        name: preset.name,
        description: preset.description,
        level: preset.level,
      });

      // Generate cards in batches of 10
      const batchSize = 10;
      let successCount = 0;
      
      for (let i = 0; i < preset.words.length; i += batchSize) {
        const batch = preset.words.slice(i, i + batchSize);
        
        try {
          const wordDetails = await generateWordDetails(
            {
              words: batch,
              level: preset.level,
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

          setProgress({ current: Math.min(i + batchSize, preset.words.length), total: preset.words.length });
        } catch (error) {
          console.error(`Failed to generate batch starting at ${i}:`, error);
          // Continue with next batch even if one fails
        }
      }

      toast.success(`成功生成 ${successCount} 個單字卡！`);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 生成常用單詞書
          </DialogTitle>
          <DialogDescription>
            選擇一個預設單詞書，AI 將自動生成完整的單字卡內容（包含釋義、例句、同反義詞等）
          </DialogDescription>
        </DialogHeader>

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
              此過程可能需要數分鐘，請耐心等待
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
