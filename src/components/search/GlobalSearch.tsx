"use client";

import * as React from "react";
import { Search, X, History, Sparkles } from "lucide-react";
import { SearchEngine } from "@/platform/search/SearchEngine";
import type { SearchResultGroup, SearchResult } from "@/platform/search/types";
import { Kbd } from "@/components/ui/Kbd";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/utils/cn";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recent, setRecent] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent searches
  React.useEffect(() => {
    if (isOpen) {
      setRecent(SearchEngine.getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle query change
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await SearchEngine.search(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    const flat: { result: SearchResult; category: string }[] = [];
    results.forEach((group) => {
      group.results.forEach((r) => {
        flat.push({ result: r, category: group.category });
      });
    });
    return flat;
  }, [results]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatResults.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex].result);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
      result.action();
    }
    // Update recent searches
    setRecent(SearchEngine.getRecentSearches());
    onClose();
  };

  const handleRecentClick = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  const handleClearRecent = () => {
    SearchEngine.clearRecentSearches();
    setRecent([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl glass-panel animate-in duration-100">
        {/* Search Input Header */}
        <div className="flex items-center border-b border-border/40 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files, logs, settings, and commands..."
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

        {/* Results Area */}
        <ScrollArea className="max-h-[350px]">
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
              Searching...
            </div>
          )}

          {!loading && !query && (
            <div className="p-4 space-y-4 text-left">
              {recent.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <span>Recent Searches</span>
                    <button onClick={handleClearRecent} className="hover:text-foreground">Clear</button>
                  </div>
                  <div className="space-y-1">
                    {recent.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentClick(q)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all"
                      >
                        <History className="h-4 w-4 mr-2.5 text-muted-foreground/60" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Sparkles className="h-5 w-5 mx-auto mb-2 text-muted-foreground/60" />
                  Type to start searching...
                </div>
              )}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2 space-y-3 text-left">
              {results.map((group) => (
                <div key={group.category}>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.results.map((r) => {
                      const flatIndex = flatResults.findIndex((f) => f.result.id === r.id);
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSelect(r)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all text-left",
                            isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent/50 text-foreground"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{r.title}</span>
                            {r.description && (
                              <span className={cn("text-xs mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                {r.description}
                              </span>
                            )}
                          </div>

                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
