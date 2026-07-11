"use client";

import * as React from "react";
import { Cpu, Server, Shield, FileText, Zap, ChevronLeft, ArrowRight, Activity, Clock, Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CapabilityBadge } from "@/components/ai-runtime/CapabilityBadge";
import type { AIModel } from "@/types/ai-runtime";

export default function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [modelId, setModelId] = React.useState<string | null>(null);
  const [model, setModel] = React.useState<AIModel | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    params.then((p) => {
      setModelId(p.id);
    });
  }, [params]);

  React.useEffect(() => {
    if (!modelId) return;
    const fetchModel = async () => {
      try {
        const res = await fetch(`/api/v1/ai/models/${encodeURIComponent(modelId)}`);
        if (res.ok) {
          const data = await res.json();
          setModel(data);
        }
      } catch (err) {
        console.error("Failed to load model details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [modelId]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Resolving model metadata...</div>;
  }

  if (!model) {
    return (
      <div className="py-20 text-center space-y-4 text-left">
        <h3 className="text-lg font-bold text-foreground">Model Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested model identifier does not exist in the active registry.</p>
        <Button onClick={() => window.location.href = "/models"}>Back to Registry</Button>
      </div>
    );
  }

  const isRunning = model.status === "running";

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.href = "/models"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Registry
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{model.name}</h1>
            <Badge variant={isRunning ? "success" : "secondary"}>
              {isRunning ? "Running (VRAM)" : "Available"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Model family: <span className="font-semibold text-foreground">{model.family}</span> served by{" "}
            <span className="font-semibold text-primary capitalize">
              {model.providerId.replace("-ai-runtime", "").replace("-provider", "")}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Core Specs */}
        <div className="md:col-span-2 space-y-6">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Configuration Parameters & Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block">Parameter Size</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">{model.parameters}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block">Model Weight Storage</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">{model.sizeDisplay}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block">Quantization format</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block uppercase">
                    {model.quantization.format !== "unknown" ? model.quantization.format : "None/Native"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block">Context Window (Total)</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">
                    {model.contextWindow.totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>

              {model.digest && (
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block">Digest (SHA-256 Signature)</span>
                  <span className="font-mono text-xs text-foreground mt-1 block break-all select-all">{model.digest}</span>
                </div>
              )}

              {model.architecture && (
                <div className="flex justify-between items-center py-2 border-b border-border/10">
                  <span className="text-muted-foreground">Neural Architecture</span>
                  <span className="font-mono font-semibold text-foreground">{model.architecture}</span>
                </div>
              )}

              {model.license && model.license !== "unknown" && (
                <div className="flex justify-between items-center py-2 border-b border-border/10">
                  <span className="text-muted-foreground">Model License</span>
                  <span className="font-semibold text-foreground text-xs truncate max-w-[300px]">{model.license}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Template / Prompt Formatting */}
          {model.templateFormat && (
            <Card glass className="border border-border/40">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Template Format (Prompt Wrapping)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-slate-950/60 border border-border/20 text-xs font-mono overflow-x-auto max-h-60 text-left whitespace-pre-wrap">
                  {model.templateFormat}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Gateway Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {model.capabilities
                  .filter((c) => c.supported)
                  .map((c) => (
                    <CapabilityBadge key={c.name} capability={c.name} />
                  ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                These features are natively exposed and validated on the endpoint.
              </p>
            </CardContent>
          </Card>

          {/* Deployment Status */}
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Deployment Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">State</span>
                <span className="font-semibold text-foreground uppercase">{model.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">Virtual Alias</span>
                <span className="font-mono text-foreground font-semibold">
                  {model.aliases.length > 0 ? model.aliases.join(", ") : "None"}
                </span>
              </div>
              {model.lifecycle.lastAccessedAt && (
                <div className="flex justify-between py-1.5 border-b border-border/10">
                  <span className="text-muted-foreground">Last Invocation</span>
                  <span className="font-mono text-foreground">
                    {new Date(model.lifecycle.lastAccessedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
