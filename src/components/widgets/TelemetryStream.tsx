"use client";

import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Activity, ShieldCheck, AlertCircle } from "lucide-react";
import { LoadingBoundary } from "../ui/LoadingBoundary";
import { ErrorBoundary } from "../ui/ErrorBoundary";

interface TelemetryMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
}

export function TelemetryStream() {
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mock WebSocket connection
    const timer = setTimeout(() => setIsConnected(true), 1000);
    
    const interval = setInterval(() => {
      setMetrics([
        { id: "cpu", name: "CPU Load", value: Math.floor(Math.random() * 100), unit: "%", status: Math.random() > 0.8 ? "warning" : "healthy" },
        { id: "mem", name: "Memory", value: Math.floor(Math.random() * 64), unit: "GB", status: "healthy" },
        { id: "net", name: "Network Tx/Rx", value: Math.floor(Math.random() * 1000), unit: "Mbps", status: "healthy" },
      ]);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Live Telemetry</h3>
          </div>
          <Badge variant={isConnected ? "secondary" : "outline"} className={isConnected ? "bg-green-500/20 text-green-500" : ""}>
            {isConnected ? "Connected (WS)" : "Connecting..."}
          </Badge>
        </div>

        <LoadingBoundary isLoading={!isConnected}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="p-3 bg-muted/20 border border-border/30 rounded-lg flex flex-col justify-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{metric.name}</p>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-2xl font-bold font-mono">{metric.value}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                {metric.status === "warning" && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>Elevated</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </LoadingBoundary>
      </Card>
    </ErrorBoundary>
  );
}
