"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, RefreshCw, Layers, ShieldCheck, ChevronRight, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AgentsPage() {
  const [agents, setAgents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/agents");
      if (!res.ok) throw new Error("Failed to load agent fleet");
      const data = await res.json();
      setAgents(data.agents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Fleet</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and explore registered AegisOS agent nodes and capability mappings.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchAgents}
            disabled={loading}
          >
            Refresh Fleet
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Agent Registry list */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Agents</CardTitle>
              <CardDescription>Available agent personas registered in the AegisOS workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Loading agent registry...</div>
              ) : agents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active agents found in workspace.</div>
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-accent/5 gap-4 text-left hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary mt-0.5 group-hover:scale-105 transition-transform">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/agents/${agent.id}`} className="text-sm font-bold hover:text-primary transition-colors">
                            {agent.name}
                          </Link>
                          <Badge variant="success" className="text-[9px] font-mono capitalize">Online</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {agent.capabilities?.map((cap: string, cIdx: number) => (
                            <Badge key={cIdx} variant="secondary" className="text-[9px] px-1.5 py-0 border border-border/30 font-mono capitalize">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-muted-foreground font-mono block">Uptime Runs</span>
                        <span className="text-xs font-mono font-bold">{agent.stats?.totalRuns || 0}</span>
                      </div>
                      <Link href={`/agents/${agent.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                          Inspect Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* MCP tool registry brief */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inference Parameters</CardTitle>
              <CardDescription>Default routing models configuration status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div className="p-3 rounded-lg border border-border/40 bg-accent/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">Standard Model:</span>
                  <Badge variant="outline" className="font-mono text-[10px]">smollm:135m</Badge>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-accent/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">Local Endpoint:</span>
                  <span className="font-mono text-[10px] text-muted-foreground">127.0.0.1:4000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
