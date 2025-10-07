import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Wordbooks = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">單詞書</h1>
            <p className="text-muted-foreground">管理你的單詞集合</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            新增單詞書
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold mb-2">示例單詞書</h3>
            <p className="text-sm text-muted-foreground mb-4">
              這是一個示例單詞書
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">50 張卡片</span>
              <span className="text-muted-foreground">5 張到期</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wordbooks;
