"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, Calendar, CheckCircle2, XCircle, AlertTriangle, Link as LinkIcon, RefreshCw, Bot, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ExecutionViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [execution, setExecution] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchExecution = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/executions/${id}`);
        if (!res.ok) throw new Error("Execution not found");
        const data = await res.json();
        setExecution(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchExecution();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading execution details timeline...</div>;
  }

  if (!execution) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Execution run "{id}" was not found.</p>
        <Button onClick={() => router.push("/executions")} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to Explorer
        </Button>
      </div>
    );
  }

  const getStepStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          bg: "bg-emerald-500/10 border-emerald-500/30",
          text: "text-emerald-500"
        };
      case "failed":
        return {
          icon: <XCircle className="h-5 w-5 text-rose-500" />,
          bg: "bg-rose-500/10 border-rose-500/30",
          text: "text-rose-500"
        };
      case "running":
        return {
          icon: <RefreshCw className="h-5 w-5 text-cyan-500 animate-spin" />,
          bg: "bg-cyan-500/10 border-cyan-500/30",
          text: "text-cyan-500"
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-muted-foreground" />,
          bg: "bg-zinc-800 border-zinc-700",
          text: "text-muted-foreground"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={() => router.push("/executions")}
          className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Executions</span>
          <h2 className="text-xl font-bold tracking-tight">Timeline: {execution.id.slice(0, 8)}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline Flow */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Pipeline Steps</CardTitle>
              <CardDescription>Step-by-step audit of runtime execution events.</CardDescription>
            </CardHeader>
            <CardContent className="relative pl-8 space-y-8 text-left py-6">
              {/* Vertical line indicator */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border/40" />

              {execution.steps?.map((step: any, idx: number) => {
                const styles = getStepStatusStyle(step.status);
                return (
                  <div key={step.id} className="relative flex gap-4">
                    {/* Circle Node Icon */}
                    <div className={`absolute -left-[30px] p-1 rounded-full bg-background border ${styles.bg}`}>
                      {styles.icon}
                    </div>
                    
                    <div className="flex-1 space-y-1.5 p-4 rounded-xl border border-border/30 bg-accent/5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-sm font-bold">{step.name}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{step.message}</p>
                      {step.durationMs && (
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Duration: {step.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Step Placeholder for Future Events (Step 11 requirement) */}
              {execution.status === "running" && (
                <div className="relative flex gap-4 opacity-50">
                  <div className="absolute -left-[30px] p-1 rounded-full bg-zinc-800 border border-zinc-700">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1 p-4 rounded-xl border border-dashed border-border/50 bg-transparent">
                    <h4 className="text-sm font-bold">Planned Step (Awaiting previous execution)</h4>
                    <p className="text-xs text-muted-foreground italic font-mono">Output packaging and artifacts synchronization.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Task Detail */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-mono">Executed Task Statement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 text-left">
              <div className="p-4 rounded-lg bg-black/40 border border-border/20 font-mono text-xs whitespace-pre-wrap leading-relaxed select-text text-muted-foreground">
                {execution.task}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Assigned Agent</span>
                <Link
                  href={`/agents/${execution.agentId}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
                >
                  <Bot className="h-3.5 w-3.5" />
                  {execution.agentId}
                </Link>
              </div>

              {execution.workflowId && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Workflow Pipeline</span>
                  <Link
                    href={`/workflows/${execution.workflowId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1 font-mono"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {execution.workflowId}
                  </Link>
                </div>
              )}

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Associated Chat</span>
                <Link
                  href={`/conversations/${execution.conversationId}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  {execution.conversationId.slice(0, 18)}...
                </Link>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Duration</span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "Pending completion"}
                </span>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Status:</span>
                  <span className="font-bold capitalize">{execution.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Created At:</span>
                  <span className="font-mono text-[10px]">{new Date(execution.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {execution.error && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 text-rose-500">
                  <XCircle className="h-4.5 w-4.5" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Fatal Error Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-left font-mono text-[11px] text-rose-400 whitespace-pre-wrap select-text leading-relaxed p-4 pt-0">
                {execution.error}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
