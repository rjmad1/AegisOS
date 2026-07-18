// src/app/(console)/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Layers, FolderGit2, BookOpen, FileCode, Rocket, Plus, RefreshCw,
  Clock, Sparkles, CheckCircle2, Play, FileText, Workflow, FileCheck,
  Search, ExternalLink, ShieldCheck, Cpu, AlertTriangle, Activity,
  Wifi, WifiOff, HelpCircle, Power, Terminal, AlertCircle, CornerDownRight
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { LiveWorkspaceHealth } from "@/components/workspace/LiveWorkspaceHealth";
import { ChiefOfStaff } from "@/components/workspace/ChiefOfStaff";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function WorkspaceDashboardPage() {
  const router = useRouter();
  const {
    workspaces,
    activeWorkspaceId,
    createWorkspace,
    projects,
    importRepository,
    knowledgeDocs,
    importDocument,
    triggerKnowledgeBuild,
    isIndexing,
    artifacts,
    missions,
    createMission
  } = useWorkspaceStore();

  // Network offline state
  const [isOnline, setIsOnline] = useState(true);

  // Onboarding Wizard states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Dynamic briefing telemetry
  const [briefing, setBriefing] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(true);

  // Action modals
  const [showWsModal, setShowWsModal] = useState(false);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);

  // Form states
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<"markdown" | "pdf" | "code">("markdown");
  const [docContent, setDocContent] = useState("");
  const [missionTitle, setMissionTitle] = useState("");
  const [missionPack, setMissionPack] = useState("Security Audit Pack");
  const [missionGoal, setMissionGoal] = useState("");

  // Approval status state
  const [decisionLoading, setDecisionLoading] = useState<Record<string, boolean>>({});

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Fetch Workspace Briefing
  const fetchBriefingData = async () => {
    try {
      const res = await fetch("/api/v1/briefing");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBriefing(data.briefing);
        }
      }
    } catch (e) {
      console.error("[Dashboard] Briefing load failed", e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load briefing data
    fetchBriefingData();
    const interval = setInterval(fetchBriefingData, 10000);

    // Onboarding trigger
    const onboardingCompleted = localStorage.getItem("onboarding:completed");
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleCreateWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    await createWorkspace({ name: wsName, description: wsDesc });
    setWsName("");
    setWsDesc("");
    setShowWsModal(false);
    fetchBriefingData();
    if (showOnboarding && onboardingStep === 1) setOnboardingStep(2);
  };

  const handleImportRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !repoUrl.trim()) return;
    await importRepository({ name: repoName, repositoryUrl: repoUrl });
    setRepoName("");
    setRepoUrl("");
    setShowRepoModal(false);
    fetchBriefingData();
    if (showOnboarding && onboardingStep === 2) setOnboardingStep(3);
  };

  const handleImportDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    await importDocument({
      name: docName,
      type: docType,
      content: docContent || "Sample ingested documentation content.",
    });
    setDocName("");
    setDocContent("");
    setShowDocModal(false);
    fetchBriefingData();
    if (showOnboarding && onboardingStep === 3) setOnboardingStep(4);
  };

  const handleKnowledgeIndex = async () => {
    await triggerKnowledgeBuild();
    fetchBriefingData();
    if (showOnboarding && onboardingStep === 4) {
      setTimeout(() => setOnboardingStep(5), 2000);
    }
  };

  const handleLaunchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionTitle.trim() || !missionGoal.trim()) return;
    await createMission({
      title: missionTitle,
      packName: missionPack,
      goal: missionGoal,
    });
    setMissionTitle("");
    setMissionGoal("");
    setShowMissionModal(false);
    fetchBriefingData();
    if (showOnboarding && onboardingStep === 5) {
      setOnboardingStep(6);
    }
  };

  const handleApprovalAction = async (approvalId: string, decision: "approved" | "rejected") => {
    const key = `${approvalId}-${decision}`;
    setDecisionLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/v1/workflows/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          approvalId,
          approverId: "admin@aegisos.io",
          decision
        })
      });
      if (res.ok) {
        fetchBriefingData();
      }
    } catch (e) {
      console.error("[Dashboard] Approval decision failed", e);
    } finally {
      setDecisionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem("onboarding:completed", "true");
    setShowOnboarding(false);
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === 0) setOnboardingStep(1);
    else if (onboardingStep === 1) setShowWsModal(true);
    else if (onboardingStep === 2) setShowRepoModal(true);
    else if (onboardingStep === 3) setShowDocModal(true);
    else if (onboardingStep === 4) handleKnowledgeIndex();
    else if (onboardingStep === 5) setShowMissionModal(true);
    else if (onboardingStep === 6) setOnboardingStep(7);
    else if (onboardingStep === 7) {
      localStorage.setItem("onboarding:completed", "true");
      setShowOnboarding(false);
    }
  };

  const currentFocusText = () => {
    const running = missions.find(m => m.status === "running");
    if (running) {
      return `Executing Mission: ${running.title} (${running.progress}% complete)`;
    }
    const indexing = isIndexing;
    if (indexing) {
      return "Indexing workspace repositories & knowledge files...";
    }
    return "Ready to orchestrate new autonomous missions.";
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-left relative">
      {/* Offline Status Recovery Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-between p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-mono mb-4"
          >
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
              <span>[OFFLINE MODE] Network connectivity lost. Reconnect handling is listening.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOnline(navigator.onLine)}
              className="text-[10px] h-6 px-2.5 border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
            >
              Verify
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Wizard Tour Guide */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-card p-6 shadow-2xl relative overflow-hidden space-y-5 text-left"
            >
              {/* Decorative radial blur */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-foreground">AegisOS Onboarding Walkthrough</h3>
                </div>
                <button
                  onClick={handleSkipOnboarding}
                  className="text-xs text-muted-foreground hover:text-foreground font-mono"
                >
                  Skip Tutorial
                </button>
              </div>

              {/* Onboarding Step Details */}
              <div className="space-y-3 font-mono text-xs text-zinc-300">
                {onboardingStep === 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground text-sm">Welcome to AegisOS Studio Beta!</p>
                    <p className="leading-relaxed">This tutorial will guide you through the process of setting up and running your first autonomous mission inside the operating environment.</p>
                  </div>
                )}
                {onboardingStep === 1 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 1: Create a Workspace</p>
                    <p className="leading-relaxed">Workspaces represent isolated boundaries for organizations, departments, and developer policies. Click Next to initialize a new workspace.</p>
                  </div>
                )}
                {onboardingStep === 2 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 2: Import Codebase Repository</p>
                    <p className="leading-relaxed">Import Git repositories directly. AegisOS will automatically map directories and compile file graphs. Click Next to import.</p>
                  </div>
                )}
                {onboardingStep === 3 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 3: Import Documents</p>
                    <p className="leading-relaxed">Import PDF playbooks, markdown files, and specs to populate the knowledge catalog. Click Next to ingest documents.</p>
                  </div>
                )}
                {onboardingStep === 4 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 4: Rebuild Knowledge index</p>
                    <p className="leading-relaxed">Run the embedding pipeline to parse document chunks and map CodeGraph nodes into SQLite vector pools. Click Next to index.</p>
                  </div>
                )}
                {onboardingStep === 5 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 5: Launch Autonomous Mission</p>
                    <p className="leading-relaxed">Missions parse goals, resolve intent, build graphs, and delegate to cognitive agents. Click Next to launch a security audit.</p>
                  </div>
                )}
                {onboardingStep === 6 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 6: Watch Mission Execute</p>
                    <p className="leading-relaxed">Observe step logs, tool invocations, and reflection cycles in the timeline player. Click Next once you've reviewed execution logs.</p>
                  </div>
                )}
                {onboardingStep === 7 && (
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Step 7: Review Output Artifacts</p>
                    <p className="leading-relaxed">Analyze Markdown reports and topology diagrams produced by agent reflection processes. Click Next to complete the tutorial.</p>
                  </div>
                )}
              </div>

              {/* Progress dots & buttons */}
              <div className="flex items-center justify-between border-t border-border/20 pt-4 font-mono text-[10px]">
                <div className="flex space-x-1.5">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === onboardingStep ? "bg-primary w-3.5" : "bg-muted w-1.5"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" onClick={handleSkipOnboarding} className="h-8 text-[10px]">
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleOnboardingNext} className="h-8 text-[10px] bg-primary text-primary-foreground font-semibold px-4">
                    {onboardingStep === 0 ? "Get Started" : onboardingStep === 7 ? "Complete" : "Next Step"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. WORKSPACE SUMMARY HEADER */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card to-background p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Layers className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
                  <span>{activeWs?.name || "AegisOS Studio"}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium capitalize">
                    {activeWs?.status || "active"}
                  </span>
                </h1>
                <p className="text-xs font-mono text-muted-foreground">
                  ID: {activeWs?.id} | Slug: {activeWs?.slug}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 max-w-3xl leading-relaxed">
              {activeWs?.description || "Workstation Operating System administration console, knowledge graphs, and zero-trust orchestration."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWsModal(true)}
              className="text-xs flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Workspace</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRepoModal(true)}
              className="text-xs flex items-center space-x-1.5"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
              <span>Import Repo</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(true)}
              className="text-xs flex items-center space-x-1.5"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>Import Document</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowMissionModal(true)}
              className="text-xs flex items-center space-x-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>Launch Mission</span>
            </Button>
            
            {/* Onboarding Restart Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOnboardingStep(0);
                setShowOnboarding(true);
              }}
              className="text-xs flex items-center space-x-1 text-zinc-400 border-zinc-700/60"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Guide</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Briefing, Chief of Staff, Approvals */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Workspace Intelligence Briefing */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md relative overflow-hidden text-left space-y-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-foreground">Workspace Intelligence Briefing</h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Dynamic Analysis</span>
            </div>

            {loadingBriefing ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center space-x-2 font-mono">
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-primary" />
                <span>Compiling latest workspace events...</span>
              </div>
            ) : briefing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Overnight summary */}
                <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Overnight activity summary
                  </span>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    {briefing.overnightActivity?.count > 0 
                      ? `Detected ${briefing.overnightActivity.count} system operations overnight. ${briefing.overnightActivity.criticalAlertsCount} critical alert warning logs parsed.`
                      : "No operational anomalies or service drift occurred overnight."}
                  </p>
                </div>

                {/* Mission metrics */}
                <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 space-y-2 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <Rocket className="h-3.5 w-3.5" /> Mission Execution stats
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1.5">
                    <div className="p-1 rounded bg-zinc-950/60 border border-zinc-900">
                      <span className="text-[9px] text-zinc-500 block">RUNNING</span>
                      <span className="text-xs font-bold text-sky-400">{briefing.missions?.runningCount}</span>
                    </div>
                    <div className="p-1 rounded bg-zinc-950/60 border border-zinc-900">
                      <span className="text-[9px] text-zinc-500 block">COMPLETED</span>
                      <span className="text-xs font-bold text-emerald-400">{briefing.missions?.completedCount}</span>
                    </div>
                    <div className="p-1 rounded bg-zinc-950/60 border border-zinc-900">
                      <span className="text-[9px] text-zinc-500 block">QUEUED</span>
                      <span className="text-xs font-bold text-zinc-400">{briefing.missions?.queueCount}</span>
                    </div>
                  </div>
                </div>

                {/* Knowledge freshness */}
                <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> Knowledge index integrity
                  </span>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">FRESHNESS RATIO</span>
                      <span className="font-bold text-emerald-400">{briefing.knowledge?.freshness}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${briefing.knowledge?.freshness}%` }} />
                    </div>
                  </div>
                </div>

                {/* Model Availability */}
                <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" /> AI Model provider availability
                  </span>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`h-2 w-2 rounded-full ${briefing.models?.ollama ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                      <span className="text-zinc-300">Ollama Local</span>
                    </div>
                    <span className="text-zinc-500 font-semibold">{briefing.models?.activeModel}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Chief of Staff coordination Layer */}
          <ChiefOfStaff />

          {/* Pending approvals section */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md text-left space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/20 pb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-foreground">Pending Human-in-the-Loop Approvals</h3>
            </div>

            {loadingBriefing ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-mono">Loading approvals...</div>
            ) : briefing?.pendingApprovals?.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-mono">No pending approvals required. Execution runtime is autonomous.</div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {briefing?.pendingApprovals?.map((app: any) => (
                  <div key={app.id} className="p-4 rounded-xl border border-border/40 bg-background/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">{app.workflowName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-semibold">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">ID: {app.id} | Step: {app.nodeId}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={decisionLoading[`${app.id}-rejected`]}
                        onClick={() => handleApprovalAction(app.id, "rejected")}
                        className="text-[10px] h-8 text-rose-400 border border-rose-500/25 hover:bg-rose-500/10 font-bold px-3"
                      >
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={decisionLoading[`${app.id}-approved`]}
                        onClick={() => handleApprovalAction(app.id, "approved")}
                        className="text-[10px] h-8 bg-emerald-650 hover:bg-emerald-600 text-white shadow font-bold px-3"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indexed Knowledge & Projects card */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-sm text-foreground">Projects & Indexed Knowledge Catalogs</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isIndexing}
                onClick={handleKnowledgeIndex}
                className="text-xs h-7 font-mono flex items-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${isIndexing ? "animate-spin text-primary" : ""}`} />
                <span>{isIndexing ? "Indexing..." : "Rebuild Index"}</span>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 text-xs font-mono">
              {projects.map((proj) => (
                <div key={proj.id} className="p-3.5 rounded-xl border border-border/30 bg-background/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate">{proj.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold capitalize ${
                      proj.status === "indexing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Current Focus, Active Missions, GPU Health, Recent Decisions */}
        <div className="space-y-6">
          
          {/* Current Focus card */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 shadow-md text-left space-y-2">
            <span className="text-[9px] uppercase font-bold text-indigo-400 font-mono tracking-widest block">Current Focus</span>
            <p className="text-xs font-semibold text-zinc-200 leading-relaxed font-mono flex items-start gap-1.5">
              <CornerDownRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>{currentFocusText()}</span>
            </p>
          </div>

          {/* Running & Queue Missions */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div className="flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Active Mission Pipelines</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/mission-control")}
                className="text-xs text-primary hover:text-primary/80 font-mono"
              >
                Open Center
              </Button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {missions.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground italic">No missions initialized.</div>
              ) : (
                missions.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-border/30 bg-background/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{m.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold capitalize ${
                        m.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        m.status === "running" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>{m.packName}</span>
                        <span>{m.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${m.progress}%` }} />
                      </div>
                    </div>

                    {/* Mission Replay link */}
                    <div className="flex justify-end pt-1 border-t border-border/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/mission-replay?missionId=${m.id}`)}
                        className="text-[9px] h-6 px-2 border-indigo-500/25 text-indigo-300 font-mono"
                      >
                        Replay
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* GPU Health & Host telemetry */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md text-left space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/20 pb-3">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-foreground">GPU & Hardware Telemetry</h3>
            </div>

            {loadingBriefing ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-mono">Loading hardware statistics...</div>
            ) : briefing?.gpu ? (
              <div className="space-y-3 font-mono text-xs">
                {/* VRAM Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">VRAM ALLOCATION:</span>
                    <span className="font-semibold text-foreground">{briefing.gpu.vramUsedGb} / {briefing.gpu.vramTotalGb} GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${briefing.gpu.vramUsedGb > 12 ? "bg-rose-500" : "bg-primary"}`} 
                      style={{ width: `${(briefing.gpu.vramUsedGb / briefing.gpu.vramTotalGb) * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-background/80 border border-border/60">
                    <span className="text-[9px] text-muted-foreground block font-bold">CORE LOAD</span>
                    <span className="text-xs font-extrabold text-foreground">{briefing.gpu.utilization}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-background/80 border border-border/60">
                    <span className="text-[9px] text-muted-foreground block font-bold">TEMPERATURE</span>
                    <span className="text-xs font-extrabold text-foreground">{briefing.gpu.temp}°C</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Recent Artifacts */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md text-left space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/20 pb-3">
              <FileCheck className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-sm text-foreground">Recently Generated Artifacts</h3>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {artifacts.slice(0, 3).map((art) => (
                <div key={art.id} className="p-2.5 rounded-lg border border-border/30 bg-background/60 flex items-center justify-between gap-3 truncate">
                  <div className="space-y-0.5 truncate">
                    <span className="font-semibold text-foreground truncate block">{art.title}</span>
                    <span className="text-[9px] text-zinc-500">{art.fileSize || "8.5 KB"}</span>
                  </div>
                  <span className="text-primary hover:underline cursor-pointer font-bold shrink-0 text-[10px]">Open</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE USER JOURNEY MODALS                                           */}
      {/* ========================================================================= */}

      {/* CREATE WORKSPACE MODAL */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create New Workspace</h3>
            <form onSubmit={handleCreateWs} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. Production Engineering Workspace"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  placeholder="Operational scope..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowWsModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create Workspace
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT REPOSITORY MODAL */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Repository</h3>
            <form onSubmit={handleImportRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Project / Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. AegisOS Core Engine"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo.git"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowRepoModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Import Repository
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT DOCUMENT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Document</h3>
            <form onSubmit={handleImportDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. SYSTEM_DESIGN.md"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e: any) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="markdown">Markdown</option>
                  <option value="pdf">PDF Document</option>
                  <option value="code">Source Code</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Content / Spec
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Paste document text or content..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowDocModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Import & Index Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAUNCH MISSION MODAL */}
      {showMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Launch Autonomous Mission</h3>
            <form onSubmit={handleLaunchMission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mission Title
                </label>
                <input
                  type="text"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  placeholder="e.g. Audit Zero Trust Compliance"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mission Pack
                </label>
                <select
                  value={missionPack}
                  onChange={(e) => setMissionPack(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Security Audit Pack">Security Audit Pack</option>
                  <option value="Knowledge Indexer Pack">Knowledge Indexer Pack</option>
                  <option value="Architecture Verification Pack">Architecture Verification Pack</option>
                  <option value="Code Quality Pack">Code Quality Pack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Target Goal
                </label>
                <textarea
                  value={missionGoal}
                  onChange={(e) => setMissionGoal(e.target.value)}
                  placeholder="Specify verifiable goal criteria..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowMissionModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Launch Mission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
