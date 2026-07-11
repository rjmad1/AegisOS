"use client";

import * as React from "react";
import { usePlatform } from "@/hooks/usePlatform";

export const StatusBar: React.FC = () => {
  const PlatformKernel = usePlatform();
  const [health, setHealth] = React.useState(() => PlatformKernel.getHealth());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setHealth(PlatformKernel.getHealth());
    }, 5000);
    return () => clearInterval(timer);
  }, [PlatformKernel]);

  return (
    <footer className="flex h-10 w-full shrink-0 items-center justify-between border-t border-border/60 bg-card/30 px-6 text-xs text-muted-foreground z-10 glass-panel select-none">
      <div className="flex items-center space-x-2">
        <span>System:</span>
        <span className="font-semibold text-foreground">Personal AI Workstation</span>
        <span className="text-[10px] text-muted-foreground/60">(Ryzen 9 9950X3D + RTX 5080)</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Kernel:</span>
          <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">{health.status}</span>
        </div>
        <div>
          <span>Uptime:</span>
          <span className="font-semibold text-foreground ml-1">
            {Math.floor(health.uptime / 1000 / 60)}m
          </span>
        </div>
        <div>
          <span>Ops Console</span>
          <span className="font-semibold text-primary ml-1">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};
