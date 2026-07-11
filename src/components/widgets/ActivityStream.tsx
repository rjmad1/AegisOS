"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type?: "info" | "success" | "warning" | "error";
}

interface ActivityStreamProps {
  items: ActivityItem[];
  className?: string;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({ items, className }) => {
  return (
    <div className={cn("relative border-l border-border/40 pl-4 ml-2 space-y-4 text-left w-full", className)}>
      {items.map((item) => {
        return (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
            <div
              className={cn(
                "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                item.type === "info" && "bg-info",
                item.type === "success" && "bg-success",
                item.type === "warning" && "bg-warning",
                item.type === "error" && "bg-destructive",
                !item.type && "bg-muted-foreground/60"
              )}
            />
            
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
              </div>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
