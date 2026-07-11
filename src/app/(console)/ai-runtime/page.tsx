"use client";

import * as React from "react";
import { Server, ShieldCheck, Activity, Cpu, Tag, Link2, GitBranch, ArrowRight, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ProviderStatusCard from "@/components/ai-runtime/ProviderStatusCard";
import type { AIRuntimeSummary } from "@/types/ai-runtime";

export default function AIRuntimeOverviewPage() {
  const [summary, setSummary] = React.useState<AIRuntimeSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/v1/ai/runtime");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error("Failed to load runtime overview:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Aggregating runtime statuses...</div>;
  }

  const isHealthy = summary?.health.overallStatus === "healthy";
  const isDegraded = summary?.health.overallStatus === "degraded";

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Gateway Control Plane</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Authoritative observability plane for local LLMs and routing gateways.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isHealthy ? "success" : isDegraded ? "secondary" : "destructive"}>
            {summary?.health.overallStatus.toUpperCase() || "UNKNOWN"}
          </Badge>
          <Button onClick={fetchSummary} variant="secondary" className="flex items-center gap-1">
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card glass className="border border-border/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Active Providers</span>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary?.providers.length || 0}</h3>
            </div>
            <Server className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>

        <Card glass className="border border-border/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Discovered Models</span>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary?.totalModels || 0}</h3>
            </div>
            <Cpu className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>

        <Card glass className="border border-border/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Configured Aliases</span>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary?.totalAliases || 0}</h3>
            </div>
            <Tag className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>

        <Card glass className="border border-border/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Gateway Routes</span>
              <h3 className="text-2xl font-bold text-foreground mt-1">{summary?.totalRoutes || 0}</h3>
            </div>
            <GitBranch className="h-8 w-8 text-primary/40" />
          </CardContent>
        </Card>
      </div>

      {/* Providers Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Infrastructure Providers</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {summary?.providers.map((p) => (
            <ProviderStatusCard
              key={p.id}
              provider={p}
              onClick={() => {
                window.location.href = `/ai-runtime/providers/${p.id}`;
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card glass className="border border-border/40 hover-glow cursor-pointer" onClick={() => window.location.href = "/models"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-primary" /> Model Registry
            </CardTitle>
            <CardDescription className="text-xs">Explore and filter all local and virtual models.</CardDescription>
          </CardHeader>
        </Card>

        <Card glass className="border border-border/40 hover-glow cursor-pointer" onClick={() => window.location.href = "/ai-runtime/graph"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-primary" /> Relationship Graph
            </CardTitle>
            <CardDescription className="text-xs">View routing flows from Gateway to underlying providers.</CardDescription>
          </CardHeader>
        </Card>

        <Card glass className="border border-border/40 hover-glow cursor-pointer" onClick={() => window.location.href = "/ai-runtime/health"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" /> Health Dashboard
            </CardTitle>
            <CardDescription className="text-xs">Inspect diagnostic assertions and version compatibility.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
