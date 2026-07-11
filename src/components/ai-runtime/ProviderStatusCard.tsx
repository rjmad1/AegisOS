"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Server, Wifi, WifiOff, Activity, Clock, Shield } from "lucide-react";
import type { AIProvider } from "@/types/ai-runtime";

interface ProviderStatusCardProps {
  provider: AIProvider;
  onClick?: () => void;
}

export const ProviderStatusCard: React.FC<ProviderStatusCardProps> = ({ provider, onClick }) => {
  const isHealthy = provider.health.status === "healthy";
  const isDegraded = provider.health.status === "degraded";

  return (
    <Card
      glass
      className="border border-border/40 hover-glow cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      onClick={onClick}
    >
      <CardHeader className="pb-2 text-left">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${isHealthy ? "bg-emerald-500/10 border-emerald-500/20" : isDegraded ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"} border`}>
            <Server className={`h-5 w-5 ${isHealthy ? "text-emerald-400" : isDegraded ? "text-amber-400" : "text-red-400"}`} />
          </div>
          <Badge variant={isHealthy ? "success" : isDegraded ? "secondary" : "destructive"}>
            {provider.health.status}
          </Badge>
        </div>
        <CardTitle className="text-sm mt-3 truncate">{provider.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{provider.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-[10px] space-y-1.5 pt-2 border-t border-border/20 text-left">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Type</span>
          <span className="font-semibold text-foreground capitalize">{provider.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Latency</span>
          <span className="font-semibold text-foreground">{provider.health.latencyMs.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            {isHealthy ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />} Connection
          </span>
          <span className={`font-semibold ${isHealthy ? "text-emerald-400" : "text-red-400"}`}>
            {provider.health.heartbeat ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Version</span>
          <span className="font-semibold text-primary font-mono truncate max-w-[120px]">{provider.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Models</span>
          <span className="font-semibold text-foreground">{provider.modelCount}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderStatusCard;
