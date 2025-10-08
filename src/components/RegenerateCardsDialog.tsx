import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RegenerateCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  level: string;
  cardCount: number;
}

export function RegenerateCardsDialog({
  open,
  onOpenChange,
  onConfirm,
  level,
  cardCount,
}: RegenerateCardsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>重新生成所有單字卡？</AlertDialogTitle>
          <AlertDialogDescription>
            單詞書程度已變更為 <strong>{level}</strong>。
            <br />
            <br />
            是否要根據新程度重新生成此本內所有 {cardCount} 張單字卡的 AI 內容（同義詞、反義詞、例句等）？
            <br />
            <br />
            <span className="text-muted-foreground text-sm">
              此操作可能需要一些時間，請耐心等待。
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            確認重新生成
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
