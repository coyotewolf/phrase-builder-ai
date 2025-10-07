import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">設定</h1>
          <p className="text-muted-foreground">自訂你的學習體驗</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="daily-goal">每日目標（張）</Label>
            <Input
              id="daily-goal"
              type="number"
              defaultValue="20"
              min="1"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">AI 難度等級</Label>
            <Select defaultValue="TOEFL">
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CEFR-A1">CEFR A1</SelectItem>
                <SelectItem value="CEFR-A2">CEFR A2</SelectItem>
                <SelectItem value="CEFR-B1">CEFR B1</SelectItem>
                <SelectItem value="CEFR-B2">CEFR B2</SelectItem>
                <SelectItem value="CEFR-C1">CEFR C1</SelectItem>
                <SelectItem value="CEFR-C2">CEFR C2</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="GRE">GRE</SelectItem>
                <SelectItem value="SAT">SAT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction">複習方向</Label>
            <Select defaultValue="en_to_zh">
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_to_zh">英文 → 中文</SelectItem>
                <SelectItem value="zh_to_en">中文 → 英文</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>僅在有到期項時提醒</Label>
              <p className="text-sm text-muted-foreground">
                只在有單字需要複習時發送通知
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>拼字容錯</Label>
              <p className="text-sm text-muted-foreground">
                允許拼字時有一個字母的差異
              </p>
            </div>
            <Switch />
          </div>

          <Button className="w-full">儲存設定</Button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
