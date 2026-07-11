"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";

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
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/20">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-extrabold tracking-wider uppercase bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent truncate">
              AI Ops Console
            </span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 space-y-4 p-2 overflow-y-auto custom-scrollbar">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!sidebarCollapsed && (
              <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">
                {group.label}
              </h4>
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
                      "flex w-full items-center rounded-lg p-2.5 text-sm font-semibold transition-all relative group text-left",
                      isActive
                        ? "text-primary bg-primary/10 border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground border border-transparent"
                    )}
                  >
                    {Icon && (
                      <div className="flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                    {!sidebarCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}
                    {item.badge !== undefined && item.badge !== null && item.badge !== "" && !sidebarCollapsed && (
                      <Badge variant="secondary" className="ml-auto text-[9px] font-extrabold px-1.5 py-0">
                        {item.badge}
                      </Badge>
                    )}
                    
                    {/* Collapsed Tooltip */}
                    {sidebarCollapsed && (
                      <div className="absolute left-16 z-30 hidden rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg group-hover:block whitespace-nowrap">
                        {item.label}
                      </div>
                    )}

                    {/* Active dot indicator */}
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse/Expand Sidebar Toggle */}
      <div className="border-t border-border/20 p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
};
