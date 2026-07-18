"use client";

import * as React from "react";
import { 
  Target, Activity, Clock, ShieldCheck, Pause, Play, RefreshCw, 
  CheckCircle2, AlertTriangle, Cpu, Wrench, Layers, ChevronRight 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConversationStore } from "@/store/conversationStore";

export const MissionPanel: React.FC = () => {
  const { activeMission, pauseMission, resumeMission, reconnectSSE, sseStatus } = useConversationStore();

  if (!activeMission) {
    return (
      <div className="p-6 text-center text-muted-foreground space-y-4">
        <Target className="h-10 w-10 mx-auto text-muted-foreground/40 animate-pulse" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No Active Mission</p>
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono text-primary font-bold">"Analyze this repository."</span> in the conversation to automatically launch a mission.
          </p>
        </div>
      </div>
    );
  }

  const isExecuting = activeMission.status === "EXECUTING";
  const isCompleted = activeMission.status === "COMPLETED";
  const isFailed = activeMission.status === "FAILED";
  const isPlanning = activeMission.status === "PLANNING" || activeMission.status === "CREATED";

  // Calculate progress estimate
  const totalSteps = activeMission.history.length || 4;
  const progressPct = isCompleted ? 100 : isFailed ? 45 : isExecuting ? Math.min(85, Math.max(30, totalSteps * 20)) : 15;

  const currentPhase = isCompleted 
    ? "Reflection & Verification Complete" 
    : isFailed 
    ? "Failure Recovery Evaluation" 
    : isExecuting 
    ? "Execution Graph Node Processing" 
    : "Intent Analysis & Mission Planning";

  return (
    <div className="p-4 space-y-4 text-left font-sans">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold tracking-tight">Current Mission</h3>
        </div>
        <Badge 
          variant={isCompleted ? "success" : isFailed ? "destructive" : isExecuting ? "default" : "outline"}
          className="text-[10px] font-mono capitalize"
        >
          {activeMission.status}
        </Badge>
      </div>

      {/* Title & Goal Card */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest block">
              Mission ID: {activeMission.id.slice(0, 12)}
            </span>
            <h4 className="text-sm font-bold text-foreground mt-0.5">{activeMission.name}</h4>
          </div>

          {activeMission.goals && activeMission.goals.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Primary Goals:</span>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {activeMission.goals.map((g, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress & Health Bar */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground">Progress</span>
            <span className="font-mono font-bold text-primary">{progressPct}%</span>
          </div>

          <div className="w-full bg-accent/40 rounded-full h-2 overflow-hidden border border-border/40">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-gradient-to-r from-primary to-cyan-400"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="p-2 rounded-lg bg-accent/20 border border-border/40">
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Health</span>
              <div className="flex items-center space-x-1 mt-0.5 font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Healthy (0 errors)</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-accent/20 border border-border/40">
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Est. Completion</span>
              <div className="flex items-center space-x-1 mt-0.5 font-semibold font-mono text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{isCompleted ? "0s (Done)" : "~15 seconds"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Phase, Agent, Tool Details */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <Layers className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Current Phase</span>
              <span className="font-semibold text-foreground">{currentPhase}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2 border-t border-border/30">
            <Cpu className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Current Agent</span>
              <span className="font-semibold text-foreground">Main Orchestrator Agent (Ollama / Smollm)</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2 border-t border-border/30">
            <Wrench className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Active Tool</span>
              <span className="font-semibold text-foreground font-mono">mcp:git / workspace_scan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Actions */}
      <div className="flex items-center gap-2 pt-2">
        {isExecuting ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs"
            leftIcon={<Pause className="h-3.5 w-3.5 text-amber-400" />}
            onClick={pauseMission}
          >
            Pause Mission
          </Button>
        ) : isPlanning ? (
          <Button
            size="sm"
            variant="primary"
            className="w-full text-xs"
            leftIcon={<Play className="h-3.5 w-3.5 text-emerald-400" />}
            onClick={resumeMission}
          >
            Resume Mission
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="secondary"
          className="w-full text-xs"
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${sseStatus === 'connecting' ? 'animate-spin' : ''}`} />}
          onClick={reconnectSSE}
        >
          {sseStatus === 'connected' ? 'Reconnect SSE' : 'Reconnecting...'}
        </Button>
      </div>
    </div>
  );
};
