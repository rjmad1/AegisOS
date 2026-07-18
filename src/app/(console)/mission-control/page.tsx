"use client";

import React, { useState } from "react";
import {
  Rocket,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  Terminal,
  X,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useWorkspaceStore, WorkspaceMission } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";

export default function MissionControlPage() {
  const { missions, createMission } = useWorkspaceStore();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeMission, setActiveMission] = useState<WorkspaceMission | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [packName, setPackName] = useState("Security Audit Pack");
  const [goal, setGoal] = useState("");

  const filteredMissions = missions.filter(
    (m) => selectedStatus === "all" || m.status === selectedStatus
  );

  const completedCount = missions.filter((m) => m.status === "completed").length;
  const runningCount = missions.filter((m) => m.status === "running").length;
  const failedCount = missions.filter((m) => m.status === "failed").length;
  const successRate = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 100;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) return;
    await createMission({ title, packName, goal });
    setTitle("");
    setGoal("");
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <Rocket className="h-6 w-6 text-primary" />
            <span>Mission Center</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Orchestrate autonomous agent missions, monitor real-time execution logs, and analyze mission health.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="text-xs flex items-center space-x-1.5 shadow-lg shadow-primary/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Launch Mission</span>
        </Button>
      </div>

      {/* MISSION HEALTH KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{successRate}%</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase">Running Missions</span>
            <Play className="h-4 w-4 text-sky-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-foreground">{runningCount}</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{completedCount}</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase">Failures</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{failedCount}</p>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center space-x-1 border-b border-border/30 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: "All Missions" },
          { id: "pending", label: "Pending" },
          { id: "running", label: "Running" },
          { id: "completed", label: "Completed" },
          { id: "failed", label: "Failures" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
              selectedStatus === tab.id
                ? "border-primary text-primary bg-primary/5 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MISSIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMissions.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-border/40 bg-card p-5 space-y-4 hover:border-border/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">{m.title}</span>
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

              <p className="text-xs text-muted-foreground line-clamp-2">{m.goal}</p>

              {/* Progress bar */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between text-[10px] text-muted-foreground">
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

            <div className="pt-3 border-t border-border/20 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground text-[10px]">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMission(m)}
                className="text-xs h-7 px-2.5 flex items-center space-x-1"
              >
                <Terminal className="h-3 w-3" />
                <span>Logs</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MISSION LOGS MODAL */}
      {activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">{activeMission.title} - Execution Logs</h3>
              </div>
              <button
                onClick={() => setActiveMission(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs bg-black/90 text-emerald-400 space-y-1 flex-1">
              {activeMission.logs.map((log, idx) => (
                <div key={idx} className="flex space-x-2">
                  <span className="text-muted-foreground select-none">[{idx + 1}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border/20 flex justify-end bg-card">
              <Button variant="primary" size="sm" onClick={() => setActiveMission(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH MISSION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Launch Mission</h3>
            <form onSubmit={handleLaunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mission Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Audit Zero Trust Security"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mission Pack
                </label>
                <select
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Security Audit Pack">Security Audit Pack</option>
                  <option value="Knowledge Indexer Pack">Knowledge Indexer Pack</option>
                  <option value="Architecture Verification Pack">Architecture Verification Pack</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Target Goal Criteria
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Verifiable success goal..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
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
