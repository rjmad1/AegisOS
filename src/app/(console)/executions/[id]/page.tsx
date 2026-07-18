"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Clock, Calendar, CheckCircle2, XCircle, 
  AlertTriangle, Link as LinkIcon, RefreshCw, Bot, Terminal, Wrench 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ExecutionViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [execution, setExecution] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedStep, setSelectedStep] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchExecution = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/executions/${id}`);
        if (!res.ok) throw new Error("Execution not found");
        const data = await res.json();
        setExecution(data);
        // Default select the first step if available
        if (data.steps && data.steps.length > 0) {
          setSelectedStep(data.steps[0]);
        }
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

  // Mock Reasoning Steps
  const getStepReasoning = (stepName: string) => {
    const logs: Record<string, { thought: string; toolCall?: string; toolArgs?: string; toolResult?: string }> = {
      "Initialize workspace profile": {
        thought: "Targeting project path. Reading configuration parameters from local registry...\nResolving workspace metadata. Workspace name: 'AegisOS Orchestration Engine'.\nChecking system default settings. Found model provider: Ollama. Bootstrapping model aliases.",
        toolCall: "read_file",
        toolArgs: '{\n  "path": "/workspace/package.json"\n}',
        toolResult: "{\n  \"name\": \"aegisos\",\n  \"version\": \"1.0.0-core\",\n  \"dependencies\": {\n    \"next\": \"15.0.0\",\n    \"react\": \"19.0.0\"\n  }\n}"
      },
      "Execute build tool": {
        thought: "Triggering compiler compilation. Command prefix: 'npm run build'.\nParsing Typescript sources, resolving dependency trees.\nVerifying type safety: npx tsc --noEmit. Checking schema validation rules.",
        toolCall: "run_command",
        toolArgs: '{\n  "CommandLine": "npm run build"\n}',
        toolResult: "[SUCCESS] Next.js production build compiled. 14 static pages generated.\nSize: 420 KB | Chunk hash verified."
      },
      "Synthesize report": {
        thought: "Aggregating metrics collected from all operational modules.\nStructuring report layout. Adding summary table, performance charts, and alert lists.\nValidating schema compliance.",
        toolCall: "write_to_file",
        toolArgs: '{\n  "TargetFile": "/workspace/reports/daily_telemetry_report.md",\n  "CodeContent": "# Daily Telemetry Report..."\n}',
        toolResult: "[SUCCESS] Written 1253 bytes to target file. File descriptor closed."
      }
    };

    return logs[stepName] || {
      thought: `Parsing step requirements for '${stepName}'...\nAnalyzing input parameters and execution state.\nEvaluating next actions. Proceeding with sequence.`,
      toolCall: "None",
      toolArgs: "{}",
      toolResult: "OK"
    };
  };

  const currentReasoning = selectedStep ? getStepReasoning(selectedStep.name) : null;

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

      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Timeline Flow Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-950/20 border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-indigo-400">Execution Pipeline Steps</CardTitle>
              <CardDescription className="text-xs">
                Step-by-step audit of runtime execution events. Click a step to inspect reasoning.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative pl-8 space-y-6 text-left py-4">
              {/* Vertical line indicator */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border/20" />

              {execution.steps?.map((step: any) => {
                const styles = getStepStatusStyle(step.status);
                const isSelected = selectedStep?.id === step.id;
                return (
                  <div 
                    key={step.id} 
                    onClick={() => setSelectedStep(step)}
                    className={`relative flex gap-4 cursor-pointer group transition-all`}
                  >
                    {/* Circle Node Icon */}
                    <div className={`absolute -left-[30px] p-1 rounded-full bg-background border transition-all ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : ""
                    } ${styles.bg}`}>
                      {styles.icon}
                    </div>
                    
                    <div className={`flex-1 space-y-1.5 p-3.5 rounded-xl border transition-all ${
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border/30 bg-accent/5 hover:border-border/60 hover:bg-accent/10"
                    }`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-bold font-mono group-hover:text-primary transition-colors">
                          {step.name}
                        </h4>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap">{step.message}</p>
                      {step.durationMs && (
                        <span className="text-[9px] text-zinc-500 block font-mono">
                          Duration: {step.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Step Placeholder for Future Events */}
              {execution.status === "running" && (
                <div className="relative flex gap-4 opacity-40">
                  <div className="absolute -left-[30px] p-1 rounded-full bg-zinc-900 border border-zinc-800">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1 p-4 rounded-xl border border-dashed border-border/40 bg-transparent">
                    <h4 className="text-xs font-bold">Planned Step (Awaiting previous execution)</h4>
                    <p className="text-[10px] text-muted-foreground italic font-mono">Output packaging and artifacts synchronization.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Task Detail */}
          <Card className="bg-zinc-950/20 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-xs font-bold uppercase text-indigo-400 font-mono">Executed Task Statement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2 text-left">
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-850 font-mono text-[10px] whitespace-pre-wrap leading-relaxed select-text text-zinc-400">
                {execution.task}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Step reasoning drawer details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStep && currentReasoning && (
            <Card className="bg-zinc-950/40 border-primary/30 flex flex-col font-mono text-zinc-300">
              <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Bot className="h-4 w-4" /> Agent Air Traffic Control Drawer
                  </CardTitle>
                  <CardDescription className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                    Step: {selectedStep.name}
                  </CardDescription>
                </div>
                <Badge variant={selectedStep.status === "completed" || selectedStep.status === "succeeded" ? "success" : "warning"} className="text-[9px]">
                  {selectedStep.status.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs divide-y divide-zinc-900">
                {/* 1. Internal Reasoning Process */}
                <div className="pb-3 space-y-2">
                  <span className="text-[9px] text-primary uppercase font-bold block tracking-wider flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5" /> Agent Internal Thought Logs
                  </span>
                  <div className="p-3 bg-black/60 border border-zinc-900 text-cyan-400 rounded-lg text-[10px] leading-relaxed whitespace-pre-wrap select-text">
                    {currentReasoning.thought}
                  </div>
                </div>

                {/* 2. Tool Execution details */}
                {currentReasoning.toolCall && currentReasoning.toolCall !== "None" && (
                  <div className="py-3 space-y-3">
                    <span className="text-[9px] text-indigo-400 uppercase font-bold block tracking-wider flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" /> Invoked Tool Call details
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] text-muted-foreground block mb-1">Arguments (Args)</span>
                        <pre className="p-2.5 bg-black/50 border border-zinc-900 rounded font-mono text-[9px] text-zinc-300 overflow-x-auto whitespace-pre">
                          {currentReasoning.toolArgs}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block mb-1">Response Output</span>
                        <pre className="p-2.5 bg-black/50 border border-zinc-900 rounded font-mono text-[9px] text-emerald-500 overflow-x-auto whitespace-pre-wrap">
                          {currentReasoning.toolResult}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Duration metadata */}
                <div className="pt-3 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-muted-foreground">Execution Latency:</span>
                  <span className="font-bold text-white">{selectedStep.durationMs ? `${selectedStep.durationMs} ms` : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execution Statistics card */}
          <Card className="bg-zinc-950/20 border-border/40">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase text-indigo-400 font-mono">Execution Context Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left font-mono text-xs">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Assigned Agent Persona</span>
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
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Workflow Pipeline Target</span>
                  <Link
                    href={`/workflows/${execution.workflowId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {execution.workflowId}
                  </Link>
                </div>
              )}

              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Associated Chat Session</span>
                <Link
                  href={`/conversations/${execution.conversationId}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 mt-1"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  {execution.conversationId.slice(0, 18)}...
                </Link>
              </div>

              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-bold block">Duration</span>
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {execution.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "Pending completion"}
                </span>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold capitalize text-white">{execution.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created At:</span>
                  <span className="text-[10px] text-zinc-400">{new Date(execution.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {execution.error && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 text-rose-500">
                  <XCircle className="h-4 w-4" />
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
