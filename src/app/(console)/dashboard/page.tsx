"use client";

import * as React from "react";
import { Cpu, Bot, FileCode2, Play, HardDrive, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(false);

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Operational center for local AI infrastructure.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={handleSync}
            disabled={loading}
          >
            Sync Infrastructure
          </Button>
        </div>
      </div>

      {/* Greeting Banner */}
      <Alert variant="info" title="System Notice" className="glass-panel">
        You are in Phase 1: Foundation. Standard AI operations, API bindings, and routing states are loaded. Deployed services are binding to loopback exclusively.
      </Alert>

      {/* Main Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Models</CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Serving</div>
            <p className="text-xs text-muted-foreground mt-1">Serve via Ollama & LiteLLM</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orchestrated Agents</CardTitle>
            <Bot className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Active</div>
            <p className="text-xs text-muted-foreground mt-1">AegisOS agent clusters</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Artifacts</CardTitle>
            <FileCode2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24 Loaded</div>
            <p className="text-xs text-muted-foreground mt-1">Word, Excel, JSON, Markdown</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GPU Resource Fit</CardTitle>
            <HardDrive className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16 GB VRAM</div>
            <p className="text-xs text-muted-foreground mt-1">NVIDIA RTX 5080</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid of details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Connection Diagnostics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Infrastructure Control Plane</CardTitle>
            <CardDescription>Status check on running local system services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Ollama Inference Proxy", port: (() => { try { return parseInt(new URL(process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434").port) || 11434 } catch { return 11434 } })(), status: "healthy", role: "Model Inference" },
              { name: "LiteLLM Router", port: (() => { try { return parseInt(new URL(process.env.NEXT_PUBLIC_LITELLM_URL || "http://127.0.0.1:4000").port) || 4000 } catch { return 4000 } })(), status: "healthy", role: "Capability Routing" },
              { name: "AegisOS Gateway", port: (() => { try { return parseInt(new URL(process.env.NEXT_PUBLIC_AEGISOS_URL || "http://127.0.0.1:18789").port) || 18789 } catch { return 18789 } })(), status: "healthy", role: "MCP Host & Agents" },
              { name: "OmniRoute ELO Scorer", port: 20128, status: "healthy", role: "ELO Arena Engine" },
            ].map((service, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/10">
                <div className="flex flex-col space-y-0.5">
                  <span className="text-sm font-semibold">{service.name}</span>
                  <span className="text-xs text-muted-foreground">Port {service.port} &bull; {service.role}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Console Tasks</CardTitle>
            <CardDescription>Operational shortcuts for local clusters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Clear Model Cache",
              "Recalculate ELO Scores",
              "Verify MCP Handshakes",
              "Restart LiteLLM Service",
            ].map((task, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-xs font-semibold"
                leftIcon={<Play className="h-3 w-3 text-primary" />}
              >
                {task}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Tasks execute locally on host machine.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
