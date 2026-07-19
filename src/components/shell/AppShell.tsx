"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { NotificationCenter } from "./NotificationCenter";
import { GlobalSearch } from "../search/GlobalSearch";
import { CommandPalette } from "../command-palette/CommandPalette";
import { VoiceFeedbackButton } from "./VoiceFeedbackButton";
import { OperationalCopilot } from "./OperationalCopilot";
import { HitlApprovalModal } from "./HitlApprovalModal";
import { Brain, Keyboard, X } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useAppStore();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // Sync theme class on body
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "high-contrast" | null;
    const activeTheme = savedTheme || "dark";
    setTheme(activeTheme);
    document.documentElement.className = activeTheme;
  }, [setTheme]);

  // Global hotkeys listener
  React.useEffect(() => {
    let lastKey = "";
    let lastKeyTimeout: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering shortcuts inside input components
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.contentEditable === "true"
      );
      if (isInput) return;

      // Ctrl+K -> Command Palette (Universal Search)
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
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

      // ? -> Shortcuts Modal
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }

      // g + d / g + m / g + a / g + e
      if (e.key === "g") {
        lastKey = "g";
        if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
        lastKeyTimeout = setTimeout(() => {
          lastKey = "";
        }, 1000);
      } else if (lastKey === "g") {
        if (e.key === "d") {
          e.preventDefault();
          router.push("/dashboard");
        } else if (e.key === "m") {
          e.preventDefault();
          router.push("/mission-control");
        } else if (e.key === "a") {
          e.preventDefault();
          router.push("/activity");
        } else if (e.key === "e") {
          e.preventDefault();
          router.push("/executions");
        }
        lastKey = "";
        if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (lastKeyTimeout) clearTimeout(lastKeyTimeout);
    };
  }, [router]);

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
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>

        {/* Diagnostic Footer */}
        <StatusBar />
      </div>

      {/* Global Command Palette (Universal Search) */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Operational Logs Center */}
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Floating Voice Feedback Button */}
      <VoiceFeedbackButton />

      {/* Floating SRE Copilot Toggle Button */}
      <button
        onClick={() => setCopilotOpen((prev) => !prev)}
        className="fixed bottom-20 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-650 text-white shadow-lg border border-indigo-500 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Toggle SRE Copilot (Ctrl+Shift+O)"
      >
        <Brain className="h-6 w-6" />
      </button>

      {/* Operational Copilot Right Side Drawer */}
      <OperationalCopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* HITL Policy Enforcement Blocking Modal */}
      <HitlApprovalModal />

      {/* Keyboard Shortcuts Cheat-sheet Modal */}
      <AnimatePresence>
        {shortcutsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 text-left font-mono"
            >
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center space-x-2">
                  <Keyboard className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setShortcutsOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Search / Find</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">Ctrl + K</kbd>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Command Palette</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">Ctrl + Shift + P</kbd>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>SRE Copilot Drawer</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">Ctrl + Shift + O</kbd>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Go to Dashboard</span>
                  <span className="space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">g</kbd>
                    <span className="text-[10px] text-zinc-500">then</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">d</kbd>
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Go to Missions</span>
                  <span className="space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">g</kbd>
                    <span className="text-[10px] text-zinc-500">then</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">m</kbd>
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Go to Activity / Timeline</span>
                  <span className="space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">g</kbd>
                    <span className="text-[10px] text-zinc-500">then</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">a</kbd>
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Go to Executions</span>
                  <span className="space-x-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">g</kbd>
                    <span className="text-[10px] text-zinc-500">then</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">e</kbd>
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span>Toggle Shortcuts Help</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400">?</kbd>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setShortcutsOpen(false)} className="text-[10px] h-8">
                  Dismiss
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
