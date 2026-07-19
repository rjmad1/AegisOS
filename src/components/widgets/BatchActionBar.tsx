"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash, Play, Pause } from "lucide-react";

interface BatchActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAction: (action: string) => void;
}

export function BatchActionBar({ selectedCount, onClear, onAction }: BatchActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-4 bg-card border border-border shadow-2xl rounded-full px-6 py-3"
        >
          <div className="text-sm font-semibold flex items-center border-r border-border/50 pr-4">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center mr-2">
              {selectedCount}
            </span>
            Selected
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAction("start")}
              className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full transition-colors flex items-center space-x-1 text-sm"
            >
              <Play className="w-4 h-4" /> <span>Start</span>
            </button>
            <button
              onClick={() => onAction("pause")}
              className="p-2 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 rounded-full transition-colors flex items-center space-x-1 text-sm"
            >
              <Pause className="w-4 h-4" /> <span>Pause</span>
            </button>
            <button
              onClick={() => onAction("delete")}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors flex items-center space-x-1 text-sm"
            >
              <Trash className="w-4 h-4" /> <span>Delete</span>
            </button>
          </div>
          <div className="border-l border-border/50 pl-4">
            <button
              onClick={onClear}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
