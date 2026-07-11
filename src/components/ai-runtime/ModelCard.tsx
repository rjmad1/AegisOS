"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CapabilityBadge } from "./CapabilityBadge";
import { Cpu, HardDrive, Tag, Layers } from "lucide-react";
import type { AIModel } from "@/types/ai-runtime";

interface ModelCardProps {
  model: AIModel;
  onClick?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onClick }) => {
  const isRunning = model.status === "running";
  const statusVariant = isRunning ? "success" : model.status === "available" ? "secondary" : "destructive";
  const statusLabel = isRunning ? "Running" : model.status === "available" ? "Available" : model.status;

  const topCapabilities = model.capabilities
    .filter(c => c.supported && !["temperature", "top-p", "seed", "json-mode", "chat", "completion"].includes(c.name))
    .slice(0, 4);

  return (
    <Card
      glass
      className="border border-border/40 hover-glow cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      onClick={onClick}
    >
      <CardHeader className="pb-2 text-left">
        <div className="flex justify-between items-start">
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
            <Cpu className="h-4 w-4" />
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <CardTitle className="text-sm mt-3 font-mono truncate">{model.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-1">{model.family} • {model.providerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-2 border-t border-border/20 text-left">
        <div className="text-[10px] space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><HardDrive className="h-3 w-3" /> Size</span>
            <span className="font-semibold text-foreground">{model.sizeDisplay} ({model.parameters})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> Context</span>
            <span className="font-semibold text-foreground">{model.contextWindow.totalTokens.toLocaleString()} tokens</span>
          </div>
          {model.quantization.format !== "unknown" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantization</span>
              <span className="font-semibold text-foreground font-mono text-[9px]">{model.quantization.format}</span>
            </div>
          )}
          {model.aliases.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Aliases</span>
              <span className="font-semibold text-primary font-mono truncate max-w-[120px] text-[9px]">
                {model.aliases.join(", ")}
              </span>
            </div>
          )}
        </div>
        {topCapabilities.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {topCapabilities.map(cap => (
              <CapabilityBadge key={cap.name} capability={cap.name} compact />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelCard;
