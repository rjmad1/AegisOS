"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Activity, Heart, Shield, Clock, RefreshCw } from "lucide-react";
import type { RuntimeHealth, ProviderHealth } from "@/types/ai-runtime";

interface HealthDashboardProps {
  health: RuntimeHealth;
  onRefresh?: () => void;
  loading?: boolean;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ health, onRefresh, loading }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "unhealthy":
      case "unreachable":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "degraded":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "unhealthy":
      case "unreachable":
        return "bg-red-500/10 text-red-400 border-red-500/25";
      default:
        return "bg-secondary/30 text-muted-foreground border-border/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Aggregated Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Gateway Status</span>
            <h4 className="text-lg font-bold text-foreground mt-1">
              {health.providers.find(p => p.providerId.includes("litellm"))?.status || "unknown"}
            </h4>
          </div>
          {getStatusIcon(health.providers.find(p => p.providerId.includes("litellm"))?.status || "unknown")}
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Inference engine</span>
            <h4 className="text-lg font-bold text-foreground mt-1">
              {health.providers.find(p => p.providerId.includes("ollama"))?.status || "unknown"}
            </h4>
          </div>
          {getStatusIcon(health.providers.find(p => p.providerId.includes("ollama"))?.status || "unknown")}
        </div>

        <div className="p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Gateway Heartbeat</span>
            <h4 className="text-lg font-bold text-foreground mt-1">
              {health.providers.find(p => p.providerId.includes("litellm"))?.heartbeat ? "Active" : "Inactive"}
            </h4>
          </div>
          <Heart className={`h-5 w-5 ${health.providers.find(p => p.providerId.includes("litellm"))?.heartbeat ? "text-red-400 fill-red-400/20" : "text-muted-foreground"}`} />
        </div>
      </div>

      {/* Provider Details & Diagnostics Checks */}
      <div className="grid gap-6 md:grid-cols-2">
        {health.providers.map((prov) => (
          <div key={prov.providerId} className="p-5 rounded-xl border border-border/40 bg-card/30 text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border/20">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" /> {prov.providerName}
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono">{prov.providerId}</span>
              </div>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold capitalize ${getStatusBadgeClass(prov.status)}`}>
                {prov.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-2 rounded bg-secondary/10 border border-border/10">
                <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Latency</span>
                <span className="font-semibold text-foreground mt-1 block">{prov.latencyMs.toFixed(1)}ms</span>
              </div>
              <div className="p-2 rounded bg-secondary/10 border border-border/10">
                <span className="text-muted-foreground text-[10px]">Version</span>
                <span className="font-semibold text-foreground mt-1 block font-mono truncate">{prov.version}</span>
              </div>
            </div>

            {prov.errorMessage && (
              <div className="p-3 rounded-lg border border-red-500/25 bg-red-500/10 text-xs text-red-400">
                <span className="font-semibold block mb-0.5">Error State:</span>
                {prov.errorMessage}
              </div>
            )}

            {/* Diagnostic Assertions */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Diagnostic assertions</h4>
              {prov.checks && prov.checks.length > 0 ? (
                <div className="space-y-1.5">
                  {prov.checks.map((check, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/10">
                      <span className="text-foreground font-medium">{check.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{check.message}</span>
                        {check.status === "pass" ? (
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        ) : check.status === "warn" ? (
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No diagnostic assertions reported by provider.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Model Health / Loaded Matrix */}
      <div className="p-5 rounded-xl border border-border/40 bg-card/30 text-left">
        <h3 className="font-semibold text-foreground text-sm mb-4">Underlying Model Activation & Loaded States</h3>
        <div className="overflow-x-auto rounded-lg border border-border/20 bg-secondary/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/20 bg-secondary/20">
                <th className="p-3 font-semibold text-foreground">Model Identifier</th>
                <th className="p-3 font-semibold text-foreground text-center">Engine Provider</th>
                <th className="p-3 font-semibold text-foreground text-center">Status</th>
                <th className="p-3 font-semibold text-foreground text-center">Loaded in VRAM</th>
                <th className="p-3 font-semibold text-foreground text-right">Last Accessed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {health.models.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground italic">
                    No models currently tracked.
                  </td>
                </tr>
              ) : (
                health.models.map((model) => (
                  <tr key={model.modelId} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 font-mono text-foreground font-medium">{model.modelName}</td>
                    <td className="p-3 text-center text-muted-foreground capitalize">
                      {model.providerId.replace("-ai-runtime", "").replace("-provider", "")}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-medium capitalize ${getStatusBadgeClass(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {model.loaded ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">YES</span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground font-mono text-[9px]">IDLE</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-muted-foreground font-mono text-[10px]">
                      {model.lastAccessedAt ? new Date(model.lastAccessedAt).toLocaleTimeString() : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
