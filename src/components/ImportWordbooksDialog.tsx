import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { parseCSV } from "@/lib/csv";

interface ImportWordbooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportWordbooksDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: ImportWordbooksDialogProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJSON = file.name.endsWith(".json");
    const isCSV = file.name.endsWith(".csv");

    if (!isJSON && !isCSV) {
      toast.error("請選擇 JSON 或 CSV 文件");
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();

      if (isJSON) {
        // Handle JSON format (exported wordbook format)
        const data = JSON.parse(text);

        // Validate JSON structure
        if (!data.wordbooks || !Array.isArray(data.wordbooks)) {
          toast.error("無效的 JSON 格式：缺少 wordbooks 資料");
          return;
        }

        if (data.wordbooks.length === 0) {
          toast.error("JSON 文件中沒有單詞書資料");
          return;
        }

        const wordbook = data.wordbooks[0]; // Import the first wordbook
        const wordbookCards = data.cards?.filter((card: any) => card.wordbook_id === wordbook.id) || [];

        if (wordbookCards.length === 0) {
          toast.error("JSON 文件中沒有單字卡資料");
          return;
        }

        // Create the wordbook
        const newWordbook = await db.createWordbook({
          name: wordbook.name,
          description: wordbook.description || `從 ${file.name} 匯入`,
          level: wordbook.level,
        });

        // Import all cards
        let successCount = 0;
        for (const card of wordbookCards) {
          try {
            const newCard = await db.createCard({
              wordbook_id: newWordbook.id,
              headword: card.headword,
              phonetic: card.phonetic,
              meanings: card.meanings || [],
              notes: card.notes,
              star: card.star || false,
              tags: card.tags || [],
            });

            // Import card stats if available
            const cardStats = data.card_stats?.find((s: any) => s.card_id === card.id);
            if (cardStats) {
              await db.createOrUpdateCardStats(newCard.id, {
                shown_count: cardStats.shown_count || 0,
                right_count: cardStats.right_count || 0,
                wrong_count: cardStats.wrong_count || 0,
                last_reviewed_at: cardStats.last_reviewed_at,
              });
            }

            // Import SRS data if available
            const cardSRS = data.card_srs?.find((s: any) => s.card_id === card.id);
            if (cardSRS) {
              await db.createOrUpdateCardSRS(newCard.id, {
                ease: cardSRS.ease || 2.5,
                interval_days: cardSRS.interval_days || 0,
                repetitions: cardSRS.repetitions || 0,
                due_at: cardSRS.due_at,
              });
            }

            successCount++;
          } catch (error) {
            console.error("Failed to import card:", card, error);
          }
        }

        toast.success(`成功導入單詞書「${newWordbook.name}」，包含 ${successCount} 張卡片`);
      } else {
        // Handle CSV format
        const rows = parseCSV(text);

        if (rows.length === 0) {
          toast.error("CSV 文件為空");
          return;
        }

        // Create a new wordbook for this import
        const wordbookName = file.name.replace(".csv", "");
        const wordbook = await db.createWordbook({
          name: wordbookName,
          description: `從 ${file.name} 匯入`,
        });

        let successCount = 0;
        for (const row of rows) {
          try {
            const rowAny = row as any; // Allow dynamic access for flexible CSV columns
            await db.createCard({
              wordbook_id: wordbook.id,
              headword: row.headword || rowAny.word || "",
              phonetic: rowAny.phonetic || rowAny.pronunciation || row.ipa || "",
              meanings: [{
                part_of_speech: row.part_of_speech || rowAny.pos || "",
                meaning_zh: row.meaning_zh || rowAny.chinese || rowAny.translation || "",
                meaning_en: row.meaning_en || rowAny.english || rowAny.definition || "",
                synonyms: [],
                antonyms: [],
                examples: [],
              }],
              notes: row.notes || "",
              star: false,
              tags: [],
            });
            successCount++;
          } catch (error) {
            console.error("Failed to import card:", row, error);
          }
        }

        toast.success(`成功導入 ${successCount} 張卡片到「${wordbookName}」`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("導入失敗：" + (error instanceof Error ? error.message : "請檢查文件格式"));
    } finally {
      setIsImporting(false);
      event.target.value = ''; // Clear file input
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>匯入單詞書</DialogTitle>
          <DialogDescription>
            上傳 JSON 或 CSV 文件以匯入單詞書
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>支援的文件格式</Label>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>JSON 格式：</strong>從單詞書設定中匯出的完整備份檔案（包含學習記錄）</p>
              <p><strong>CSV 格式：</strong>簡單的單字列表</p>
              <p className="pt-1">必要欄位：headword (或 word), meaning_zh 或 meaning_en</p>
              <p>選填欄位：phonetic, part_of_speech, notes</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="import-file">選擇文件</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
