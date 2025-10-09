import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Brain, Calendar, TrendingUp, Target, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SRSIntroduction() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              間隔重複系統 (SRS)
            </h1>
            <p className="text-muted-foreground mt-1">
              基於科學的記憶強化學習法
            </p>
          </div>
        </div>

        {/* What is SRS */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            什麼是 SRS？
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            間隔重複系統（Spaced Repetition System）是一種科學的學習方法，利用<strong>記憶曲線理論</strong>來優化複習時間。
            當你即將忘記某個知識點時，系統會智慧地安排複習，幫助你將短期記憶轉化為長期記憶。
          </p>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm">
              💡 研究顯示，使用間隔重複學習法可以將記憶保留率提高 <strong>200%-500%</strong>，
              同時減少學習時間約 <strong>70%</strong>。
            </p>
          </div>
        </Card>

        {/* How it Works */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            運作原理
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">初次學習</h3>
                <p className="text-sm text-muted-foreground">
                  第一次看到單字時，系統會記錄你的學習狀態，並設定第一次複習時間（通常是1天後）。
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">動態調整間隔</h3>
                <p className="text-sm text-muted-foreground">
                  根據你的回答表現，系統會動態調整下次複習的間隔時間：
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>✅ <strong>答對</strong>：間隔時間增加（如：1天 → 3天 → 7天 → 15天 → 30天...）</li>
                  <li>❌ <strong>答錯</strong>：間隔重置，從短週期重新開始</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">精準推送</h3>
                <p className="text-sm text-muted-foreground">
                  系統會在最佳時機推送複習提醒，確保在你即將忘記之前強化記憶，最大化學習效率。
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Algorithm Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            SM-2 演算法
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Vocabulary Flow 採用經過驗證的 <strong>SM-2 演算法</strong>（SuperMemo 2），
            這是世界上使用最廣泛的間隔重複算法之一，被 Anki、SuperMemo 等知名學習軟體採用。
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary mb-2">E-Factor</div>
              <div className="text-sm text-muted-foreground">
                難易度係數，根據你的表現動態調整每個單字的複習難度
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary mb-2">Interval</div>
              <div className="text-sm text-muted-foreground">
                複習間隔，從1天開始，逐步延長至數月甚至數年
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary mb-2">Quality</div>
              <div className="text-sm text-muted-foreground">
                回憶品質評分，決定下次複習間隔的增長速度
              </div>
            </div>
          </div>
        </Card>

        {/* SRS vs Traditional */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            SRS 與傳統模式的差異
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">特點</th>
                  <th className="text-left py-3 px-4">
                    <Badge variant="default">SRS 模式</Badge>
                  </th>
                  <th className="text-left py-3 px-4">
                    <Badge variant="outline">傳統模式</Badge>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">複習時機</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    智慧推薦，最佳記憶時點
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    固定複習前一天內容
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">複習間隔</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    動態調整（1天→數月）
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    固定每天複習
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">學習效率</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    高效，專注於需要複習的內容
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    中等，可能重複已熟悉內容
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">長期記憶</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    極佳，基於科學記憶曲線
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    良好，但需要更多時間投入
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">適合對象</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    追求高效學習的使用者
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    喜歡固定複習節奏的使用者
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">使用建議</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>每天堅持：</strong>即使只有5-10分鐘，持續學習比偶爾長時間學習更有效
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>誠實作答：</strong>根據真實的記憶情況作答，不要猜測，這樣系統才能準確調整
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>控制新卡數量：</strong>建議每天學習10-20個新單字，避免負擔過重
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                ✓
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>優先複習到期卡片：</strong>確保在最佳時機強化記憶，不要拖延複習
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate("/settings")}>
            前往設定複習模式
          </Button>
        </div>
      </div>
    </div>
  );
}
