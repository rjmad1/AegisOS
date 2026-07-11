"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";

interface DockPanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  direction?: "left" | "right" | "top" | "bottom";
  className?: string;
}

export const DockPanel: React.FC<DockPanelProps> = ({
  title,
  children,
  collapsible = true,
  defaultCollapsed = false,
  direction = "left",
  className,
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const isHorizontal = direction === "left" || direction === "right";

  return (
    <div
      className={cn(
        "flex flex-col border-border/40 bg-card/65 transition-all duration-200",
        isHorizontal ? "h-full" : "w-full",
        direction === "left" && "border-r",
        direction === "right" && "border-l",
        direction === "top" && "border-b",
        direction === "bottom" && "border-t",
        collapsed
          ? isHorizontal
            ? "w-[48px] overflow-hidden"
            : "h-[40px] overflow-hidden"
          : isHorizontal
            ? "w-[300px]"
            : "h-[200px]",
        className
      )}
    >
      {/* Panel Header */}
      <div
        className={cn(
          "flex items-center justify-between p-2 bg-accent/15 border-b border-border/10 select-none",
          collapsed && isHorizontal ? "flex-col space-y-4 py-4" : "flex-row"
        )}
      >
        <span
          className={cn(
            "text-xs font-bold text-muted-foreground uppercase tracking-wider",
            collapsed && isHorizontal ? "[writing-mode:vertical-lr] rotate-180" : ""
          )}
        >
          {title}
        </span>
        
        {collapsible && (
          <button
            onClick={toggleCollapsed}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
          >
            {collapsed ? (
              direction === "left" ? <ChevronRight className="h-4 w-4" /> :
              direction === "right" ? <ChevronLeft className="h-4 w-4" /> :
              direction === "top" ? <ChevronDown className="h-4 w-4" /> :
              <ChevronUp className="h-4 w-4" />
            ) : (
              direction === "left" ? <ChevronLeft className="h-4 w-4" /> :
              direction === "right" ? <ChevronRight className="h-4 w-4" /> :
              direction === "top" ? <ChevronUp className="h-4 w-4" /> :
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Panel Content */}
      {!collapsed && (
        <div className="flex-1 min-w-0 min-h-0 overflow-auto">{children}</div>
      )}
    </div>
  );
};
