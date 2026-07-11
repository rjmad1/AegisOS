"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Bot, ShieldAlert, Cpu, CheckCircle2, XCircle, Clock, Database, Wrench, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AgentViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [agent, setAgent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/agents/${id}`);
        if (!res.ok) throw new Error("Agent not found");
        const data = await res.json();
        setAgent(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading agent profile details...</div>;
  }

  if (!agent) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Agent "{id}" was not found.</p>
        <Button onClick={() => router.push("/agents")} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to Fleet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={() => router.push("/agents")}
          className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Agent Fleet</span>
          <h2 className="text-xl font-bold tracking-tight">{agent.name}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Capabilities and Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Role / Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Role Description & Capabilities</CardTitle>
              <CardDescription>Scope parameters assigned to this agent's identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <p className="text-sm text-muted-foreground leading-relaxed">{agent.role}</p>
              
              <div className="border-t border-border/20 pt-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-2">Capabilities</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities?.map((cap: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="capitalize text-[10px] font-mono">
                      {cap.replace("-", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Toolset Capabilities</CardTitle>
              <CardDescription>Tools explicitly allowed in execution prompts.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-left">
              {agent.tools?.map((toolName: string, idx: number) => (
                <Link
                  key={idx}
                  href={`/tools/${encodeURIComponent(toolName)}`}
                  className="p-3 rounded-lg border border-border/30 bg-accent/5 hover:border-primary/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-bold font-mono">{toolName}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono">view schema</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar specs and stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model & Routing Params</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Assigned LLM Model</span>
                <span className="text-xs font-mono font-semibold flex items-center gap-1.5 mt-1">
                  <Cpu className="h-3.5 w-3.5 text-cyan-500" />
                  {agent.model}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Memory Provider</span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                  <Database className="h-3.5 w-3.5 text-emerald-500" />
                  {agent.memoryProvider || "local-sqlite"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Knowledge Context</span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                  <Database className="h-3.5 w-3.5 text-amber-500" />
                  {agent.knowledgeProvider || "N/A"}
                </span>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Execution Statistics</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Total Runs:</span>
                    <span className="font-mono font-bold">{agent.stats?.totalRuns || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Success Rate:</span>
                    <Badge variant="success" className="font-mono text-[9px]">{agent.stats?.successRate || 100}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Average Latency:</span>
                    <span className="font-mono text-muted-foreground">{((agent.stats?.avgDurationMs || 0) / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
