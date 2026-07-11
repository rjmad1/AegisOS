"use client";

import * as React from "react";
import { AlignLeft, Layers } from "lucide-react";
import type { AIModel } from "@/types/ai-runtime";

interface ContextWindowViewerProps {
  models: AIModel[];
}

export const ContextWindowViewer: React.FC<ContextWindowViewerProps> = ({ models }) => {
  const sortedModels = React.useMemo(() => {
    return [...models].sort((a, b) => b.contextWindow.totalTokens - a.contextWindow.totalTokens);
  }, [models]);

  const maxContext = React.useMemo(() => {
    if (sortedModels.length === 0) return 1;
    return Math.max(...sortedModels.map(m => m.contextWindow.totalTokens));
  }, [sortedModels]);

  return (
    <div className="space-y-4 text-left">
      <div className="p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Context Window Allocation Matrix</h3>
        </div>

        <div className="space-y-3.5">
          {sortedModels.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No models registered to visualize context.</p>
          ) : (
            sortedModels.map((model) => {
              const total = model.contextWindow.totalTokens;
              const input = model.contextWindow.inputTokens;
              const pct = (total / maxContext) * 100;

              return (
                <div key={model.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">{model.displayName}</span>
                    <span className="text-muted-foreground">
                      {total.toLocaleString()} tokens ({model.providerName})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-secondary/35 rounded-full overflow-hidden flex border border-border/10">
                    <div
                      style={{ width: `${Math.max(pct, 2)}%` }}
                      className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextWindowViewer;
