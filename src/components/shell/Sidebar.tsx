"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { motion, AnimateSharedLayout } from "framer-motion";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { ModeSwitcher } from "./ModeSwitcher";

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { getNavigationGroups } = useNavigation();
  const groups = getNavigationGroups();

  return (
    <aside
      style={{ width: sidebarCollapsed ? "72px" : "240px" }}
      className="flex h-full flex-col border-r border-border/60 bg-card glass-panel text-card-foreground select-none relative z-20 transition-all duration-200"
      role="navigation"
      aria-label="Platform navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/10">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-extrabold tracking-wider uppercase text-foreground truncate">
              AI Ops Console
            </span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 space-y-6 p-3 overflow-y-auto custom-scrollbar">
        {groups.map((group) => {
          // If no items, don't show group
          if (group.items.filter(i => !i.hidden).length === 0) return null;

          return (
            <div key={group.id} className="space-y-1 relative">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest select-none">
                  {group.label}
                </div>
              )}
              
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  if (item.hidden) return null;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "relative flex w-full items-center rounded-md p-2 text-sm font-medium transition-colors duration-200 group text-left cursor-pointer",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute inset-0 bg-primary/10 rounded-md -z-10 border border-primary/20"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      
                      {Icon && (
                        <div className="flex-shrink-0 z-10">
                          <Icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground/80")} />
                        </div>
                      )}
                      
                      {!sidebarCollapsed && (
                        <span className="ml-3 truncate z-10">{item.label}</span>
                      )}
                      
                      {item.badge !== undefined && item.badge !== null && item.badge !== "" && !sidebarCollapsed && (
                        <Badge variant="secondary" className="ml-auto z-10 text-[9px] font-extrabold px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                      
                      {/* Collapsed Tooltip */}
                      {sidebarCollapsed && (
                        <div className="absolute left-16 z-30 hidden rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg group-hover:block whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adaptive Mode Switcher */}
      {!sidebarCollapsed && (
        <div className="border-t border-border/20 pt-2 pb-2">
          <ModeSwitcher />
        </div>
      )}

      {/* Collapse/Expand Sidebar Toggle */}
      <div className="border-t border-border/20 p-2">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

      </div>
    </aside>
  );
};
