import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import '@/lib/firebase'; // Import Firebase to ensure it's initialized

createRoot(document.getElementById("root")!).render(<App />);
