import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Star, Shuffle, Calendar } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data
  const dueCount = 12;
  const todayCompleted = 8;
  const dailyGoal = 20;
  const progressPercentage = (todayCompleted / dailyGoal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Vocabulary Flow
          </h1>
          <p className="text-muted-foreground">記住每個單字，流暢學習</p>
        </div>

        {/* Today's Progress */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                今日進度
              </h2>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {todayCompleted} / {dailyGoal}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>完成率</span>
                <span>{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Due Cards Alert */}
        {dueCount > 0 && (
          <Card className="p-6 border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">今日待複習</h3>
                <p className="text-sm text-muted-foreground">
                  有 {dueCount} 張卡片等待複習
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => navigate("/review?mode=due")}
              >
                開始複習
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-secondary/20"
            onClick={() => navigate("/review?mode=frequent-errors")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">高頻常錯</h3>
                  <p className="text-sm text-muted-foreground">複習最容易錯的單字</p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-accent/20"
            onClick={() => navigate("/review?mode=new")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">新學單字</h3>
                  <p className="text-sm text-muted-foreground">學習尚未掌握的單字</p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-primary/20"
            onClick={() => navigate("/review?mode=starred")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold">收藏單字</h3>
                  <p className="text-sm text-muted-foreground">複習已收藏的單字</p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-card to-success/20"
            onClick={() => navigate("/review?mode=mixed")}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Shuffle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">混合模式</h3>
                  <p className="text-sm text-muted-foreground">綜合各種單字類型</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/wordbooks")}
          >
            單詞書管理
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/statistics")}
          >
            學習統計
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/settings")}
          >
            設定
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
