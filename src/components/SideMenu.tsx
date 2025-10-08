import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, BarChart3, Settings, Github, Info } from "lucide-react";

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SideMenu({ open, onOpenChange }: SideMenuProps) {
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "首頁", path: "/" },
    { icon: BookOpen, label: "單詞書", path: "/wordbooks" },
    { icon: BarChart3, label: "統計", path: "/statistics" },
    { icon: Settings, label: "設定", path: "/settings" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Vocabulary Flow</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className="w-full justify-start text-base"
              onClick={() => handleNavigate(item.path)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>
        <div className="absolute bottom-8 left-6 right-6 space-y-4">
          <div className="border-t pt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => window.open("https://github.com", "_blank")}
            >
              <Github className="h-4 w-4 mr-3" />
              GitHub 專案
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleNavigate("/about")}
            >
              <Info className="h-4 w-4 mr-3" />
              關於
            </Button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            版本 1.0.0
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
