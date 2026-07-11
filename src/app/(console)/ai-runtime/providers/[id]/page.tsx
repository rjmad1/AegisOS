"use client";

import * as React from "react";
import { Server, Activity, Shield, Clock, ChevronLeft, Link2, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { AIProvider } from "@/types/ai-runtime";

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [providerId, setProviderId] = React.useState<string | null>(null);
  const [provider, setProvider] = React.useState<AIProvider | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    params.then((p) => {
      setProviderId(p.id);
    });
  }, [params]);

  React.useEffect(() => {
    if (!providerId) return;
    const fetchProvider = async () => {
      try {
        const res = await fetch(`/api/v1/ai/providers/${providerId}`);
        if (res.ok) {
          const data = await res.json();
          setProvider(data);
        }
      } catch (err) {
        console.error("Failed to load provider details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [providerId]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Resolving provider metadata...</div>;
  }

  if (!provider) {
    return (
      <div className="py-20 text-center space-y-4 text-left">
        <h3 className="text-lg font-bold text-foreground">Provider Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested provider identifier does not exist.</p>
        <Button onClick={() => window.location.href = "/ai-runtime/providers"}>Back to Providers</Button>
      </div>
    );
  }

  const isHealthy = provider.health.status === "healthy";
  const isDegraded = provider.health.status === "degraded";

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = "/ai-runtime/providers"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Providers
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{provider.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{provider.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isHealthy ? "success" : isDegraded ? "secondary" : "destructive"}>
            {provider.health.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Diagnostic Checks */}
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Active Assertion Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {provider.health.checks && provider.health.checks.length > 0 ? (
                provider.health.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/20 border border-border/10">
                    <span className="text-foreground font-medium">{check.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{check.message}</span>
                      {check.status === "pass" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : check.status === "warn" ? (
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No diagnostics reported.</p>
              )}
            </CardContent>
          </Card>

          {/* Served Endpoints */}
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" /> Served Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {provider.endpoints.map((ep) => (
                <div key={ep.id} className="p-3 rounded-lg bg-secondary/10 border border-border/10 text-xs flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Server className="h-3.5 w-3.5 text-primary" /> {ep.id}
                    </span>
                    <span className="font-mono text-muted-foreground select-all">{ep.url}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold uppercase text-[10px] bg-secondary/40 px-1.5 py-0.5 rounded border border-border/20">
                      {ep.protocol}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono font-semibold text-foreground">{provider.version}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono font-semibold text-foreground">{provider.health.latencyMs.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Discovered Models</span>
                <span className="font-semibold text-foreground">{provider.modelCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
