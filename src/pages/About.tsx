import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Brain, Calendar, ChartBar, Sparkles, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "智慧單詞管理",
      description: "創建多個單詞書，按主題、考試類型分類管理，支援 CSV 匯入和 AI 自動生成。"
    },
    {
      icon: Brain,
      title: "科學複習系統",
      description: "採用間隔重複 (SRS) 算法，根據記憶曲線智慧安排複習時間，提升學習效率。"
    },
    {
      icon: Calendar,
      title: "連續學習追蹤",
      description: "記錄每日學習進度，養成良好的學習習慣，保持連續學習記錄。"
    },
    {
      icon: ChartBar,
      title: "詳細學習統計",
      description: "追蹤學習進度、正確率、常錯單字，幫助你了解學習狀況，針對性加強。"
    },
    {
      icon: Sparkles,
      title: "AI 智能輔助",
      description: "使用 Gemini AI 自動生成單字詳細釋義、同義詞、例句等，提供完整的學習資料。"
    },
    {
      icon: Target,
      title: "個人化目標",
      description: "設定每日學習目標，系統會追蹤你的完成進度，激勵你持續前進。"
    }
  ];

  const tutorialSteps = [
    {
      title: "1. 創建單詞書",
      content: "點擊「單詞書」頁面的 + 按鈕，創建你的第一本單詞書。可以手動添加單字、匯入 CSV 檔案，或使用 AI 自動生成單詞書。"
    },
    {
      title: "2. 添加單字卡",
      content: "在單詞書詳情頁，點擊 + 按鈕添加單字卡。可以手動輸入或使用 AI 自動補齊音標、釋義、例句等資料。"
    },
    {
      title: "3. 開始學習",
      content: "點擊單詞書右上角的播放按鈕，選擇學習模式（隨機、順序、錯誤優先）開始學習。左滑表示記得，右滑表示不記得。"
    },
    {
      title: "4. 查看統計",
      content: "在「統計」頁面查看學習進度、正確率、連續天數等數據。點擊各項統計卡片可查看更詳細的資訊。"
    },
    {
      title: "5. 設定目標",
      content: "在「設定」頁面設置每日學習目標，啟用學習提醒，個人化你的學習體驗。"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">關於</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* App Info */}
        <Card className="p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Vocabulary Flow</h2>
            <p className="text-muted-foreground">智慧單字學習助手</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              版本 1.0.0
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vocabulary Flow 是一款專為語言學習者設計的單字記憶應用，
            結合科學的間隔重複演算法和 AI 智能輔助，
            幫助你更有效率地擴展詞彙量，輕鬆達成學習目標。
          </p>
        </Card>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">主要功能</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tutorial */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">快速入門教學</h2>
          </div>
          <div className="space-y-3">
            {tutorialSteps.map((step, index) => (
              <Card key={index} className="p-4 space-y-2">
                <h3 className="font-semibold text-primary">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.content}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tips */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">學習小技巧</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>每天固定時間學習，養成良好習慣</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>優先復習系統提示待複習的單字，效果最佳</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>長按單字卡可進入批量選擇模式，方便管理</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>定期查看統計頁面，了解學習狀況並調整策略</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>使用 AI 補齊功能可快速完善單字資料</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>記得定期匯出資料備份學習進度</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Support */}
        <Card className="p-6 text-center space-y-4">
          <h3 className="font-semibold">需要幫助？</h3>
          <p className="text-sm text-muted-foreground">
            如果你在使用過程中遇到任何問題或有建議，
            歡迎透過 GitHub 專案頁面與我們聯繫。
          </p>
          <Button
            variant="outline"
            onClick={() => window.open("https://github.com", "_blank")}
          >
            訪問 GitHub 專案
          </Button>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Made with ❤️ for language learners</p>
          <p className="mt-1">© 2024 Vocabulary Flow. All rights reserved.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default About;
