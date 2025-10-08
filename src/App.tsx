import React from "react";
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
import Settings from "./pages/Settings";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/review" element={<Review />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
