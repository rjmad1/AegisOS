"use client";

import React from "react";
import { Activity, Cpu, Database, HardDrive, Server, Zap, RefreshCw, CheckCircle2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export const LiveWorkspaceHealth: React.FC = () => {
  const { health, fetchHealth, isIndexing } = useWorkspaceStore();

  React.useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-foreground text-sm">Live Workspace Health</h3>
        </div>
        <button
          onClick={() => fetchHealth()}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center space-x-1 border border-border/40 rounded px-2 py-1"
        >
          <RefreshCw className={`h-3 w-3 ${isIndexing ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Knowledge Freshness */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Freshness</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{health.knowledgeFreshness}%</p>
          <p className="text-[10px] text-emerald-400 font-mono">100% vector sync</p>
        </div>

        {/* Embedding Status */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Embeddings</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <p className="text-xl font-bold capitalize text-foreground">{health.embeddingStatus}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{health.embeddingQueueSize} in queue</p>
        </div>

        {/* Model Availability */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">AI Models</span>
            <Server className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{health.modelAvailability.activeModel}</p>
          <p className="text-[10px] text-sky-400 font-mono">{health.modelAvailability.latencyMs}ms latency</p>
        </div>

        {/* GPU Status */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">GPU VRAM</span>
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{health.gpuStatus.utilizationPct}%</p>
          <p className="text-[10px] text-purple-400 font-mono">{health.gpuStatus.vramUsedGb}GB / {health.gpuStatus.vramTotalGb}GB ({health.gpuStatus.tempC}°C)</p>
        </div>

        {/* Storage */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Storage</span>
            <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{health.storage.usedGb} GB</p>
          <p className="text-[10px] text-indigo-400 font-mono">Index: {health.storage.indexSizeMb} MB</p>
        </div>

        {/* Execution Queue */}
        <div className="rounded-lg border border-border/20 bg-background/50 p-3 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-medium uppercase tracking-wider">Exec Queue</span>
            <Database className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-foreground">{health.executionQueue.activeWorkers} Workers</p>
          <p className="text-[10px] text-emerald-400 font-mono">{health.executionQueue.throughputPerMin} ops/min</p>
        </div>
      </div>
    </div>
  );
};
