// src/app/(console)/mission-replay/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Play, Pause, FastForward, SkipForward, ArrowLeft, RefreshCw, 
  Terminal, ShieldCheck, Cpu, Bot, Wrench, FileCode, CheckCircle2, 
  AlertTriangle, Settings2, Info, BookOpen, Layers
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function MissionReplayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const missionId = searchParams.get("missionId") || "";

  const [missionsList, setMissionsList] = React.useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = React.useState(missionId);
  const [mission, setMission] = React.useState<any>(null);
  const [execution, setExecution] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1); // 1x, 2x, 5x
  const playbackTimerRef = React.useRef<any>(null);

  // Fetch all missions for dropdown
  const loadMissionsList = async () => {
    try {
      const res = await fetch("/api/v1/missions");
      if (res.ok) {
        const data = await res.json();
        setMissionsList(data);
        if (data.length > 0 && !selectedMissionId) {
          setSelectedMissionId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load missions list", e);
    }
  };

  // Load detailed mission + execution telemetry
  const loadMissionDetails = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const missionRes = await fetch(`/api/v1/missions/${id}`);
      if (missionRes.ok) {
        const missionData = await missionRes.json();
        setMission(missionData);
        setCurrentStepIndex(0);
        setIsPlaying(false);

        // Retrieve recorded execution telemetry
        if (missionData.activeExecutionId) {
          const execRes = await fetch(`/api/v1/executions/${missionData.activeExecutionId}`);
          if (execRes.ok) {
            const execData = await execRes.json();
            setExecution(execData);
          } else {
            setExecution(null);
          }
        } else {
          setExecution(null);
        }
      }
    } catch (e) {
      console.error("Failed to load mission telemetry", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadMissionsList();
  }, []);

  React.useEffect(() => {
    if (selectedMissionId) {
      loadMissionDetails(selectedMissionId);
    }
  }, [selectedMissionId]);

  // Handle Playback Interval Timer
  React.useEffect(() => {
    if (isPlaying && execution?.steps?.length > 0) {
      const baseDelay = 3000; // 3 seconds per step at 1x
      const delay = baseDelay / playbackSpeed;
      
      playbackTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= execution.steps.length - 1) {
            setIsPlaying(false);
            clearInterval(playbackTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, execution, playbackSpeed]);

  const handleMissionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMissionId(e.target.value);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleStepForward = () => {
    if (execution?.steps && currentStepIndex < execution.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Compile mock telemetry/details since we want to show specific details if missing
  const activeStep = execution?.steps?.[currentStepIndex] || null;

  // Retrieve mock agent details for playback
  const getStepTelemetry = (stepName: string) => {
    const defaultData = {
      agent: "system:mission-runtime",
      tool: "read_file",
      args: '{\n  "path": "src/proxy.ts"\n}',
      result: "[SUCCESS] Exposing LiteLLM proxy port 4000.",
      grounding: "Grounding text: Expose proxy endpoints. Similarity: 0.98",
      completeness: 100,
      safety: 100,
      gap: "None"
    };

    const details: Record<string, typeof defaultData> = {
      "Initialize workspace profile": {
        agent: "system:workspace-agent",
        tool: "read_file",
        args: '{\n  "path": "/workspace/package.json"\n}',
        result: '{\n  "name": "aegis-os",\n  "version": "0.1.0"\n}',
        grounding: "Grounding: Found package config. Similarity: 0.95",
        completeness: 80,
        safety: 100,
        gap: "Resolve workspace build"
      },
      "Execute build tool": {
        agent: "system:compile-agent",
        tool: "run_command",
        args: '{\n  "CommandLine": "npm run build"\n}',
        result: "[SUCCESS] Compiled Next.js dashboard bundle.",
        grounding: "Grounding: Build completed successfully. Similarity: 0.92",
        completeness: 90,
        safety: 100,
        gap: "Verify test suites"
      },
      "Synthesize report": {
        agent: "system:audit-reporter",
        tool: "write_to_file",
        args: '{\n  "TargetFile": "/workspace/reports/audit.md",\n  "CodeContent": "# Audit..."\n}',
        result: "[SUCCESS] Written 8.4 KB to workspace.",
        grounding: "Grounding: Report generated successfully. Similarity: 0.97",
        completeness: 100,
        safety: 100,
        gap: "None"
      }
    };

    return details[stepName] || defaultData;
  };

  const telemetry = activeStep ? getStepTelemetry(activeStep.name) : null;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-left">
      {/* Header breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/mission-control")}
            className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest font-mono">Mission Telemetry Replay</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Mission Replay Console</span>
              {mission && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono uppercase">
                  {mission.status}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-mono">Select Mission:</span>
          <select
            value={selectedMissionId}
            onChange={handleMissionSelect}
            className="bg-card border border-border/50 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
          >
            {missionsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 w-full flex-col items-center justify-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading recorded execution telemetry...</p>
        </div>
      ) : !mission ? (
        <div className="text-center py-24 border border-dashed border-border/40 rounded-2xl bg-card/40">
          <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-sm text-foreground">No Mission Selected</h3>
          <p className="text-xs text-muted-foreground mt-1">Please select an autonomous mission to replay telemetry records.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4 items-start">
          {/* Main Visual Player */}
          <div className="lg:col-span-3 space-y-6">
            {/* Player Controls Bar */}
            <Card className="border-indigo-500/20 bg-indigo-500/5">
              <CardContent className="py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Visual playback status */}
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    onClick={togglePlay}
                    className="h-10 w-10 p-0 rounded-full border-primary/30 flex items-center justify-center text-primary"
                  >
                    {isPlaying ? <Pause className="h-4.5 w-4.5 fill-primary text-primary" /> : <Play className="h-4.5 w-4.5 fill-primary text-primary" />}
                  </Button>
                  
                  <div className="flex items-center space-x-1.5 border border-border/40 rounded-lg p-1 bg-background/50">
                    <Button variant="ghost" size="sm" onClick={handleStepBackward} disabled={currentStepIndex === 0} className="h-7 w-7 p-0">
                      <SkipForward className="h-3.5 w-3.5 rotate-180" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleStepForward} disabled={!execution || currentStepIndex === execution.steps.length - 1} className="h-7 w-7 p-0">
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center space-x-1 border border-border/40 rounded-lg p-1 bg-background/50 text-[10px] font-mono font-bold">
                    {([1, 2, 5] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-1 rounded transition-colors ${
                          playbackSpeed === speed ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar scrub indicator */}
                {execution?.steps?.length > 0 && (
                  <div className="flex-1 w-full flex items-center space-x-3 text-xs font-mono">
                    <span className="text-muted-foreground">
                      {currentStepIndex + 1}/{execution.steps.length}
                    </span>
                    <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((currentStepIndex + 1) / execution.steps.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">
                      {Math.round(((currentStepIndex + 1) / execution.steps.length) * 100)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual execution graph & step panels */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Execution Graph panel */}
              <Card className="bg-zinc-950/20 border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Execution Graph Step Tracking</CardTitle>
                </CardHeader>
                <CardContent className="relative pl-7 space-y-4 py-2">
                  <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-border/20" />
                  
                  {execution?.steps?.map((step: any, idx: number) => {
                    const isPassed = idx < currentStepIndex;
                    const isActive = idx === currentStepIndex;
                    const isUpcoming = idx > currentStepIndex;

                    return (
                      <div
                        key={step.id}
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`relative flex gap-3 cursor-pointer group transition-all`}
                      >
                        <div className={`absolute -left-[23px] p-1.5 rounded-full border transition-all ${
                          isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20 border-primary" :
                          isPassed ? "bg-emerald-500/20 border-emerald-500" :
                          "bg-zinc-800 border-zinc-700"
                        }`}>
                          {isPassed ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                           isActive ? <Cpu className="h-3 w-3 text-indigo-400 animate-pulse" /> :
                           <SkipForward className="h-3 w-3 text-muted-foreground" />}
                        </div>

                        <div className={`flex-1 p-3 rounded-lg border transition-all ${
                          isActive ? "border-primary bg-primary/5 shadow" : "border-border/30 bg-background/40"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold font-mono text-foreground">{step.name}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {new Date(step.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 line-clamp-1">{step.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Step Cognitive context details */}
              <div className="space-y-6">
                {/* Agent thoughts & tools */}
                <Card className="bg-zinc-950/20 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Agent Air Traffic Control drawer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs font-mono">
                    {telemetry ? (
                      <>
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <Bot className="h-3.5 w-3.5 text-emerald-500" /> Assigned Worker Agent
                          </span>
                          <div className="p-2 rounded bg-black/60 border border-zinc-900 text-foreground font-semibold flex items-center space-x-1.5">
                            <Bot className="h-4 w-4 text-primary" />
                            <span>{telemetry.agent}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                            <Wrench className="h-3.5 w-3.5 text-indigo-400" /> Invoked Tool Call
                          </span>
                          <div className="p-2.5 rounded bg-black/60 border border-zinc-900 text-cyan-400 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                              <span className="font-semibold text-primary">{telemetry.tool}</span>
                              <span className="text-[9px] text-muted-foreground">args</span>
                            </div>
                            <pre className="text-[9px] overflow-x-auto whitespace-pre">{telemetry.args}</pre>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold">Tool Return Value</span>
                          <pre className="p-2.5 bg-black/60 border border-zinc-900 rounded font-mono text-[9px] text-emerald-500 overflow-x-auto whitespace-pre-wrap max-h-24 select-text">
                            {telemetry.result}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic text-center py-6">Play step to verify telemetry...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Knowledge Retrieval / Grounding & Artifacts panel */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-zinc-950/20 border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-400" /> Knowledge RAG Grounding
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs font-mono">
                  {telemetry ? (
                    <div className="p-3 bg-black/60 border border-zinc-900 text-zinc-300 rounded-lg leading-relaxed whitespace-pre-wrap select-text">
                      {telemetry.grounding}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-6">Awaiting playback step...</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-950/20 border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-purple-400" /> Generated Artifacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs font-mono">
                  {mission.artifacts && mission.artifacts.length > 0 ? (
                    <div className="space-y-2">
                      {mission.artifacts.map((artPath: string, artIdx: number) => (
                        <div key={artIdx} className="p-2 rounded bg-black/40 border border-zinc-900 flex items-center justify-between text-[11px] truncate font-semibold">
                          <span className="text-zinc-400">{artPath.split("/").pop()}</span>
                          <span className="text-primary hover:underline cursor-pointer">Preview</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-6">No artifacts created by this mission.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side Panel: Reflection scorecards & Gap analysis */}
          <div className="space-y-6">
            {/* Cognitive Scorecard */}
            <Card className="bg-zinc-950/20 border-border/40 text-left font-mono">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase text-indigo-400">Step Cognitive Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                {telemetry ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">COMPLETENESS:</span>
                        <span className="font-bold text-emerald-400">{telemetry.completeness}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${telemetry.completeness}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">GROUNDEDNESS:</span>
                        <span className="font-bold text-indigo-400">100%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">ZERO TRUST COMPLIANCE:</span>
                        <span className="font-bold text-emerald-400">{telemetry.safety}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${telemetry.safety}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900 space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold block">Reflection Gap Analysis</span>
                      <div className="p-2 rounded bg-black/60 border border-zinc-900 text-rose-300 text-[10px] whitespace-pre-wrap select-text">
                        {telemetry.gap !== "None" ? `[Gap Detected] ${telemetry.gap}` : "Goal fully satisfied. No gap detected."}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground italic text-center py-6">Play step to verify scorecard...</p>
                )}
              </CardContent>
            </Card>

            {/* Mission intent and constraints */}
            <Card className="bg-zinc-950/20 border-border/40 text-left font-mono">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase text-indigo-400">Intent Resolution & Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Mission Name</span>
                  <p className="text-xs text-zinc-300 font-semibold mt-1">{mission.name}</p>
                </div>

                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold block">Verifiable goals</span>
                  <div className="space-y-1 mt-1">
                    {mission.goals?.map((g: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5 items-start text-[10px] text-zinc-400">
                        <span className="text-primary font-bold shrink-0 mt-0.5">↳</span>
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {mission.constraints && mission.constraints.length > 0 && (
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold block">Hard constraints</span>
                    <div className="space-y-1 mt-1">
                      {mission.constraints.map((c: string, idx: number) => (
                        <div key={idx} className="flex gap-1.5 items-start text-[10px] text-zinc-400">
                          <span className="text-rose-500 font-bold shrink-0 mt-0.5">⚠</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-border/20 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total steps:</span>
                    <span className="font-bold text-white">{execution?.steps?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution ID:</span>
                    <span className="font-bold text-zinc-400 select-all">{execution?.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-bold text-zinc-400">
                      {execution?.durationMs ? `${(execution.durationMs / 1000).toFixed(2)}s` : "Pending"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
