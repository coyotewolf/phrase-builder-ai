import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, UserSettings as UserSettingsType } from "@/lib/db"; // Import db and UserSettingsType
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Minus, Plus, TrendingUp, Repeat, Percent } from "lucide-react";

interface ErrorCardsFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterMode = "top-n" | "min-errors" | "min-error-rate";

export const ErrorCardsFilterDialog = ({ open, onOpenChange }: ErrorCardsFilterDialogProps) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userSettings = await db.getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error("Failed to load error card filter settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettingsType>) => {
    if (!settings) return;
    try {
      const newSettings = await db.updateUserSettings(updates);
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to update error card filter settings:", error);
    }
  };

  if (isLoading || !settings) {
    return null; // Or a loading spinner
  }

  const filterMode = settings.errorCardsFilterMode || "top-n";
  const topN = settings.errorCardsTopN || 20;
  const minErrors = settings.errorCardsMinErrors || 3;
  const minErrorRate = settings.errorCardsMinErrorRate || 50;

  const handleStartReview = () => {
    let params = `mode=frequent-errors&filter=${filterMode}`;
    
    switch (filterMode) {
      case "top-n":
        params += `&topN=${topN}`;
        break;
      case "min-errors":
        params += `&minErrors=${minErrors}`;
        break;
      case "min-error-rate":
        params += `&minErrorRate=${minErrorRate}`;
        break;
    }
    
    onOpenChange(false);
    navigate(`/review?${params}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>選擇複習方式</DialogTitle>
          <DialogDescription>
            選擇要複習的錯誤單字篩選條件
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Top N most error cards */}
          <Card
            className={`cursor-pointer ${filterMode === "top-n" ? "border-primary ring-2 ring-primary" : ""}`}
            onClick={() => updateSettings({ errorCardsFilterMode: "top-n" })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">前 N 個最常錯的單字</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">複習錯誤次數最多的單字</CardDescription>
              {filterMode === "top-n" && (
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ errorCardsTopN: Math.max(1, topN - 5) });
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={topN}
                    onChange={(e) => updateSettings({ errorCardsTopN: Number(e.target.value) })}
                    className="w-24 text-center"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ errorCardsTopN: Math.min(100, topN + 5) });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minimum error count */}
          <Card
            className={`cursor-pointer ${filterMode === "min-errors" ? "border-primary ring-2 ring-primary" : ""}`}
            onClick={() => updateSettings({ errorCardsFilterMode: "min-errors" })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">錯誤次數大於等於 N 次</CardTitle>
              <Repeat className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">複習錯誤次數達到指定門檻的單字</CardDescription>
              {filterMode === "min-errors" && (
                <div className="flex items-center space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ errorCardsMinErrors: Math.max(1, minErrors - 1) });
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={minErrors}
                    onChange={(e) => updateSettings({ errorCardsMinErrors: Number(e.target.value) })}
                    className="w-24 text-center"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ errorCardsMinErrors: Math.min(50, minErrors + 1) });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minimum error rate */}
          <Card
            className={`cursor-pointer ${filterMode === "min-error-rate" ? "border-primary ring-2 ring-primary" : ""}`}
            onClick={() => updateSettings({ errorCardsFilterMode: "min-error-rate" })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">錯誤率大於等於 N%</CardTitle>
              <Percent className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-2">複習錯誤率達到指定門檻的單字</CardDescription>
              {filterMode === "min-error-rate" && (
                <div className="flex items-center space-x-2 mt-2">
                  <Slider
                    value={[minErrorRate]}
                    onValueChange={(value) => updateSettings({ errorCardsMinErrorRate: value[0] })}
                    min={1}
                    max={100}
                    step={5}
                    className="w-[150px]"
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  />
                  <span className="ml-2 text-sm font-medium">{minErrorRate}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleStartReview}>
            開始複習
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
