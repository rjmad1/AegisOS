"use client";

import * as React from "react";
import { Terminal, X, Pin, History } from "lucide-react";
import { CommandRegistry } from "@/platform/commands/CommandRegistry";
import type { PlatformCommand } from "@/platform/commands/types";
import { Kbd } from "@/components/ui/Kbd";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/utils/cn";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PlatformCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const [pinned, setPinned] = React.useState<PlatformCommand[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setPinned(CommandRegistry.getPinnedCommands());
      setRecentIds(CommandRegistry.getRecentCommands());
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const list = CommandRegistry.search(query);
    setResults(list);
    setSelectedIndex(0);
  }, [query]);

  // Determine active commands list
  const activeCommands = React.useMemo(() => {
    if (query.trim()) {
      return results;
    }
    // Mix of pinned, recent, and general
    const all = CommandRegistry.getAllCommands();
    const seen = new Set<string>();
    const list: PlatformCommand[] = [];

    // Add pinned
    pinned.forEach((c) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    });

    // Add recent
    recentIds.forEach((id) => {
      const cmd = CommandRegistry.getCommand(id);
      if (cmd && !seen.has(cmd.id)) {
        seen.add(cmd.id);
        list.push(cmd);
      }
    });

    // Add others
    all.forEach((c) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    });

    return list;
  }, [query, results, pinned, recentIds]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, activeCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + activeCommands.length) % Math.max(1, activeCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeCommands[selectedIndex]) {
          handleExecute(activeCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeCommands, selectedIndex, onClose]);

  const handleExecute = async (cmd: PlatformCommand) => {
    onClose();
    await CommandRegistry.execute(cmd.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl glass-panel animate-in duration-100">
        {/* Command Input Header */}
        <div className="flex items-center border-b border-border/40 px-4 py-3">
          <Terminal className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command to execute..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="mr-2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <Kbd>ESC</Kbd>
        </div>

        {/* Results List */}
        <ScrollArea className="max-h-[300px]">
          {activeCommands.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            <div className="p-2 space-y-0.5 text-left">
              {activeCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                const isPin = pinned.some((p) => p.id === cmd.id);
                const isRec = recentIds.includes(cmd.id);

                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleExecute(cmd)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all text-left",
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-2.5">
                      {cmd.icon ? (
                        <cmd.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Terminal className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{cmd.title}</span>
                        {cmd.description && (
                          <span className={cn("text-[11px]", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            {cmd.description}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      {isPin && !query && (
                        <Pin className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60")} />
                      )}
                      {isRec && !isPin && !query && (
                        <History className={cn("h-3.5 w-3.5", isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60")} />
                      )}
                      {cmd.shortcut && (
                        <Kbd className={isSelected ? "border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground" : ""}>
                          {cmd.shortcut}
                        </Kbd>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
