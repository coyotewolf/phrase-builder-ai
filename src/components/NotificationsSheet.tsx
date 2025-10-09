import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, Notification } from "@/lib/db";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    try {
      const allNotifications = await db.getAllNotifications();
      setNotifications(allNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await db.markAllNotificationsAsRead();
      await loadNotifications();
      toast.success("所有通知已標記為已讀");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      toast.error("操作失敗");
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return diffMins === 0 ? "剛剛" : `${diffMins} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else {
      return `${diffDays} 天前`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">尚無通知</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read ? "bg-muted/30" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-primary rounded-full mt-1" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeAgo(notification.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="absolute bottom-6 left-6 right-6">
            <Button variant="outline" className="w-full" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              全部標記為已讀
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
