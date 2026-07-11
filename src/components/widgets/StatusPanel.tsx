"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Play } from "lucide-react";
import { cn } from "@/utils/cn";

export interface StatusItem {
  id: string;
  name: string;
  status: "online" | "warning" | "offline" | "starting";
  message?: string;
}

interface StatusPanelProps {
  items: StatusItem[];
  className?: string;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ items, className }) => {
  return (
    <div className={cn("space-y-3 w-full text-left", className)}>
      {items.map((item) => {
        return (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-lg border border-border/20 bg-accent/5 hover:bg-accent/10 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              {item.status === "online" && (
                <CheckCircle2 className="h-4.5 w-4.5 text-success" />
              )}
              {item.status === "warning" && (
                <AlertTriangle className="h-4.5 w-4.5 text-warning" />
              )}
              {item.status === "offline" && (
                <XCircle className="h-4.5 w-4.5 text-destructive" />
              )}
              {item.status === "starting" && (
                <Play className="h-4.5 w-4.5 text-info animate-pulse" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                {item.message && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">{item.message}</span>
                )}
              </div>
            </div>
            
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                item.status === "online" && "bg-success/15 text-success",
                item.status === "warning" && "bg-warning/15 text-warning",
                item.status === "offline" && "bg-destructive/15 text-destructive",
                item.status === "starting" && "bg-info/15 text-info"
              )}
            >
              {item.status}
            </span>
          </div>
        );
      })}
    </div>
  );
};
