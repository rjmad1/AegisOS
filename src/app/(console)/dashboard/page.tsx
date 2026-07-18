"use client";

import React, { useState } from "react";
import {
  Layers,
  FolderGit2,
  BookOpen,
  FileCode,
  Rocket,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  Play,
  FileText,
  Workflow,
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { LiveWorkspaceHealth } from "@/components/workspace/LiveWorkspaceHealth";
import { Button } from "@/components/ui/Button";

export default function WorkspaceDashboardPage() {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    projects,
    importRepository,
    knowledgeDocs,
    importDocument,
    triggerKnowledgeBuild,
    isIndexing,
    artifacts,
    missions,
    createMission,
    activityFeed,
  } = useWorkspaceStore();

  // Modal states
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

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleCreateWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    await createWorkspace({ name: wsName, description: wsDesc });
    setWsName("");
    setWsDesc("");
    setShowWsModal(false);
  };

  const handleImportRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !repoUrl.trim()) return;
    await importRepository({ name: repoName, repositoryUrl: repoUrl });
    setRepoName("");
    setRepoUrl("");
    setShowRepoModal(false);
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
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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

          {/* Quick User Journey Actions */}
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
          </div>
        </div>
      </div>

      {/* 2. LIVE WORKSPACE HEALTH (Deliverable 6) */}
      <LiveWorkspaceHealth />

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Projects & Knowledge Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* PROJECTS & REPOSITORIES (Deliverable 1 & 2) */}
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderGit2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-foreground text-sm">Projects & Repositories</h3>
                <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                  {projects.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRepoModal(true)}
                className="text-xs text-primary hover:text-primary/80"
              >
                + Import Repository
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-lg border border-border/30 bg-background/60 p-4 space-y-2 hover:border-border/80 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground text-sm truncate">{proj.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono capitalize ${
                        proj.status === "indexing"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{proj.description}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/20">
                    <span className="flex items-center space-x-1">
                      <FolderGit2 className="h-3 w-3 text-muted-foreground" />
                      <span>{proj.branch || "main"}</span>
                    </span>
                    <span>{proj.commitCount || 0} commits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KNOWLEDGE INDEX OVERVIEW (Deliverable 1 & 3) */}
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold text-foreground text-sm">Indexed Knowledge Base</h3>
                <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                  {knowledgeDocs.length} docs
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerKnowledgeBuild}
                  disabled={isIndexing}
                  className="text-xs flex items-center space-x-1 h-8"
                >
                  <RefreshCw className={`h-3 w-3 ${isIndexing ? "animate-spin text-primary" : ""}`} />
                  <span>{isIndexing ? "Indexing..." : "Rebuild Index"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocModal(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  + Import Document
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {knowledgeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border/30 bg-background/60 p-3 space-y-2 hover:border-border/80 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">{doc.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                      {doc.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>{doc.chunkCount} chunks</span>
                    <span className="text-emerald-400">{doc.vectorCount} vectors</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GENERATED ARTIFACTS LIBRARY (Deliverable 1 & 4) */}
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-foreground text-sm">Artifact Library</h3>
                <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                  {artifacts.length} artifacts
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-background/60 p-3 hover:border-border/80 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {art.type === "markdown" ? (
                        <FileText className="h-4 w-4" />
                      ) : art.type === "architecture" ? (
                        <Workflow className="h-4 w-4" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <h5 className="font-medium text-foreground text-xs">{art.title}</h5>
                      <p className="text-[11px] text-muted-foreground">{art.summary}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{art.fileSize || "10 KB"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Missions & Recent Activity Feed */}
        <div className="space-y-6">
          {/* MISSION CENTER SNAPSHOT (Deliverable 1 & 5) */}
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Active Missions</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMissionModal(true)}
                className="text-xs text-primary hover:text-primary/80"
              >
                + Launch Mission
              </Button>
            </div>

            <div className="space-y-3">
              {missions.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-border/30 bg-background/60 p-3.5 space-y-2 hover:border-border/80 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-foreground text-xs truncate">{m.title}</h5>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono capitalize ${
                        m.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : m.status === "running"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{m.goal}</p>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{m.packName}</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY FEED (Deliverable 1 & 7) */}
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-foreground text-sm">Recent Activity</h3>
              </div>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/30">
              {activityFeed.slice(0, 6).map((act) => (
                <div key={act.id} className="relative pl-7 space-y-0.5">
                  <span className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-primary" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground text-xs">{act.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{act.description}</p>
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
