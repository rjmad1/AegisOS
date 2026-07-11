"use client";

import * as React from "react";
import { Terminal } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";

interface CommandBarProps {
  onClick: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center p-1.5 h-9 w-9 rounded-lg border border-border/40 bg-accent/5 hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all select-none relative group"
    >
      <Terminal className="h-4.5 w-4.5" />
      <div className="absolute top-11 right-0 z-30 hidden rounded-md bg-popover border border-border px-2.5 py-1.5 text-[10px] text-popover-foreground shadow-lg group-hover:flex items-center space-x-1.5 whitespace-nowrap">
        <span>Command Palette</span>
        <div className="flex items-center space-x-0.5">
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </div>
      </div>
    </button>
  );
};
