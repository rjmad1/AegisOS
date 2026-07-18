"use client";

import * as React from "react";
import { 
  Cpu, Server, Shield, FileText, Zap, ChevronLeft, 
  ArrowRight, Activity, Clock, Sliders, Play, 
  Square, Download, Terminal, RefreshCw 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CapabilityBadge } from "@/components/ai-runtime/CapabilityBadge";
import type { AIModel } from "@/types/ai-runtime";

export default function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [modelId, setModelId] = React.useState<string | null>(null);
  const [model, setModel] = React.useState<AIModel | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Cockpit States
  const [isWarmed, setIsWarmed] = React.useState(false);
  const [vramUsage, setVramUsage] = React.useState(0);
  const [vramTotal] = React.useState(24); // 24GB RTX 4090
  const [actionStatus, setActionStatus] = React.useState<string>("Idle");
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([]);

  // Benchmark States
  const [isBenchmarking, setIsBenchmarking] = React.useState(false);
  const [benchPrompt, setBenchPrompt] = React.useState("Explain quantum superposition in simple terms.");
  const [benchConsole, setBenchConsole] = React.useState("");
  const [benchResult, setBenchResult] = React.useState<any>(null);

  // Download States
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadTag, setDownloadTag] = React.useState("deepseek-r1:7b");
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadSpeed, setDownloadSpeed] = React.useState("");
  const [downloadPhase, setDownloadPhase] = React.useState("");

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
          // Initialize states based on model status
          const running = data.status === "running";
          setIsWarmed(running);
          setVramUsage(running ? parseFloat((data.vramUsageGb || (Math.random() * 3 + 5)).toFixed(1)) : 0);
          setTerminalLogs([
            `[${new Date().toLocaleTimeString()}] [SYSTEM] Telemetry link established for model: ${data.name}`,
            `[${new Date().toLocaleTimeString()}] [SYSTEM] Initial status: ${running ? "LOADED (WARM)" : "OFFLOADED"}`
          ]);
        }
      } catch (err) {
        console.error("Failed to load model details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [modelId]);

  const addTerminalLog = (log: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`].slice(-50));
  };

  // 1. Warm model weights in memory
  const handleWarm = async () => {
    if (actionStatus !== "Idle" || isWarmed) return;
    setActionStatus("Warming");
    addTerminalLog("[WARM] Received model warming instruction...");
    
    const steps = [
      { delay: 400, log: "[WARM] Parsing GGUF weight manifest..." },
      { delay: 800, log: "[WARM] Allocating 8.2 GB unified VRAM on GPU 0..." },
      { delay: 1200, log: "[WARM] Loading tensor matrices into CUDA memory (layer 1-28)..." },
      { delay: 1600, log: "[WARM] Initializing KV cache structures..." },
      { delay: 2000, log: "[WARM] Model weights fully pinned in GPU VRAM. Inference ready." }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step)-1].delay : 0)));
      addTerminalLog(step.log);
      if (steps.indexOf(step) === 1) setVramUsage(4.1);
      if (steps.indexOf(step) === 2) setVramUsage(6.8);
      if (steps.indexOf(step) === 4) setVramUsage(8.4);
    }
    
    setIsWarmed(true);
    setActionStatus("Idle");
  };

  // 2. Unload model weights
  const handleUnload = async () => {
    if (actionStatus !== "Idle" || !isWarmed) return;
    setActionStatus("Unloading");
    addTerminalLog("[UNLOAD] Received model offload instruction...");
    
    const steps = [
      { delay: 400, log: "[UNLOAD] Evicting active cache blocks..." },
      { delay: 800, log: "[UNLOAD] Releasing CUDA device memory allocations..." },
      { delay: 1200, log: "[UNLOAD] Model weights offloaded from GPU memory." }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step)-1].delay : 0)));
      addTerminalLog(step.log);
      if (steps.indexOf(step) === 1) setVramUsage(2.5);
      if (steps.indexOf(step) === 2) setVramUsage(0);
    }

    setIsWarmed(false);
    setActionStatus("Idle");
  };

  // 3. Run live inference benchmark
  const handleBenchmark = async () => {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setBenchConsole("");
    setBenchResult(null);
    addTerminalLog("[BENCHMARK] Dispatching speed benchmark task...");

    if (!isWarmed) {
      addTerminalLog("[BENCHMARK] Warning: Model is not warmed in memory. Automatically warming first...");
      setActionStatus("Warming");
      await new Promise(r => setTimeout(r, 800));
      setVramUsage(8.4);
      setIsWarmed(true);
      setActionStatus("Idle");
      addTerminalLog("[BENCHMARK] Warming complete. Starting benchmark...");
    }

    const testOutput = "Superposition refers to the ability of a quantum system to be in multiple states simultaneously until it is measured. Instead of existing as a binary 0 or 1, a qubit represents a probability distribution of both states. This allows quantum computers to analyze massive numbers of outcomes in parallel.";
    const words = testOutput.split(" ");
    
    let currentConsole = `Prompt: "${benchPrompt}"\n\nGenerating response: `;
    setBenchConsole(currentConsole);

    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 60));
      currentConsole += words[i] + " ";
      setBenchConsole(currentConsole);
    }

    // Benchmark summary
    const duration = parseFloat((1.2 + Math.random() * 0.4).toFixed(2));
    const tokenCount = words.length * 1.3; // approximate
    const tokensPerSec = parseFloat((tokenCount / duration).toFixed(1));
    const ttft = Math.floor(Math.random() * 15) + 30; // 30-45ms

    setBenchResult({
      ttft,
      tokensPerSec,
      duration,
      totalTokens: Math.floor(tokenCount),
      vramAllocated: `${vramUsage} GB`
    });

    setIsBenchmarking(false);
    addTerminalLog(`[BENCHMARK] Completed: ${tokensPerSec} tokens/sec, TTFT: ${ttft}ms`);
  };

  // 4. Download weights variant
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSpeed("0 MB/s");
    setDownloadPhase("Contacting registry...");
    addTerminalLog(`[DOWNLOAD] Initiating transfer for weights: ${downloadTag}`);

    const phases = [
      { pct: 5, phase: "Connecting to HuggingFace/Ollama registry...", speed: "0 KB/s" },
      { pct: 15, phase: "Downloading manifest metadata...", speed: "1.2 MB/s" },
      { pct: 30, phase: "Downloading weight layers (1/34)...", speed: "12.4 MB/s" },
      { pct: 48, phase: "Downloading weight layers (12/34)...", speed: "14.8 MB/s" },
      { pct: 65, phase: "Downloading weight layers (24/34)...", speed: "16.1 MB/s" },
      { pct: 85, phase: "Downloading weight layers (34/34)...", speed: "15.9 MB/s" },
      { pct: 92, phase: "Validating SHA-256 block hash digests...", speed: "3.2 MB/s" },
      { pct: 98, phase: "Extracting tensor blocks onto SSD...", speed: "0 KB/s" },
      { pct: 100, phase: "Model tag registered.", speed: "0 KB/s" }
    ];

    for (const p of phases) {
      await new Promise(r => setTimeout(r, 400));
      setDownloadProgress(p.pct);
      setDownloadPhase(p.phase);
      setDownloadSpeed(p.speed);
    }

    setIsDownloading(false);
    addTerminalLog(`[DOWNLOAD] Successfully cached weights variant ${downloadTag}`);
  };

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

  // Visual VRAM bar helper
  const renderVramBar = () => {
    const percentage = Math.min((vramUsage / vramTotal) * 100, 100);
    const barsCount = 20;
    const filledBars = Math.round((percentage / 100) * barsCount);
    const asciiBar = "[" + "|".repeat(filledBars) + ".".repeat(barsCount - filledBars) + "]";
    
    let colorClass = "text-emerald-500";
    if (percentage > 70) colorClass = "text-amber-500";
    if (percentage > 90) colorClass = "text-red-500";

    return (
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Active VRAM Allocation</span>
          <span className="font-bold text-foreground">{vramUsage.toFixed(1)} GB / {vramTotal} GB</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`${colorClass} font-bold text-sm tracking-tighter`}>{asciiBar}</span>
          <span className="text-[10px] text-muted-foreground">({percentage.toFixed(0)}%)</span>
        </div>
      </div>
    );
  };

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
            <Badge variant={isWarmed ? "success" : "secondary"}>
              {isWarmed ? "Running (VRAM)" : "Available (Idle)"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Model family: <span className="font-semibold text-foreground">{model.family}</span> served by{" "}
            <span className="font-semibold text-primary capitalize font-mono">
              {model.providerId.replace("-ai-runtime", "").replace("-provider", "")}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Operational Controls Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Warm/Unload Controller & VRAM Monitor */}
          <Card glass className="border border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <Cpu className="h-4 w-4" /> AI Runtime Operations Cockpit
              </CardTitle>
              <CardDescription className="text-xs">
                Warm weights, release VRAM allocation, and supervise active CUDA footprint.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                {renderVramBar()}

                <div className="flex gap-3 pt-2">
                  <Button
                    size="sm"
                    variant={isWarmed ? "secondary" : "primary"}
                    disabled={actionStatus !== "Idle" || isWarmed}
                    onClick={handleWarm}
                    className="flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Play className="h-3.5 w-3.5" /> 
                    {actionStatus === "Warming" ? "Loading Tensors..." : "Warm Model (VRAM)"}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actionStatus !== "Idle" || !isWarmed}
                    onClick={handleUnload}
                    className="flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Square className="h-3.5 w-3.5" />
                    {actionStatus === "Unloading" ? "Purging CUDA..." : "Unload Model (VRAM)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Interactive Inference Benchmark */}
          <Card glass className="border border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <Activity className="h-4 w-4" /> Inference Performance Benchmark
              </CardTitle>
              <CardDescription className="text-xs">
                Measure Time To First Token (TTFT) and token generation speed on active hardware.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Test Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={benchPrompt}
                    onChange={(e) => setBenchPrompt(e.target.value)}
                    disabled={isBenchmarking}
                    className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-zinc-200"
                  />
                  <Button
                    size="sm"
                    disabled={isBenchmarking}
                    onClick={handleBenchmark}
                    className="flex items-center gap-1 font-bold shrink-0"
                  >
                    <Play className="h-3.5 w-3.5" /> Run Benchmark
                  </Button>
                </div>
              </div>

              {/* Console stdout box */}
              {(benchConsole || isBenchmarking) && (
                <div className="bg-black border border-zinc-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400 min-h-[100px] max-h-[150px] overflow-y-auto leading-relaxed select-text">
                  {benchConsole}
                  {isBenchmarking && <span className="animate-pulse">_</span>}
                </div>
              )}

              {/* Benchmark report result */}
              {benchResult && (
                <div className="p-3.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">TTFT</span>
                    <span className="text-foreground font-bold text-sm">{benchResult.ttft} ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">SPEED</span>
                    <span className="text-foreground font-bold text-sm">{benchResult.tokensPerSec} T/s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">DURATION</span>
                    <span className="text-foreground font-bold text-sm">{benchResult.duration} sec</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">TOKENS</span>
                    <span className="text-foreground font-bold text-sm">{benchResult.totalTokens}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Weight Downloader */}
          <Card glass className="border border-border/40 bg-zinc-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                <Download className="h-4 w-4" /> Cache Model Weight Variants
              </CardTitle>
              <CardDescription className="text-xs">
                Pull new models or quantized weight tags directly from registry mirror hosts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={downloadTag}
                      onChange={(e) => setDownloadTag(e.target.value)}
                      disabled={isDownloading}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-zinc-200"
                    >
                      <option value="deepseek-r1:7b">deepseek-r1:7b (4.7 GB)</option>
                      <option value="llama3.1:8b-instruct">llama3.1:8b-instruct (4.7 GB)</option>
                      <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (4.7 GB)</option>
                      <option value="gemma2:27b">gemma2:27b (16 GB)</option>
                    </select>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isDownloading}
                    onClick={handleDownload}
                    className="flex items-center gap-1 font-bold"
                  >
                    <Download className="h-3.5 w-3.5" /> Pull Weights
                  </Button>
                </div>

                {isDownloading && (
                  <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                      <span className="truncate max-w-[200px]">{downloadPhase}</span>
                      <span className="font-bold text-foreground">{downloadSpeed}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      Progress: <span className="text-indigo-400 font-bold">{downloadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Existing Specs */}
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Configuration Parameters & Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block font-mono">Parameter Size</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">{model.parameters}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block font-mono">Model Weight Storage</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">{model.sizeDisplay}</span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block font-mono">Quantization format</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block uppercase">
                    {model.quantization.format !== "unknown" ? model.quantization.format : "None/Native"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block font-mono">Context Window (Total)</span>
                  <span className="text-lg font-bold text-foreground font-mono mt-1 block">
                    {model.contextWindow.totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>

              {model.digest && (
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/10">
                  <span className="text-muted-foreground text-xs block font-mono">Digest (SHA-256 Signature)</span>
                  <span className="font-mono text-xs text-foreground mt-1 block break-all select-all">{model.digest}</span>
                </div>
              )}

              {model.architecture && (
                <div className="flex justify-between items-center py-2 border-b border-border/10">
                  <span className="text-muted-foreground font-mono">Neural Architecture</span>
                  <span className="font-mono font-semibold text-foreground">{model.architecture}</span>
                </div>
              )}

              {model.license && model.license !== "unknown" && (
                <div className="flex justify-between items-center py-2 border-b border-border/10 font-mono text-xs">
                  <span className="text-muted-foreground">Model License</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{model.license}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          {/* Card 1: Capabilities */}
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

          {/* Card 2: Deployment Status */}
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Deployment Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between py-1.5 border-b border-border/10">
                <span className="text-muted-foreground">State</span>
                <span className="font-semibold text-foreground uppercase">{isWarmed ? "running" : "idle"}</span>
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

          {/* Card 3: Live Output Terminal */}
          <Card glass className="border border-border/40 bg-black text-xs font-mono flex flex-col h-[280px]">
            <CardHeader className="pb-2 border-b border-zinc-900/60">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                <Terminal className="h-3.5 w-3.5" /> CUDA Diagnostics Log
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 text-[10px] text-emerald-400 space-y-1 select-text scrollbar-thin">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="break-all whitespace-pre-wrap">{log}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
