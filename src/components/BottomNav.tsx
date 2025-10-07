import { Home, BookOpen, BarChart3, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Wordbooks", path: "/wordbooks" },
    { icon: BarChart3, label: "Statistics", path: "/statistics" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              isActive(path)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
