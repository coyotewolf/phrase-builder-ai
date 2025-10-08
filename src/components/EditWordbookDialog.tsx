import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wordbook } from "@/lib/db";

interface EditWordbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wordbook: Wordbook | null;
  onSave: (updates: Partial<Wordbook>) => void;
}

export function EditWordbookDialog({ open, onOpenChange, wordbook, onSave }: EditWordbookDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("不限制");

  useEffect(() => {
    if (wordbook) {
      setName(wordbook.name);
      setDescription(wordbook.description || "");
      setLevel(wordbook.level || "不限制");
    }
  }, [wordbook]);

  const handleSave = () => {
    onSave({
      name,
      description,
      level,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯單詞書</DialogTitle>
          <DialogDescription>
            修改單詞書的名稱、描述或程度設定
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">名稱</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">描述</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-level">程度</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="不限制">不限制</SelectItem>
                <SelectItem value="國小">國小</SelectItem>
                <SelectItem value="國中">國中</SelectItem>
                <SelectItem value="高中">高中</SelectItem>
                <SelectItem value="大學">大學</SelectItem>
                <SelectItem value="TOEFL">托福 (TOEFL)</SelectItem>
                <SelectItem value="IELTS">雅思 (IELTS)</SelectItem>
                <SelectItem value="TOEIC">多益 (TOEIC)</SelectItem>
                <SelectItem value="GRE">GRE</SelectItem>
                <SelectItem value="GMAT">GMAT</SelectItem>
                <SelectItem value="SAT">SAT</SelectItem>
                <SelectItem value="CEFR-A1">CEFR A1</SelectItem>
                <SelectItem value="CEFR-A2">CEFR A2</SelectItem>
                <SelectItem value="CEFR-B1">CEFR B1</SelectItem>
                <SelectItem value="CEFR-B2">CEFR B2</SelectItem>
                <SelectItem value="CEFR-C1">CEFR C1</SelectItem>
                <SelectItem value="CEFR-C2">CEFR C2</SelectItem>
              </SelectContent>
            </Select>
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
