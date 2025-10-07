import { Card } from "@/components/ui/card";
import { TrendingUp, Target, Flame } from "lucide-react";

const Statistics = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">學習統計</h1>
          <p className="text-muted-foreground">追蹤你的學習進度</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今日完成</p>
                <p className="text-2xl font-bold">8 / 20</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">7天平均</p>
                <p className="text-2xl font-bold">85%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Flame className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">連續天數</p>
                <p className="text-2xl font-bold">5 天</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">常錯單字</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">rescind</p>
                <p className="text-sm text-muted-foreground">撤銷；廢除</p>
              </div>
              <span className="text-sm text-destructive">錯誤率: 65%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
