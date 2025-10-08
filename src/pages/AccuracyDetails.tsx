import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Target, Award, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db, Wordbook } from "@/lib/db";

interface AccuracyData {
  period: string;
  accuracy: number;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
}

interface WordbookAccuracy {
  wordbook: Wordbook;
  accuracy: number;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
}

const AccuracyDetails = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"7days" | "30days" | "all">("7days");
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [dailyData, setDailyData] = useState<AccuracyData[]>([]);
  const [wordbookData, setWordbookData] = useState<WordbookAccuracy[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccuracyData();
  }, [activeTab]);

  const getStartDate = (period: typeof activeTab): Date | null => {
    if (period === "all") return null;
    
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const days = period === "7days" ? 7 : 30;
    date.setDate(date.getDate() - days);
    return date;
  };

  const loadAccuracyData = async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(activeTab);
      
      const allWordbooks = await db.getAllWordbooks();
      const dailyStats = new Map<string, { correct: number; wrong: number }>();
      const wordbookStats = new Map<string, { correct: number; wrong: number }>();
      
      let totalCorrectCount = 0;
      let totalWrongCount = 0;

      for (const wordbook of allWordbooks) {
        const cards = await db.getCardsByWordbook(wordbook.id);
        let wbCorrect = 0;
        let wbWrong = 0;

        for (const card of cards) {
          const stats = await db.getCardStats(card.id);
          
          if (stats) {
            // Filter by date if needed
            if (startDate && stats.last_reviewed_at) {
              const reviewDate = new Date(stats.last_reviewed_at);
              if (reviewDate < startDate) continue;
            }

            const correct = stats.right_count || 0;
            const wrong = stats.wrong_count || 0;

            totalCorrectCount += correct;
            totalWrongCount += wrong;
            wbCorrect += correct;
            wbWrong += wrong;

            // Group by day for daily chart
            if (stats.last_reviewed_at) {
              const reviewDate = new Date(stats.last_reviewed_at);
              reviewDate.setHours(0, 0, 0, 0);
              const dateKey = reviewDate.toISOString().split('T')[0];
              
              const dayStat = dailyStats.get(dateKey) || { correct: 0, wrong: 0 };
              dayStat.correct += correct;
              dayStat.wrong += wrong;
              dailyStats.set(dateKey, dayStat);
            }
          }
        }

        if (wbCorrect + wbWrong > 0) {
          wordbookStats.set(wordbook.id, { correct: wbCorrect, wrong: wbWrong });
        }
      }

      // Calculate overall accuracy
      const totalAttempts = totalCorrectCount + totalWrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrectCount / totalAttempts) * 100) : 0;
      setOverallAccuracy(accuracy);
      setTotalCorrect(totalCorrectCount);
      setTotalWrong(totalWrongCount);

      // Process daily data
      const days = activeTab === "7days" ? 7 : activeTab === "30days" ? 30 : 90;
      const dailyDataArray: AccuracyData[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        const stat = dailyStats.get(dateKey) || { correct: 0, wrong: 0 };
        const total = stat.correct + stat.wrong;
        const acc = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
        
        dailyDataArray.push({
          period: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
          accuracy: acc,
          totalAttempts: total,
          correctCount: stat.correct,
          wrongCount: stat.wrong
        });
      }
      setDailyData(dailyDataArray);

      // Process wordbook data
      const wordbookDataArray: WordbookAccuracy[] = allWordbooks
        .filter(wb => wordbookStats.has(wb.id))
        .map(wb => {
          const stat = wordbookStats.get(wb.id)!;
          const total = stat.correct + stat.wrong;
          const acc = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
          
          return {
            wordbook: wb,
            accuracy: acc,
            totalAttempts: total,
            correctCount: stat.correct,
            wrongCount: stat.wrong
          };
        })
        .sort((a, b) => b.accuracy - a.accuracy);
      
      setWordbookData(wordbookDataArray);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load accuracy data:", error);
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-success";
    if (accuracy >= 70) return "text-teal";
    if (accuracy >= 50) return "text-yellow";
    return "text-destructive";
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 90) return "bg-success";
    if (accuracy >= 70) return "bg-teal";
    if (accuracy >= 50) return "bg-yellow";
    return "bg-destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  const maxDailyAccuracy = Math.max(...dailyData.map(d => d.accuracy), 100);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/statistics")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">準確率詳情</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Time Range Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7days">7 天</TabsTrigger>
            <TabsTrigger value="30days">30 天</TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overall Stats */}
        <Card className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="p-4 bg-success/20 rounded-2xl w-fit mx-auto">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <p className={`text-5xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
              {overallAccuracy}%
            </p>
            <p className="text-muted-foreground">整體準確率</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-success">{totalCorrect}</p>
              <p className="text-xs text-muted-foreground">正確次數</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold text-destructive">{totalWrong}</p>
              <p className="text-xs text-muted-foreground">錯誤次數</p>
            </div>
          </div>
        </Card>

        {/* Performance Message */}
        <Card className={`p-6 ${
          overallAccuracy >= 90 ? "bg-gradient-to-r from-success/10 to-teal/10 border-success/20" :
          overallAccuracy >= 70 ? "bg-gradient-to-r from-teal/10 to-yellow/10 border-teal/20" :
          "bg-gradient-to-r from-yellow/10 to-destructive/10 border-yellow/20"
        }`}>
          <div className="flex items-start gap-3">
            <Award className={`h-6 w-6 flex-shrink-0 mt-1 ${getAccuracyColor(overallAccuracy)}`} />
            <div className="space-y-1">
              <h3 className="font-semibold">
                {overallAccuracy >= 90 && "表現優異！"}
                {overallAccuracy >= 70 && overallAccuracy < 90 && "表現良好！"}
                {overallAccuracy >= 50 && overallAccuracy < 70 && "繼續努力！"}
                {overallAccuracy < 50 && "需要加強！"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {overallAccuracy >= 90 && "你的準確率非常高，保持這個水準！"}
                {overallAccuracy >= 70 && overallAccuracy < 90 && "你的基礎很扎實，再接再厲！"}
                {overallAccuracy >= 50 && overallAccuracy < 70 && "多練習就能提高準確率"}
                {overallAccuracy < 50 && "建議複習錯誤的單字，加強記憶"}
              </p>
            </div>
          </div>
        </Card>

        {/* Daily Accuracy Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">每日準確率</h2>
          </div>

          <div className="space-y-2">
            {dailyData.map((day, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{day.period}</span>
                  <span className={`font-semibold ${getAccuracyColor(day.accuracy)}`}>
                    {day.accuracy}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getAccuracyBg(day.accuracy)} transition-all`}
                    style={{ width: `${(day.accuracy / maxDailyAccuracy) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Wordbook Accuracy */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h2 className="text-lg font-semibold">單詞書準確率</h2>
          </div>

          {wordbookData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">暫無數據</p>
          ) : (
            <div className="space-y-3">
              {wordbookData.map(({ wordbook, accuracy, totalAttempts, correctCount, wrongCount }) => (
                <Card
                  key={wordbook.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/wordbooks/${wordbook.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold">{wordbook.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {totalAttempts} 次練習 • {correctCount} 正確 / {wrongCount} 錯誤
                      </p>
                    </div>
                    <Badge className={getAccuracyColor(accuracy)}>
                      {accuracy}%
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AccuracyDetails;
