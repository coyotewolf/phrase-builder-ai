import React, { useState, useEffect } from "react"; // Add useState, useEffect
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Wordbooks from "./pages/Wordbooks";
import WordbookDetail from "./pages/WordbookDetail";
import WordbooksByLevel from "./pages/WordbooksByLevel";
import Statistics from "./pages/Statistics";
import TodayReviewed from "./pages/TodayReviewed";
import StreakHistory from "./pages/StreakHistory";
import AccuracyDetails from "./pages/AccuracyDetails";
import AllErrorCards from "./pages/AllErrorCards";
import Settings from "./pages/Settings";
import Review from "./pages/Review";
import About from "./pages/About";
import SRSIntroduction from "./pages/SRSIntroduction";
import NotFound from "./pages/NotFound";
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { onAuthStateChanged, getRedirectResult, User } from "firebase/auth"; // Import auth functions and User type
import { toast } from "sonner"; // Import toast for notifications
import { db, UserSettings as UserSettingsType } from "@/lib/db"; // Import db and UserSettingsType

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettingsType | null>(null);

  const loadUserSettings = async () => {
    try {
      const settings = await db.getUserSettings();
      setUserSettings(settings);
    } catch (error) {
      console.error("Failed to load user settings for auto backup:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("App.tsx: onAuthStateChanged triggered. currentUser:", currentUser); // Added log
      setUser(currentUser);
      if (currentUser) {
        loadUserSettings(); // Load settings when user logs in
        // User is signed in, save uid to IndexedDB
        db.updateUserSettings({ firebase_uid: currentUser.uid });
      } else {
        // User is signed out, clear uid from IndexedDB
        db.updateUserSettings({ firebase_uid: undefined });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && userSettings?.auto_backup_enabled && userSettings?.auto_backup_time) {
      const [backupHour, backupMinute] = userSettings.auto_backup_time.split(':').map(Number);

      const scheduleBackup = () => {
        const now = new Date();
        let nextBackupTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), backupHour, backupMinute, 0);

        // If the calculated backup time is in the past or exactly now, schedule it for tomorrow
        if (now.getTime() >= nextBackupTime.getTime()) {
          nextBackupTime.setDate(nextBackupTime.getDate() + 1);
        }

        const timeUntilBackup = nextBackupTime.getTime() - now.getTime();

        console.log(`Next auto backup scheduled for: ${nextBackupTime.toLocaleString()} (in ${timeUntilBackup / 1000 / 60} minutes)`);

        const timeoutId = setTimeout(async () => {
          const lastBackupDate = localStorage.getItem(`lastAutoBackupDate_${user.uid}`);
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

          if (!lastBackupDate || lastBackupDate !== today) {
            try {
              console.log("Performing daily auto backup...");
              await db.exportAllData(true); // true indicates auto backup
              localStorage.setItem(`lastAutoBackupDate_${user.uid}`, today);
              toast.success("每日自動備份成功！");
            } catch (error) {
              console.error("Daily auto backup failed:", error);
              toast.error("每日自動備份失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
            }
          } else {
            console.log("Auto backup already performed today, skipping.");
          }

          // Reschedule for the next day
          scheduleBackup();
        }, timeUntilBackup);

        return () => clearTimeout(timeoutId);
      };

      const cleanup = scheduleBackup();
      return cleanup;
    }
  }, [user, userSettings]); // Depend on user and userSettings


  useEffect(() => {
    if (user && userSettings?.auto_backup_enabled) {
      const checkAndPerformAutoBackup = async () => {
        const lastBackupDate = localStorage.getItem(`lastAutoBackupDate_${user.uid}`);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (!lastBackupDate || lastBackupDate !== today) {
          try {
            console.log("Performing daily auto backup...");
            await db.exportAllData(true); // true indicates auto backup
            localStorage.setItem(`lastAutoBackupDate_${user.uid}`, today);
            toast.success("每日自動備份成功！");
          } catch (error) {
            console.error("Daily auto backup failed:", error);
            toast.error("每日自動備份失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
          }
        }
      };

      // Run once on component mount and then every hour to check
      checkAndPerformAutoBackup();
      const intervalId = setInterval(checkAndPerformAutoBackup, 60 * 60 * 1000); // Check every hour

      return () => clearInterval(intervalId);
    }
  }, [user, userSettings]); // Depend on user and userSettings


  useEffect(() => {
    const handleRedirectResult = async () => {
      console.log("App.tsx: handleRedirectResult called.");
      try {
        const result = await getRedirectResult(auth);
        console.log("App.tsx: getRedirectResult result:", result);
        if (result) {
          // User successfully signed in via redirect
          const user = result.user;
          setUser(user);
          toast.success("Google 登入成功！");
          console.log("App.tsx: User signed in:", user);
          // Save user.uid to IndexedDB
          db.updateUserSettings({ firebase_uid: user.uid });
        } else {
          console.log("App.tsx: No redirect result found, clearing firebase_uid if any.");
          // No redirect result, ensure firebase_uid is cleared if user was previously logged in
          db.updateUserSettings({ firebase_uid: undefined });
        }

      } catch (error) {
        console.error("App.tsx: Google 登入重新導向失敗:", error);
        toast.error("Google 登入重新導向失敗：" + (error instanceof Error ? error.message : "未知錯誤"));
      }
    };
    handleRedirectResult();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wordbooks" element={<Wordbooks />} />
            <Route path="/wordbooks/:id" element={<WordbookDetail />} />
            <Route path="/wordbooks-by-level/:level" element={<WordbooksByLevel />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/statistics/today" element={<TodayReviewed />} />
            <Route path="/statistics/streak" element={<StreakHistory />} />
            <Route path="/statistics/accuracy" element={<AccuracyDetails />} />
            <Route path="/statistics/error-cards" element={<AllErrorCards />} />
            {/* Pass user prop to Settings component */}
            <Route path="/settings" element={<Settings user={user} />} />
            <Route path="/review" element={<Review />} />
            <Route path="/about" element={<About />} />
            <Route path="/srs-introduction" element={<SRSIntroduction />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
