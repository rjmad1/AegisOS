"use client";

import * as React from "react";
import { Check, X, Info, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { CapabilityName } from "@/types/ai-runtime";

interface CapabilityMatrixProps {
  matrix: {
    capabilities: CapabilityName[];
    models: {
      modelId: string;
      modelName: string;
      providerId: string;
      capabilities: Record<string, boolean>;
    }[];
  };
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ matrix }) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredModels = React.useMemo(() => {
    if (!searchTerm) return matrix.models;
    const term = searchTerm.toLowerCase();
    return matrix.models.filter(
      (m) =>
        m.modelName.toLowerCase().includes(term) ||
        m.providerId.toLowerCase().includes(term)
    );
  }, [matrix.models, searchTerm]);

  const capabilityLabels: Record<string, string> = {
    "tool-calling": "Tool Calling",
    "vision": "Vision",
    "reasoning": "Reasoning",
    "embeddings": "Embeddings",
    "streaming": "Streaming",
    "json-mode": "JSON Mode",
    "function-calling": "Function Calling",
    "parallel-tool-calls": "Parallel Tool Calls",
    "image-input": "Image Input",
    "audio-input": "Audio Input",
    "video-input": "Video Input",
    "temperature": "Temperature Support",
    "top-p": "Top-P Support",
    "seed": "Seed Support",
    "structured-output": "Structured Output",
    "chat": "Chat Mode",
    "completion": "Completion Mode",
    "code-generation": "Code Generation"
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter models in matrix..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/20 border border-border/40 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/30">
              <th className="p-4 font-semibold text-foreground min-w-[200px]">Model & Provider</th>
              {matrix.capabilities.map((cap) => (
                <th key={cap} className="p-4 font-semibold text-foreground text-center whitespace-nowrap text-xs">
                  {capabilityLabels[cap] || cap}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={matrix.capabilities.length + 1} className="p-8 text-center text-muted-foreground">
                  No matching models found.
                </td>
              </tr>
            ) : (
              filteredModels.map((model) => (
                <tr key={model.modelId} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-4 font-medium text-foreground">
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-sm truncate max-w-[250px]">{model.modelName}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {model.providerId.replace("-ai-runtime", "").replace("-provider", "")}
                      </span>
                    </div>
                  </td>
                  {matrix.capabilities.map((cap) => {
                    const supported = model.capabilities[cap];
                    return (
                      <td key={cap} className="p-4 text-center">
                        <div className="flex justify-center">
                          {supported ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-400/40">
                              <X className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          This capability matrix is automatically discovered from model metadata. Green indicators represent natively supported capabilities via Ollama or LiteLLM gateway abstractions.
        </p>
      </div>
    </div>
  );
};

export default CapabilityMatrix;
