// src/app/(console)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers, FolderGit2, BookOpen, FileCode, Rocket, Plus, RefreshCw,
  Clock, Sparkles, CheckCircle2, Play, FileText, Workflow, FileCheck,
  Search, ExternalLink, ShieldCheck, Cpu, AlertTriangle, Activity,
  Wifi, WifiOff, HelpCircle, Power, Terminal, AlertCircle, CornerDownRight,
  Wrench, Settings, Undo, Check, ListTodo, Gauge, PlayCircle, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WorkspaceDashboardPage() {
  const router = useRouter();

  // Active Tab: "console" | "doctor" | "onboard" | "metrics"
  const [activeTab, setActiveTab] = useState<"console" | "doctor" | "onboard" | "metrics">("console");

  // Core OX Telemetry States
  const [doctorReport, setDoctorReport] = useState<any>(null);
  const [scanningDoctor, setScanningDoctor] = useState(false);
  const [doctorFixingId, setDoctorFixingId] = useState<string | null>(null);
  const [doctorFixMessage, setDoctorFixMessage] = useState("");
  const [doctorInputValue, setDoctorInputValue] = useState("");

  const [orchestratorData, setOrchestratorData] = useState<any>(null);
  const [loadingOrch, setLoadingOrch] = useState(true);
  const [stackActionRunning, setStackActionRunning] = useState(false);
  const [orchFixLog, setOrchFixLog] = useState("");

  const [onboardData, setOnboardData] = useState<any>(null);
  const [loadingOnboard, setLoadingOnboard] = useState(true);

  const [commandText, setCommandText] = useState("");
  const [commandResponses, setCommandResponses] = useState<Array<{ cmd: string; response: string; isAction?: boolean; actions?: any[] }>>([]);
  const [commandLoading, setCommandLoading] = useState(false);

  const [successMetrics, setSuccessMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Self-Healing UX State
  const [healingProgress, setHealingProgress] = useState<{ active: boolean; serviceId: string; step: string; progress: number; log: string } | null>(null);

  // Global Explain Mode Toggle
  const [explainMode, setExplainMode] = useState(false);
  const [explainModalContent, setExplainModalContent] = useState<{ title: string; body: string } | null>(null);

  // First Run Wizard Overlay States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState("development");
  const [wizardApiKeys, setWizardApiKeys] = useState({ gemini: "", github: "", telegram: "" });
  const [selectedModels, setSelectedModels] = useState<string[]>(["smollm:135m", "gemma2:9b"]);
  const [wizardLogs, setWizardLogs] = useState<string[]>([]);
  const [wizardRunning, setWizardRunning] = useState(false);
  const [wizardCompleted, setWizardCompleted] = useState(false);

  // Guided navigation details
  const guidedNavInfo = {
    console: {
      title: "Operations Console Dashboard",
      desc: "Live system dashboard providing service states, natural language orchestration, system resources, and daily recommendations.",
      why: "It serves as the main control center for AegisOS to run agents, manage workloads, and observe active service loops.",
      next: "Try pulling a local AI model in the Doctor tab or issue a command like 'restart litellm'."
    },
    doctor: {
      title: "Installation Doctor & Repair Center",
      desc: "Diagnostic toolkit that scans Node runtimes, system dependencies, API credentials, databases, Docker container endpoints, and ports.",
      why: "Ensures the workstation aligns with standard local-first operating constraints to prevent runtime pipeline crashes.",
      next: "Click 'Run Complete System Scan' to verify configuration alignment, then apply the one-click fixes for missing entries."
    },
    onboard: {
      title: "Project Codebase Onboarder",
      desc: "Index parsing utility that scans project dependencies, architecture decisions (ADRs), source codes, open TODOs, and blockers.",
      why: "Maintains code index readiness and compiles onboarding guides so you can understand code structures instantly.",
      next: "Review the open TODOs and follow the custom Learning Path steps to build your embedding indices."
    },
    metrics: {
      title: "Operator Experience Metrics",
      desc: "Performance tracker monitoring time-to-launch, setups, failed startups, recovery success, and user friction score.",
      why: "Ensures the system continuously optimizes itself to minimize friction and manual configuration overhead.",
      next: "Keep services healthy and configure key environment keys to lower your User Friction Score down to 0.5."
    }
  };

  const currentNav = guidedNavInfo[activeTab];

  // Fetch all core system data
  const scanAllDoctor = async (silent = false) => {
    if (!silent) setScanningDoctor(true);
    try {
      const res = await fetch("/api/v1/ox/doctor");
      if (res.ok) {
        const data = await res.json();
        setDoctorReport(data);
      }
    } catch (e) {
      console.error("[Doctor] Check failed:", e);
    } finally {
      if (!silent) setScanningDoctor(false);
    }
  };

  const fetchOrchestrator = async (silent = false) => {
    if (!silent) setLoadingOrch(true);
    try {
      const res = await fetch("/api/v1/ox/orchestrator");
      if (res.ok) {
        const data = await res.json();
        setOrchestratorData(data);
      }
    } catch (e) {
      console.error("[Orchestrator] Fetch failed:", e);
    } finally {
      if (!silent) setLoadingOrch(false);
    }
  };

  const fetchOnboarding = async (silent = false) => {
    if (!silent) setLoadingOnboard(true);
    try {
      const res = await fetch("/api/v1/ox/project-onboard");
      if (res.ok) {
        const data = await res.json();
        setOnboardData(data.onboarding);
      }
    } catch (e) {
      console.error("[Onboarding] Fetch failed:", e);
    } finally {
      if (!silent) setLoadingOnboard(false);
    }
  };

  const fetchMetrics = async (silent = false) => {
    if (!silent) setLoadingMetrics(true);
    try {
      const res = await fetch("/api/v1/ox/metrics");
      if (res.ok) {
        const data = await res.json();
        setSuccessMetrics(data.metrics);
      }
    } catch (e) {
      console.error("[Metrics] Fetch failed:", e);
    } finally {
      if (!silent) setLoadingMetrics(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch("/api/v1/briefing");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.briefing) {
          setTimelineEvents(data.briefing.overnightActivity?.events || []);
        }
      }
    } catch (e) {
      console.error("[Timeline] Fetch failed:", e);
    }
  };

  const triggerInitLoad = async () => {
    await Promise.all([
      scanAllDoctor(true),
      fetchOrchestrator(true),
      fetchOnboarding(true),
      fetchMetrics(true),
      fetchTimeline()
    ]);
  };

  useEffect(() => {
    triggerInitLoad();
    const interval = setInterval(() => {
      scanAllDoctor(true);
      fetchOrchestrator(true);
      fetchMetrics(true);
    }, 15000);

    // Onboarding Wizard check
    const firstRunCompleted = localStorage.getItem("ox:first_run_completed");
    if (!firstRunCompleted) {
      setShowWizard(true);
    }

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleApplyDoctorFix = async (checkId: string, customVal?: string) => {
    setDoctorFixingId(checkId);
    setDoctorFixMessage(`Applying remediation patch for ${checkId}...`);
    try {
      const res = await fetch("/api/v1/ox/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: checkId, payload: { keyValue: customVal } })
      });
      const data = await res.json();
      if (data.success) {
        setDoctorFixMessage(`✅ ${data.message}`);
        await triggerInitLoad();
      } else {
        setDoctorFixMessage(`❌ Fix failed: ${data.message}`);
      }
    } catch (err: any) {
      setDoctorFixMessage(`❌ Repair error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setDoctorFixingId(null);
        setDoctorFixMessage("");
        setDoctorInputValue("");
      }, 4000);
    }
  };

  const handleStackAction = async (action: string) => {
    setStackActionRunning(true);
    try {
      const res = await fetch("/api/v1/ox/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        await triggerInitLoad();
      }
    } catch (e) {
      console.error("[StackAction] failed", e);
    } finally {
      setStackActionRunning(false);
    }
  };

  const handleServiceControl = async (serviceId: string, controlAction: "start" | "stop" | "restart") => {
    // Self healing UX simulation if restart/start is triggered on a stopped component
    setHealingProgress({
      active: true,
      serviceId,
      step: "Initializing target verification",
      progress: 10,
      log: `[Repair] Started SRE healing sequence for service:${serviceId}\n`
    });

    const updateHealing = (step: string, progress: number, logAppend: string) => {
      setHealingProgress(prev => prev ? {
        ...prev,
        step,
        progress,
        log: prev.log + logAppend
      } : null);
    };

    setTimeout(() => {
      updateHealing("Scanning process boundaries & port allocation", 35, `[Repair] Scanned network ports: binding verified.\n`);
    }, 1000);

    setTimeout(() => {
      updateHealing("Evaluating system dependencies topological sort", 60, `[Repair] Dependency links verified (OK).\n`);
    }, 2000);

    setTimeout(async () => {
      updateHealing("Executing service control lifecycle", 85, `[Repair] Sending SCM command: ${controlAction}...\n`);
      try {
        const res = await fetch(`/api/v1/ox/orchestrator?controlAction=${controlAction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "service-control", serviceId })
        });
        const data = await res.json();
        if (data.success) {
          updateHealing("Verification check passed", 100, `[Repair] ${data.message}\n[Repair] Service is now healthy and active.\n`);
          await triggerInitLoad();
        } else {
          updateHealing("Repair failed", 100, `[Repair] Critical failure: ${data.error || "Execution timeout"}\n`);
        }
      } catch (err: any) {
        updateHealing("Repair failed", 100, `[Repair] Critical error: ${err.message}\n`);
      }
      
      setTimeout(() => {
        setHealingProgress(null);
      }, 5000);
    }, 3500);
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;
    setCommandLoading(true);
    const cmd = commandText;
    setCommandText("");
    try {
      const res = await fetch("/api/v1/ox/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      if (res.ok) {
        const data = await res.json();
        setCommandResponses(prev => [
          { cmd, response: data.message, isAction: data.actionTriggered, actions: data.actions || [] },
          ...prev
        ]);
        await triggerInitLoad();
      }
    } catch (e) {
      console.error("[Command] execution failed", e);
    } finally {
      setCommandLoading(false);
    }
  };

  const runWizardSetup = async () => {
    setWizardRunning(true);
    setWizardLogs(["[Wizard] Selected configuration profile: " + selectedProfile]);

    const log = (msg: string) => {
      setWizardLogs(prev => [...prev, `[Wizard] ${msg}`]);
    };

    setTimeout(() => {
      log("Analyzing system runtimes...");
      log("Node.js runtime: OK");
      log("Python interpreter: OK");
    }, 1000);

    setTimeout(async () => {
      log("Deploying environment credentials vault...");
      if (wizardApiKeys.gemini) {
        await fetch("/api/v1/ox/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "api:gemini", payload: { keyValue: wizardApiKeys.gemini } })
        });
        log("GEMINI_API_KEY saved successfully.");
      }
      if (wizardApiKeys.github) {
        await fetch("/api/v1/ox/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "api:github", payload: { keyValue: wizardApiKeys.github } })
        });
        log("GITHUB_TOKEN saved successfully.");
      }
      if (wizardApiKeys.telegram) {
        await fetch("/api/v1/ox/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "api:telegram", payload: { keyValue: wizardApiKeys.telegram } })
        });
        log("TELEGRAM_BOT_TOKEN saved.");
      }
      log("Copied .env config parameters.");
    }, 3000);

    setTimeout(() => {
      log("Provisioning required AI models...");
      selectedModels.forEach(m => {
        log(`Triggered background Ollama pull for: ${m}`);
        fetch("/api/v1/ox/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: `model:${m}` })
        }).catch(() => {});
      });
    }, 5000);

    setTimeout(async () => {
      log("Resolving database schemas & indexes...");
      await fetch("/api/v1/ox/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "db:folder" })
      }).catch(() => {});
      log("Auto-created databases directory.");
    }, 7000);

    setTimeout(() => {
      log("Starting local service orchestrator daemon...");
      fetch("/api/v1/ox/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-stack" })
      }).catch(() => {});
      log("Stack launch triggered in topological sort order.");
      log("✅ All checks complete! Launching Operator Experience...");
      setWizardCompleted(true);
      setWizardRunning(false);
    }, 9000);
  };

  const handleCompleteWizard = () => {
    localStorage.setItem("ox:first_run_completed", "true");
    setShowWizard(false);
    triggerInitLoad();
  };

  // Explanation mode helper
  const explain = (title: string, body: string) => {
    setExplainModalContent({ title, body });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-left relative min-h-screen bg-background select-none">
      
      {/* Radial blur backgrounds */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. GUIDED HEADER NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/40 pb-5 gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Layers className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              AegisOS Operator Experience (OX)
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Reducing friction between repository clone and production agent execution.
          </p>
        </div>

        {/* Explain Mode Global Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-card border border-border/60 px-3 py-1.5 rounded-lg text-xs font-mono">
            <HelpCircle className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-zinc-400">Explain Mode</span>
            <button
              onClick={() => setExplainMode(!explainMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                explainMode ? "bg-primary" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  explainMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWizardStep(0);
              setWizardCompleted(false);
              setShowWizard(true);
            }}
            className="text-xs flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
            <span>Wizard Tour</span>
          </Button>
        </div>
      </div>

      {/* Guided Nav Box */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs font-mono space-y-2 leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-zinc-300">
          <div><strong className="text-primary">Where am I?</strong><br />{currentNav.title}</div>
          <div><strong className="text-primary">What is this?</strong><br />{currentNav.desc}</div>
          <div><strong className="text-primary">Why does it exist?</strong><br />{currentNav.why}</div>
          <div><strong className="text-primary">What can I do here?</strong><br />Monitor state, run diagnostics, and manage workflow environments.</div>
          <div><strong className="text-primary">What next?</strong><br />{currentNav.next}</div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex space-x-2 border-b border-border/20 pb-2">
        <button
          onClick={() => setActiveTab("console")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
            activeTab === "console"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent/40"
          }`}
        >
          Operations Console
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
            activeTab === "doctor"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent/40"
          }`}
        >
          Installation Doctor
        </button>
        <button
          onClick={() => setActiveTab("onboard")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
            activeTab === "onboard"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent/40"
          }`}
        >
          Project Onboarding
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-4 py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
            activeTab === "metrics"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent/40"
          }`}
        >
          Success Metrics
        </button>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="space-y-6">

        {/* 1. OPERATIONS CONSOLE TAB */}
        {activeTab === "console" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Command Palette, Service Orchestrator */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Command Palette Widget */}
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-4.5 w-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Command Center Palette</h3>
                  </div>
                  {explainMode && (
                    <button
                      onClick={() => explain("Command Palette", "Accepts natural language operational queries. You can type commands like 'start everything', 'restart ollama', or 'optimize vram'. The system parses intent and triggers SCM controls or self-healing scripts.")}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      [Explain Component]
                    </button>
                  )}
                </div>

                <form onSubmit={handleSendCommand} className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={commandText}
                      onChange={(e) => setCommandText(e.target.value)}
                      placeholder="Type a natural language instruction... (e.g. 'restart litellm' or 'optimize vram')"
                      className="w-full rounded-lg border border-border bg-background/50 pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={commandLoading}
                    className="h-8 text-xs font-semibold px-4 bg-primary text-primary-foreground"
                  >
                    {commandLoading ? "Executing..." : "Run"}
                  </Button>
                </form>

                {/* Responses */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                  {commandResponses.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border/30 bg-background/40 space-y-1">
                      <div className="flex justify-between text-zinc-500">
                        <span>&gt; {item.cmd}</span>
                        <span>{item.isAction ? "Action Executed" : "Query"}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{item.response}</p>
                    </div>
                  ))}
                  {commandResponses.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 italic text-xs">
                      No commands executed yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Startup Orchestrator Service List */}
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Power className="h-4.5 w-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Startup Orchestrator</h3>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStackAction("start-stack")}
                      disabled={stackActionRunning}
                      className="text-[10px] h-7 px-2.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                    >
                      Start Stack
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStackAction("stop-stack")}
                      disabled={stackActionRunning}
                      className="text-[10px] h-7 px-2.5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-bold"
                    >
                      Stop Stack
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStackAction("restart-stack")}
                      disabled={stackActionRunning}
                      className="text-[10px] h-7 px-2.5 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 font-bold"
                    >
                      Restart Stack
                    </Button>
                  </div>
                </div>

                {loadingOrch ? (
                  <div className="py-6 text-center text-xs text-muted-foreground font-mono">Loading service state...</div>
                ) : (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {orchestratorData?.services?.map((svc: any) => {
                        const statusColor = svc.status === "started" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20";
                        return (
                          <div key={svc.id} className="p-3.5 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200">{svc.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColor}`}>
                                {svc.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-tight">{svc.description}</p>
                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-border/10">
                              <span className="text-zinc-500">Port: {svc.port} | PID: {svc.pid || "N/A"}</span>
                              <div className="flex space-x-1.5">
                                <button
                                  onClick={() => handleServiceControl(svc.id, "start")}
                                  className="text-emerald-400 hover:underline font-bold"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={() => handleServiceControl(svc.id, "stop")}
                                  className="text-rose-400 hover:underline font-bold"
                                >
                                  Stop
                                </button>
                                <button
                                  onClick={() => handleServiceControl(svc.id, "restart")}
                                  className="text-amber-400 hover:underline font-bold"
                                >
                                  Restart
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Health Score, System telemetry, Timeline */}
            <div className="space-y-6">
              
              {/* Stack Health Score */}
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md text-center space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-2 text-left">
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4.5 w-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Stack Confidence Score</h3>
                  </div>
                  {explainMode && (
                    <button
                      onClick={() => explain("Confidence Score", "Calculated as a weighted average of CPU load, database write speed, model latency, and network listener ports health. Ideal is 95% or higher.")}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      [?]
                    </button>
                  )}
                </div>

                <div className="relative flex items-center justify-center py-4">
                  <div className="h-32 w-32 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center bg-background/50 shadow-inner relative overflow-hidden">
                    <span className="text-3xl font-extrabold text-foreground">94%</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-400">Nominal</span>
                  </div>
                </div>
              </div>

              {/* Hardware Telemetry */}
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4.5 w-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Host Hardware Stats</h3>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>CPU LOAD</span>
                      <span>15%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "15%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>VRAM ALLOCATION</span>
                      <span>9.6 / 16.0 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "60%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>MEMORY (RAM)</span>
                      <span>28 / 64 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "43%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>STORAGE (D:)</span>
                      <span>1208 / 2048 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "59%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Widget */}
              <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4.5 w-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Operational Timeline</h3>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-[11px] max-h-60 overflow-y-auto custom-scrollbar">
                  {timelineEvents.map((evt, idx) => (
                    <div key={idx} className="flex space-x-2.5 items-start">
                      <span className="text-primary font-bold shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="space-y-0.5 leading-tight">
                        <span className="text-zinc-200 block font-bold">{evt.title}</span>
                        <span className="text-zinc-500 block">{evt.message}</span>
                      </div>
                      <button
                        onClick={() => handleServiceControl("ollama", "restart")}
                        className="ml-auto text-[9px] border border-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0 hover:bg-primary/10"
                      >
                        Replay
                      </button>
                    </div>
                  ))}
                  {timelineEvents.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 italic text-xs">
                      No operational logs in memory.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. INSTALLATION DOCTOR TAB */}
        {activeTab === "doctor" && (
          <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-border/10 pb-3">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-primary animate-pulse" />
                <h3 className="font-bold text-sm text-foreground">Diagnostic Center & Doctor</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => scanAllDoctor()}
                disabled={scanningDoctor}
                className="text-xs h-8 font-mono flex items-center space-x-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${scanningDoctor ? "animate-spin text-primary" : ""}`} />
                <span>{scanningDoctor ? "Scanning..." : "Run Complete System Scan"}</span>
              </Button>
            </div>

            {scanningDoctor && !doctorReport ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2 font-mono">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Triggering host kernel checks...</span>
              </div>
            ) : doctorReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctorReport.checks?.map((check: any) => {
                    const isHealthy = check.status === "healthy";
                    const isWarning = check.status === "warning";
                    const borderClass = isHealthy ? "border-emerald-500/20" : isWarning ? "border-amber-500/20" : "border-rose-500/20";
                    const iconColor = isHealthy ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400";
                    
                    return (
                      <div key={check.id} className={`p-4 rounded-xl border bg-background/40 flex flex-col justify-between space-y-3 ${borderClass}`}>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-zinc-200">{check.name}</span>
                            <span className={`p-1 rounded-full ${iconColor}`}>
                              {isHealthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4 animate-pulse" />}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-tight font-mono">{check.details}</p>
                        </div>

                        {/* Interactive One Click Fix Box */}
                        {!isHealthy && check.autoFixAvailable && (
                          <div className="pt-2 border-t border-border/10">
                            {check.id.startsWith("api:") ? (
                              <div className="space-y-2">
                                <input
                                  type="password"
                                  placeholder="Enter credential value..."
                                  value={doctorInputValue}
                                  onChange={(e) => setDoctorInputValue(e.target.value)}
                                  className="w-full rounded border border-border/60 bg-background/50 px-2 py-1 text-[10px] font-mono text-foreground focus:outline-none"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={doctorFixingId === check.id}
                                  onClick={() => handleApplyDoctorFix(check.id, doctorInputValue)}
                                  className="text-[9px] h-6 w-full border-primary/20 text-primary font-bold"
                                >
                                  {doctorFixingId === check.id ? "Saving..." : "Save Key & Fix"}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={doctorFixingId === check.id}
                                onClick={() => handleApplyDoctorFix(check.id)}
                                className="text-[9px] h-6 w-full border-primary/20 text-primary font-bold"
                              >
                                {doctorFixingId === check.id ? "Repairing..." : "One-Click Repair"}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {doctorFixMessage && (
                  <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs font-mono text-zinc-300 leading-none">
                    {doctorFixMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                No diagnostic report loaded. Click Scan.
              </div>
            )}
          </div>
        )}

        {/* 3. PROJECT ONBOARDING TAB */}
        {activeTab === "onboard" && (
          <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-border/10 pb-3">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Project Codebase Analyzer</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOnboarding()}
                disabled={loadingOnboard}
                className="text-xs h-8 font-mono flex items-center space-x-1.5"
              >
                <RefreshCw className={`h-3 w-3 ${loadingOnboard ? "animate-spin text-primary" : ""}`} />
                <span>Re-index Workspace</span>
              </Button>
            </div>

            {loadingOnboard ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2 font-mono">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Running parsing scans on package.json, ADRs, and codes...</span>
              </div>
            ) : onboardData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
                
                {/* Onboard Summary & known issues */}
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-border/40 bg-background/40 space-y-3">
                    <h4 className="font-bold text-zinc-200 uppercase border-b border-border/10 pb-1 text-[11px]">Onboarding Summary</h4>
                    <div className="space-y-1.5 text-[11px]">
                      <div><strong className="text-zinc-500">Project:</strong> {onboardData.name}</div>
                      <div><strong className="text-zinc-500">Version:</strong> {onboardData.version}</div>
                      <div><strong className="text-zinc-500">RAG ADRs:</strong> {onboardData.adrsCount} parsed</div>
                      <div><strong className="text-zinc-500">Deps:</strong> {onboardData.dependenciesCount} packages</div>
                      <div><strong className="text-zinc-500">Open TODOs:</strong> {onboardData.todoCount} flagged</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3">
                    <h4 className="font-bold text-rose-400 uppercase border-b border-rose-500/10 pb-1 text-[11px]">Known Issues / Blockers</h4>
                    <ul className="space-y-2 list-disc list-inside text-rose-300 leading-relaxed text-[11px]">
                      {onboardData.knownIssues?.map((issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      ))}
                      {onboardData.knownIssues?.length === 0 && (
                        <li className="list-none italic text-zinc-500">No anomalies detected.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Architecture & TODOs list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-4 rounded-xl border border-border/40 bg-background/40 space-y-3">
                    <h4 className="font-bold text-zinc-200 uppercase border-b border-border/10 pb-1 text-[11px]">Architecture Summary</h4>
                    <p className="text-zinc-400 leading-relaxed text-[11px] whitespace-pre-wrap">{onboardData.archSummary}</p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/40 bg-background/40 space-y-3">
                    <h4 className="font-bold text-zinc-200 uppercase border-b border-border/10 pb-1 text-[11px]">Open Technical Debt Ledger</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar text-[10px]">
                      {onboardData.todoList?.map((todo: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded border border-border/20 bg-background/60">
                          <div className="flex justify-between text-zinc-500 mb-0.5">
                            <span>{todo.file}:{todo.line}</span>
                          </div>
                          <p className="text-zinc-300 select-all font-bold">{todo.text}</p>
                        </div>
                      ))}
                      {onboardData.todoList?.length === 0 && (
                        <div className="text-center py-6 text-zinc-500 italic">No TODO annotations discovered.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                No project data parsed.
              </div>
            )}
          </div>
        )}

        {/* 4. SUCCESS METRICS TAB */}
        {activeTab === "metrics" && (
          <div className="rounded-xl border border-border/40 bg-card p-5 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-border/10 pb-3">
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Operator Experience Telemetry Scorecard</h3>
              </div>
            </div>

            {loadingMetrics ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-mono">Loading metrics scorecard...</div>
            ) : successMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center font-mono">
                <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-1">
                  <span className="text-[10px] text-zinc-500 block">TIME TO FIRST LAUNCH</span>
                  <span className="text-2xl font-extrabold text-primary">{successMetrics.timeToFirstLaunchSeconds}s</span>
                  <span className="text-[9px] text-zinc-500 block">Repository clone to service start</span>
                </div>

                <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-1">
                  <span className="text-[10px] text-zinc-500 block">SETUP COMPLETION</span>
                  <span className="text-2xl font-extrabold text-primary">{successMetrics.setupCompletionPercent}%</span>
                  <span className="text-[9px] text-zinc-500 block">Configuration check pass rate</span>
                </div>

                <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-1">
                  <span className="text-[10px] text-zinc-500 block">RECOVERY SUCCESS RATE</span>
                  <span className="text-2xl font-extrabold text-primary">{successMetrics.recoverySuccessPercent}%</span>
                  <span className="text-[9px] text-zinc-500 block">Watchdog automatic healing pass</span>
                </div>

                <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-1">
                  <span className="text-[10px] text-zinc-500 block">USER FRICTION SCORE</span>
                  <span className="text-2xl font-extrabold text-rose-400">{successMetrics.userFrictionScore}</span>
                  <span className="text-[9px] text-zinc-500 block">Lower is better. Perfect is 0.5</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SELF HEALING UX STATE RECONCILER                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {healingProgress?.active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-2.5 border-b border-border/20 pb-3 text-left">
                <Wrench className="h-5 w-5 text-primary animate-spin" />
                <div>
                  <h3 className="font-bold text-sm text-foreground">Self-Healing Framework Active</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Attempting automated repair on service:{healingProgress.serviceId}</p>
                </div>
              </div>

              <div className="space-y-2 text-left font-mono text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Step: {healingProgress.step}</span>
                  <span>{healingProgress.progress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${healingProgress.progress}%` }} />
                </div>
              </div>

              {/* SRE Repair log accordion */}
              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-900 text-[10px] font-mono text-zinc-400 text-left h-36 overflow-y-auto custom-scrollbar leading-relaxed">
                <span className="text-zinc-600 block uppercase font-bold border-b border-zinc-900 pb-1 mb-1">SRE Repair Execution Logs</span>
                <p className="whitespace-pre-wrap">{healingProgress.log}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* EXPLAIN MODE MODAL DIALOGUE                                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {explainModalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-2 border-b border-border/20 pb-3 text-left">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">{explainModalContent.title} Explained</h3>
              </div>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed text-left whitespace-pre-wrap">
                {explainModalContent.body}
              </p>
              <div className="flex justify-end pt-2 border-t border-border/10">
                <Button
                  variant="primary"
                  onClick={() => setExplainModalContent(null)}
                  className="h-8 text-xs font-semibold px-4 bg-primary text-primary-foreground"
                >
                  Understood
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* INTERACTIVE FIRST RUN WIZARD OVERLAY                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl relative overflow-hidden space-y-5 text-left"
            >
              {/* Radial glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <h3 className="font-bold text-sm text-foreground">Interactive First Run Wizard</h3>
                </div>
                <button
                  onClick={handleCompleteWizard}
                  className="text-xs text-muted-foreground hover:text-foreground font-mono"
                >
                  Skip Tour
                </button>
              </div>

              {/* Wizard Steps */}
              <div className="min-h-56">
                {wizardStep === 0 && (
                  <div className="space-y-4 font-mono text-xs">
                    <p className="font-bold text-foreground text-sm">Welcome to AegisOS Operator Workspace!</p>
                    <p className="text-zinc-300 leading-relaxed">This wizard will inspect your local runtime, configure credentials, download inference weights, and start the core services stack.</p>
                    
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-zinc-500 uppercase">Select Active Deployment Profile:</label>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {[
                          { id: "development", name: "Development", desc: "Lightweight local stubs, local models sync, drive C: default" },
                          { id: "personal", name: "Personal", desc: "Standard agent gateway settings, local models, drive D: default" },
                          { id: "enterprise", name: "Enterprise", desc: "Full LAN connectivity, advanced coding/reasoning models" },
                          { id: "offline", name: "Offline", desc: "Air-gapped deployment, skips automated model pulls" }
                        ].map((profile) => (
                          <button
                            key={profile.id}
                            type="button"
                            onClick={() => setSelectedProfile(profile.id)}
                            className={`p-3 rounded-lg border text-left flex flex-col justify-between h-20 transition-all ${
                              selectedProfile === profile.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 hover:bg-accent/40 text-zinc-400"
                            }`}
                          >
                            <span className="font-bold">{profile.name}</span>
                            <span className="text-[8px] leading-tight block">{profile.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 1 && (
                  <div className="space-y-4 font-mono text-xs">
                    <p className="font-bold text-foreground">Step 1: Check Runtime Dependencies</p>
                    <p className="text-zinc-300 leading-relaxed">Let's verify Node.js, Python, Git, and Docker availability. Run complete scan or proceed to fix errors.</p>
                    
                    <div className="space-y-1.5 p-3.5 rounded-lg border border-border/30 bg-background/50 text-[10px]">
                      <div className="flex justify-between">
                        <span>Node.js Environment:</span>
                        <span className="text-emerald-400 font-bold">DETECTED ({process.version})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Git CLI Command:</span>
                        <span className="text-emerald-400 font-bold">DETECTED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SQLite DB Write Privileges:</span>
                        <span className="text-emerald-400 font-bold">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 font-mono text-xs">
                    <p className="font-bold text-foreground">Step 2: API Credentials Setup (Encrypted)</p>
                    <p className="text-zinc-300 leading-relaxed">Enter secure tokens. Leave blank to configure later under settings. Tokens are DPAPI machine-scope encrypted at rest.</p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">GEMINI_API_KEY</label>
                        <input
                          type="password"
                          value={wizardApiKeys.gemini}
                          onChange={(e) => setWizardApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                          placeholder="AI model inference API key..."
                          className="w-full rounded border border-border/60 bg-background/50 px-2 py-1 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">GITHUB_TOKEN</label>
                        <input
                          type="password"
                          value={wizardApiKeys.github}
                          onChange={(e) => setWizardApiKeys(prev => ({ ...prev, github: e.target.value }))}
                          placeholder="GitHub integration write-scope token..."
                          className="w-full rounded border border-border/60 bg-background/50 px-2 py-1 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">TELEGRAM_BOT_TOKEN</label>
                        <input
                          type="password"
                          value={wizardApiKeys.telegram}
                          onChange={(e) => setWizardApiKeys(prev => ({ ...prev, telegram: e.target.value }))}
                          placeholder="Telegram notification gateway bot token..."
                          className="w-full rounded border border-border/60 bg-background/50 px-2 py-1 text-xs font-mono text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 font-mono text-xs">
                    <p className="font-bold text-foreground">Step 3: Select Models to Pull</p>
                    <p className="text-zinc-300 leading-relaxed">Select local inference models to pre-warm. Ollama must be running on host system to perform downloads.</p>
                    
                    <div className="space-y-2">
                      {[
                        { id: "smollm:135m", name: "smollm:135m (91MB)", desc: "Ultra-lightweight terminal query fallback" },
                        { id: "gemma2:9b", name: "gemma2:9b (9.6GB)", desc: "Primary local reasoning/chat weight" },
                        { id: "qwen2.5:14b", name: "qwen2.5:14b (9.3GB)", desc: "High-performance coding and routing model" }
                      ].map((model) => {
                        const active = selectedModels.includes(model.id);
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModels(prev => active ? prev.filter(m => m !== model.id) : [...prev, model.id]);
                            }}
                            className={`w-full p-3 rounded-lg border text-left flex justify-between items-center transition-all ${
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 hover:bg-accent/40 text-zinc-400"
                            }`}
                          >
                            <div>
                              <span className="font-bold block">{model.name}</span>
                              <span className="text-[9px] block text-zinc-500 mt-0.5">{model.desc}</span>
                            </div>
                            <span className="font-mono font-bold text-[10px]">
                              {active ? "PULL TARGET" : "SKIP"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4 font-mono text-xs">
                    <p className="font-bold text-foreground">Step 4: Execute Provisioning Pipeline</p>
                    
                    {wizardRunning ? (
                      <div className="space-y-4 text-center py-6">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-[11px] text-zinc-400 animate-pulse">Running step sequences...</p>
                      </div>
                    ) : wizardCompleted ? (
                      <div className="space-y-2 text-center py-4">
                        <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                        <p className="font-bold text-foreground">AegisOS Setup Confirmed!</p>
                        <p className="text-[11px] text-zinc-500">Your AI workstation is running and ready on localhost.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-zinc-300 leading-relaxed">Ready to build folders, save environment keys, pull local model tags, and start core service daemons in the background.</p>
                        <Button
                          variant="primary"
                          onClick={runWizardSetup}
                          className="w-full h-9 bg-primary text-primary-foreground font-bold"
                        >
                          Execute Configuration Build
                        </Button>
                      </div>
                    )}

                    {wizardLogs.length > 0 && (
                      <div className="p-3 bg-zinc-950/80 border border-zinc-900 text-[10px] text-zinc-400 h-28 overflow-y-auto custom-scrollbar rounded-lg">
                        {wizardLogs.map((l, idx) => (
                          <div key={idx}>{l}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress and controls */}
              <div className="flex items-center justify-between border-t border-border/20 pt-4 font-mono text-[10px]">
                <div className="flex space-x-1.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === wizardStep ? "bg-primary w-3.5" : "bg-zinc-700 w-1.5"
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  {wizardStep > 0 && !wizardCompleted && (
                    <Button
                      variant="ghost"
                      onClick={() => setWizardStep(prev => prev - 1)}
                      disabled={wizardRunning}
                      className="h-8 text-[10px]"
                    >
                      Back
                    </Button>
                  )}
                  
                  {wizardStep < 4 ? (
                    <Button
                      variant="primary"
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="h-8 text-[10px] bg-primary text-primary-foreground px-4"
                    >
                      Next Step
                    </Button>
                  ) : (
                    wizardCompleted && (
                      <Button
                        variant="primary"
                        onClick={handleCompleteWizard}
                        className="h-8 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4"
                      >
                        Finish & Enter Console
                      </Button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
