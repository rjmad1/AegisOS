"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { NotificationCenter } from "./NotificationCenter";
import { GlobalSearch } from "../search/GlobalSearch";
import { CommandPalette } from "../command-palette/CommandPalette";
import { VoiceFeedbackButton } from "./VoiceFeedbackButton";
import { OperationalCopilot } from "./OperationalCopilot";
import { Brain } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useAppStore();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);

  // Sync theme class on body
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "high-contrast" | null;
    const activeTheme = savedTheme || "dark";
    setTheme(activeTheme);
    document.documentElement.className = activeTheme;
  }, [setTheme]);

  // Global hotkeys listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> Search
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      
      // Ctrl+Shift+P -> Command Palette
      if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }

      // Ctrl+Shift+O -> SRE Copilot
      if (e.ctrlKey && e.shiftKey && (e.key === "O" || e.key === "o")) {
        e.preventDefault();
        setCopilotOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
      {/* Dynamic Module Sidebar */}
      <Sidebar />

      {/* Viewport Frame */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Dynamic Header */}
        <Header
          onSearchOpen={() => setSearchOpen(true)}
          onCommandOpen={() => setCommandOpen(true)}
          onNotifOpen={() => setNotifOpen(true)}
        />

        {/* Dynamic Page Target Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>

        {/* Diagnostic Footer */}
        <StatusBar />
      </div>

      {/* Global Search Interface */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Global Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Operational Logs Center */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Floating Voice Feedback Button */}
      <VoiceFeedbackButton />

      {/* Floating SRE Copilot Toggle Button */}
      <button
        onClick={() => setCopilotOpen((prev) => !prev)}
        className="fixed bottom-20 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-650 text-white shadow-lg border border-indigo-500 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all duration-200"
        title="Toggle SRE Copilot (Ctrl+Shift+O)"
      >
        <Brain className="h-6 w-6" />
      </button>

      {/* Operational Copilot Right Side Drawer */}
      <OperationalCopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}
