"use client";

import * as React from "react";
import { GitBranch, ChevronLeft, Sliders, Info, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import type { RoutingPolicy } from "@/types/ai-runtime";

export default function RoutesViewerPage() {
  const [routes, setRoutes] = React.useState<RoutingPolicy[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch("/api/v1/ai/routes");
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.routes || []);
        }
      } catch (err) {
        console.error("Failed to load gateway routes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = "/ai-runtime"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Console
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">LiteLLM Configured Gateway Routes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Observe the active load-balancing policies, fallback chains, timeouts, and retry metrics for each routed model.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading gateway routes...</div>
      ) : (
        <div className="space-y-4">
          {routes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No routing policies detected from active gateway.</p>
          ) : (
            routes.map((route) => (
              <Card key={route.id} glass className="border border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-mono font-bold text-foreground">
                        {route.virtualModelName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ID: {route.id}
                      </CardDescription>
                    </div>
                    <span className="px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary font-mono text-[9px] font-bold uppercase">
                      ROUTE ACTIVE
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-xs">
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                      <span className="text-muted-foreground text-[10px] block font-mono">LOAD BALANCING</span>
                      <span className="font-semibold text-foreground mt-1 block uppercase">{route.loadBalancing}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                      <span className="text-muted-foreground text-[10px] block font-mono">RETRY POLICY</span>
                      <span className="font-semibold text-foreground mt-1 block">
                        {route.retryPolicy.maxRetries} Retries ({route.retryPolicy.retryDelayMs}ms delay)
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                      <span className="text-muted-foreground text-[10px] block font-mono">TIMEOUT</span>
                      <span className="font-semibold text-foreground mt-1 block">{route.timeout}s</span>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                      <span className="text-muted-foreground text-[10px] block font-mono">RESPONSE CACHING</span>
                      <span className={`font-semibold mt-1 block ${route.cachingEnabled ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {route.cachingEnabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Underlying Model Target Mappings</span>
                    {route.underlyingModels.map((um, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded bg-secondary/10 border border-border/10 font-mono">
                        <span className="font-semibold text-foreground">{um.modelName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground capitalize">Provider: {um.provider}</span>
                          {um.weight !== undefined && (
                            <span className="text-[10px] font-bold text-primary">Weight: {um.weight}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          Routes are parsed directly from the LiteLLM dynamic router proxy config. These rules dictate load-distribution and network timeouts client-side during prompt execution.
        </p>
      </div>
    </div>
  );
}
