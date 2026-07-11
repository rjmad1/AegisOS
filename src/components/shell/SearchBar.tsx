"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";

interface SearchBarProps {
  onClick: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-3 py-1.5 h-9 w-48 lg:w-64 rounded-lg border border-border/40 bg-accent/5 hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all text-left text-xs select-none"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">Search...</span>
      <div className="flex items-center space-x-0.5 shrink-0">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </div>
    </button>
  );
};
