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

    if (!file.name.endsWith(".csv")) {
      toast.error("請選擇 CSV 文件");
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("CSV 文件為空");
        return;
      }

      // Create a new wordbook for this import
      const wordbookName = file.name.replace(".csv", "");
      const wordbook = await db.createWordbook({
        name: wordbookName,
        description: `Imported from ${file.name}`,
      });

      let successCount = 0;
      for (const row of rows) {
        try {
          const rowAny = row as any; // Allow dynamic access for flexible CSV columns
          await db.createCard({
            wordbook_id: wordbook.id,
            headword: row.headword || rowAny.word || "",
            phonetic: rowAny.phonetic || rowAny.pronunciation || row.ipa || "",
            part_of_speech: row.part_of_speech || rowAny.pos || "",
            meaning_zh: row.meaning_zh || rowAny.chinese || rowAny.translation || "",
            meaning_en: row.meaning_en || rowAny.english || rowAny.definition || "",
            notes: row.notes || "",
            star: false,
            tags: [],
          });
          successCount++;
        } catch (error) {
          console.error("Failed to import card:", row, error);
        }
      }

      toast.success(`成功導入 ${successCount} 張卡片到 "${wordbookName}"`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("導入失敗，請檢查文件格式");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Wordbooks</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new wordbook with cards
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>CSV File Format</Label>
            <p className="text-xs text-muted-foreground">
              Required columns: headword (or word), meaning_zh or meaning_en
              <br />
              Optional: phonetic, part_of_speech, notes
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
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
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
