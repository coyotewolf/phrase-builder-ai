import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  // Placeholder notifications - in a real app, these would come from state/API
  const notifications = [
    {
      id: 1,
      title: "Time to review!",
      message: "You have 15 cards due for review today",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      title: "Daily goal reached!",
      message: "Congratulations! You've completed your daily goal of 100 words",
      time: "1 day ago",
      read: true,
    },
    {
      id: 3,
      title: "New wordbook created",
      message: "TOEFL Vocabulary has been added to your collection",
      time: "2 days ago",
      read: true,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
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
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="absolute bottom-6 left-6 right-6">
            <Button variant="outline" className="w-full">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
