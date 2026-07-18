"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Bell, User, Power, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "@/hooks/useNavigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "./SearchBar";
import { CommandBar } from "./CommandBar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { PerspectiveSwitcher } from "./PerspectiveSwitcher";
import { cn } from "@/utils/cn";

interface HeaderProps {
  onSearchOpen: () => void;
  onCommandOpen: () => void;
  onNotifOpen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearchOpen,
  onCommandOpen,
  onNotifOpen,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useAppStore();
  const { getBreadcrumbs } = useNavigation();
  const { notifications } = useNotifications();
  const { user, logout } = useAuthStore();

  const [profileOpen, setProfileOpen] = React.useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border/60 bg-card/50 glass-panel px-6 relative z-10 select-none">
      {/* Left: Breadcrumbs & Status */}
      <div className="flex items-center space-x-4">
        {/* Status indicator */}
        <div className="flex items-center space-x-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold select-none">API: Live</span>
        </div>

        {/* Breadcrumb links */}
        <div className="hidden sm:flex items-center space-x-1.5 text-sm text-muted-foreground">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              <button
                onClick={() => !bc.isLast && router.push(bc.href)}
                disabled={bc.isLast}
                className={cn(
                  "transition-colors",
                  bc.isLast ? "text-foreground font-semibold cursor-default" : "hover:text-foreground"
                )}
              >
                {bc.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Quick actions, Theme, Profile */}
      <div className="flex items-center space-x-3">
        {/* Perspective Selector & Workspace layout switcher */}
        <div className="flex items-center space-x-2">
          <PerspectiveSwitcher />
          <WorkspaceSwitcher />
        </div>

        {/* Search trigger */}
        <SearchBar onClick={onSearchOpen} />

        {/* Command trigger */}
        <CommandBar onClick={onCommandOpen} />

        {/* Dark/Light theme toggler */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-lg"
          onClick={() => {
            const nextTheme = theme === "dark" ? "light" : theme === "light" ? "high-contrast" : "dark";
            setTheme(nextTheme);
            document.documentElement.className = nextTheme;
          }}
        >
          {theme === "dark" && <Sun className="h-5 w-5 text-amber-500" />}
          {theme === "light" && <Moon className="h-5 w-5 text-indigo-500" />}
          {theme === "high-contrast" && <Sun className="h-5 w-5 text-yellow-300" />}
        </Button>

        {/* Notifications Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-lg relative"
          onClick={onNotifOpen}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>

        {/* Profile Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 h-9 px-2.5 rounded-lg border border-border/20"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden md:inline-block text-xs font-semibold text-foreground">
              {user?.username || "Admin"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-1.5 w-48 rounded-lg border border-border bg-card p-1 shadow-lg z-40 glass-panel text-left"
                >
                  <div className="px-2.5 py-2 border-b border-border/20">
                    <p className="text-xs font-semibold text-foreground">Administrator</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      router.push("/login");
                    }}
                    className="flex w-full items-center px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors text-left"
                  >
                    <Power className="h-3.5 w-3.5 mr-2" />
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
