"use client";

import * as React from "react";
import { GitBranch, ChevronLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import RelationshipGraph from "@/components/ai-runtime/RelationshipGraph";
import type { RelationshipGraphData, GraphNode, GraphEdge } from "@/types/ai-runtime";

export default function RelationshipGraphPage() {
  const [graphData, setGraphData] = React.useState<RelationshipGraphData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const [provRes, modelsRes, aliasRes] = await Promise.all([
        fetch("/api/v1/ai/providers"),
        fetch("/api/v1/ai/models?pageSize=1000"),
        fetch("/api/v1/ai/aliases")
      ]);

      if (provRes.ok && modelsRes.ok && aliasRes.ok) {
        const provData = await provRes.json();
        const modelsData = await modelsRes.json();
        const aliasData = await aliasRes.json();

        const providers = provData.providers || [];
        const models = modelsData.data || [];
        const aliases = aliasData.aliases || [];

        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const seen = new Set<string>();

        // Add provider nodes
        providers.forEach((p: any) => {
          const nodeId = `provider:${p.id}`;
          if (!seen.has(nodeId)) {
            seen.add(nodeId);
            nodes.push({ id: nodeId, label: p.name, type: p.type === "gateway" ? "gateway" : "provider", status: p.health });
          }
        });

        // Gateway → Provider edges
        const gateway = providers.find((p: any) => p.type === "gateway");
        const inferenceProviders = providers.filter((p: any) => p.type === "inference");
        if (gateway) {
          inferenceProviders.forEach((ip: any) => {
            edges.push({ source: `provider:${gateway.id}`, target: `provider:${ip.id}`, label: "routes to", type: "routes-to" });
          });
        }

        // Add model nodes
        models.forEach((m: any) => {
          const modelNodeId = `model:${m.id}`;
          if (!seen.has(modelNodeId)) {
            seen.add(modelNodeId);
            nodes.push({
              id: modelNodeId,
              label: m.displayName,
              type: "model",
              status: m.status === "running" ? "healthy" : "healthy"
            });
            edges.push({ source: `provider:${m.providerId}`, target: modelNodeId, label: "provides", type: "provides" });

            // Capabilities
            m.capabilities.forEach((cap: any) => {
              if (cap.supported) {
                const capNodeId = `capability:${cap.name}`;
                if (!seen.has(capNodeId)) {
                  seen.add(capNodeId);
                  nodes.push({ id: capNodeId, label: cap.name, type: "capability", status: "healthy" });
                }
                edges.push({ source: modelNodeId, target: capNodeId, type: "has-capability" });
              }
            });
          }
        });

        // Add alias nodes
        aliases.forEach((a: any) => {
          const aliasNodeId = `alias:${a.alias}`;
          if (!seen.has(aliasNodeId)) {
            seen.add(aliasNodeId);
            nodes.push({ id: aliasNodeId, label: a.alias, type: "alias", status: "healthy" });
          }
          edges.push({ source: aliasNodeId, target: `model:${a.modelId}`, label: "maps to", type: "aliases" });
          if (gateway) {
            edges.push({ source: `provider:${gateway.id}`, target: aliasNodeId, type: "aliases" });
          }
        });

        setGraphData({ nodes, edges });
      }
    } catch (e) {
      console.error("Failed to build model relationship graph:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGraphData();
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
        <h1 className="text-2xl font-bold tracking-tight">Infrastructure Relationship Graph</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive graph mapping LiteLLM routes, physical providers, local models, and system capabilities.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Calculating graph relationships...</div>
      ) : graphData ? (
        <RelationshipGraph data={graphData} />
      ) : (
        <p className="text-sm text-muted-foreground italic">Failed to calculate graph data.</p>
      )}
    </div>
  );
}
