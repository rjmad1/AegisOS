"use client";

import * as React from "react";
import { Link2, Shield, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Endpoint } from "@/types/ai-runtime";

interface EndpointExplorerProps {
  endpoints: Endpoint[];
}

export const EndpointExplorer: React.FC<EndpointExplorerProps> = ({ endpoints }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold font-mono">
            <CheckCircle2 className="h-3 w-3" /> ACTIVE
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-semibold font-mono">
            <AlertCircle className="h-3 w-3" /> DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-semibold font-mono">
            <XCircle className="h-3 w-3" /> OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="overflow-x-auto rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-secondary/30">
              <th className="p-4 font-semibold text-foreground">Endpoint Connection</th>
              <th className="p-4 font-semibold text-foreground text-center">Protocol</th>
              <th className="p-4 font-semibold text-foreground text-center">Authentication</th>
              <th className="p-4 font-semibold text-foreground text-center">Latency</th>
              <th className="p-4 font-semibold text-foreground text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {endpoints.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                  No active connection endpoints found.
                </td>
              </tr>
            ) : (
              endpoints.map((ep) => (
                <tr key={ep.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Link2 className="h-4 w-4 text-primary" /> {ep.providerName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground mt-0.5 select-all">{ep.url}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-mono font-bold uppercase text-xs text-foreground bg-secondary/40 px-2 py-0.5 rounded border border-border/20">
                      {ep.protocol}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-foreground font-medium capitalize">
                      <Shield className="h-3.5 w-3.5 text-primary" /> {ep.auth.replace("-", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-xs text-foreground font-semibold">
                    {ep.status === "healthy" ? `${ep.latencyMs.toFixed(0)}ms` : "—"}
                  </td>
                  <td className="p-4 text-right">
                    {getStatusBadge(ep.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EndpointExplorer;
