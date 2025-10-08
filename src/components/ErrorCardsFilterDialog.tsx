import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface ErrorCardsFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterMode = "top-n" | "min-errors" | "min-error-rate";

export const ErrorCardsFilterDialog = ({ open, onOpenChange }: ErrorCardsFilterDialogProps) => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<FilterMode>("top-n");
  const [topN, setTopN] = useState(20);
  const [minErrors, setMinErrors] = useState(3);
  const [minErrorRate, setMinErrorRate] = useState(30);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>選擇複習方式</DialogTitle>
          <DialogDescription>
            選擇要複習的錯誤單字篩選條件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
            {/* Top N most error cards */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="top-n" id="top-n" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="top-n" className="cursor-pointer">
                  前 N 個最常錯的單字
                </Label>
                {filterMode === "top-n" && (
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="w-32"
                  />
                )}
              </div>
            </div>

            {/* Minimum error count */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="min-errors" id="min-errors" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="min-errors" className="cursor-pointer">
                  錯誤次數大於等於 N 次
                </Label>
                {filterMode === "min-errors" && (
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={minErrors}
                    onChange={(e) => setMinErrors(Number(e.target.value))}
                    className="w-32"
                  />
                )}
              </div>
            </div>

            {/* Minimum error rate */}
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="min-error-rate" id="min-error-rate" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="min-error-rate" className="cursor-pointer">
                  錯誤率大於等於 N%
                </Label>
                {filterMode === "min-error-rate" && (
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={minErrorRate}
                    onChange={(e) => setMinErrorRate(Number(e.target.value))}
                    className="w-32"
                  />
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3">
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
