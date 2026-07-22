// src/components/workspace/ChiefOfStaff.tsx
"use client";

import * as React from "react";
import { 
  ShieldAlert, Sparkles, AlertTriangle, ArrowRight, Play, CheckCircle2, 
  HelpCircle, RefreshCw, Layers, ShieldCheck, FileCheck, FolderSync, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";
import { ConsoleActionDispatcher } from "@/platform/console/ActionDispatcher";
import { CommandRegistry } from "@/platform/commands/CommandRegistry";

export function ChiefOfStaff() {
  const { missions, triggerKnowledgeBuild, isIndexing } = useWorkspaceStore();
  const [briefingData, setBriefingData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [remediationLogs, setRemediationLogs] = React.useState<Record<string, string>>({});
  const [runningRemediation, setRunningRemediation] = React.useState<Record<string, boolean>>({});

  const fetchBriefing = async () => {
    try {
      const res = await fetch("/api/v1/briefing");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBriefingData(json.briefing);
        }
      }
    } catch (e) {
      console.error("[ChiefOfStaff] Failed to load briefing data", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBriefing();
    // Poll every 10 seconds for real-time coordinator state updates
    const interval = setInterval(fetchBriefing, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (actionKey: string) => {
    setRunningRemediation(prev => ({ ...prev, [actionKey]: true }));
    try {
      if (actionKey === "refresh-embeddings") {
        await triggerKnowledgeBuild();
        setRemediationLogs(prev => ({
          ...prev,
          [actionKey]: "Knowledge index rebuild triggered successfully. Syncing vectors."
        }));
      } else {
        // Execute through the Governed Action Execution Architecture
        const commandId = `oil.recommendation.${actionKey}`;
        
        // Dynamically register the command if it doesn't exist yet (scaffold)
        if (!CommandRegistry.getCommand(commandId)) {
          CommandRegistry.register({
            id: commandId,
            name: `Execute ${actionKey}`,
            title: `Execute ${actionKey}`,
            category: "Operations",
            description: `Auto-generated command for OIL remediation: ${actionKey}`,
            auditClassification: 'SENSITIVE',
            validate: async () => true,
            execute: async (payload: any) => {
              const res = await fetch("/api/v1/oil/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: actionKey, ...payload })
              });
              
              if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.error || "Execution failed");
              }
              
              const data = await res.json();
              if (!data.success) {
                throw new Error(data.error || "Execution failed");
              }
              
              return {
                outcome: 'SUCCESS',
                data: data.result,
                correlationId: '',
                executionDurationMs: 0
              };
            }
          });
        }
        
        const result = await ConsoleActionDispatcher.dispatch(
          commandId, 
          {}, 
          { userId: "system", tenantId: "default" }
        );
        
        setRemediationLogs(prev => ({
          ...prev,
          [actionKey]: result.data?.log || `Execution successful for: ${actionKey} (Command: ${commandId})`
        }));
        fetchBriefing();
      }
    } catch (e: any) {
      setRemediationLogs(prev => ({
        ...prev,
        [actionKey]: `Error running action: ${e.message}`
      }));
    } finally {
      setRunningRemediation(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center space-y-2 border border-border/40 bg-card rounded-2xl p-6">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Chief of Staff analyzing workspace...</p>
      </div>
    );
  }

  // Coordination Logic Checks
  const activeMissions = missions.filter(m => m.status === "running");
  const completedMissions = missions.filter(m => m.status === "completed");
  const failedMissions = missions.filter(m => m.status === "failed");
  const pendingApprovalsCount = briefingData?.pendingApprovals?.length || 0;
  const staleKnowledge = briefingData?.knowledge?.freshness < 95;
  const gpuWarning = briefingData?.gpu?.utilization > 85 || briefingData?.gpu?.temp > 75;
  const extensionUpdatesAvailable = briefingData?.extensions?.updatesAvailable > 0;

  // Compile Chief of Staff Advisory messages
  const advisors: { id: string; type: "warning" | "info" | "success"; text: string; actionText?: string; actionKey?: string }[] = [];

  if (activeMissions.length > 0) {
    advisors.push({
      id: "active-work",
      type: "info",
      text: `${activeMissions.length} autonomous mission(s) currently executing. Tracking active agent paths.`,
    });
  }

  if (pendingApprovalsCount > 0) {
    advisors.push({
      id: "blocked-approvals",
      type: "warning",
      text: `Execution blocked. ${pendingApprovalsCount} workflow(s) waiting for manual Human-in-the-Loop approval.`,
      actionText: "Review Approvals",
      actionKey: "review-approvals" // Navigation trigger handled in UI
    });
  }

  if (staleKnowledge) {
    advisors.push({
      id: "stale-embeddings",
      type: "warning",
      text: `Stale semantic knowledge detected. File index freshness is at ${briefingData?.knowledge?.freshness}%.`,
      actionText: "Refresh Index",
      actionKey: "refresh-embeddings"
    });
  }

  if (failedMissions.length > 0) {
    advisors.push({
      id: "failed-missions",
      type: "warning",
      text: `${failedMissions.length} recent mission failure(s) detected. Recommend reviewing run execution graphs.`,
      actionText: "Audit Failures",
      actionKey: "audit-failures"
    });
  }

  if (gpuWarning) {
    advisors.push({
      id: "gpu-pressure",
      type: "warning",
      text: `High GPU load (${briefingData?.gpu?.utilization}%) or temperature (${briefingData?.gpu?.temp}°C). Purging VRAM recommended.`,
      actionText: "Purge VRAM",
      actionKey: "purge-vram-cache"
    });
  }

  if (extensionUpdatesAvailable) {
    advisors.push({
      id: "extension-updates",
      type: "info",
      text: `${briefingData?.extensions?.updatesAvailable} extension update(s) available in the registry.`,
      actionText: "Update Extensions",
      actionKey: "update-extensions"
    });
  }

  if (advisors.length === 0) {
    advisors.push({
      id: "all-clear",
      type: "success",
      text: "Workspace fully nominal. All pipelines are aligned and executing optimally."
    });
  }

  return (
    <CardContainer>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-foreground">Chief of Staff Advisor</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold font-mono tracking-wider">Operational Coordination Layer</p>
          </div>
        </div>
        <Badge status={advisors.some(a => a.type === "warning") ? "warning" : "nominal"}>
          {advisors.some(a => a.type === "warning") ? "Needs Attention" : "Optimal"}
        </Badge>
      </div>

      {/* Advisory Feed */}
      <div className="space-y-3 pt-4">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Workspace Audits</h4>
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {advisors.map((adv) => (
              <motion.div
                key={adv.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed ${
                  adv.type === "warning" ? "bg-rose-500/5 border-rose-500/20 text-rose-200" :
                  adv.type === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200" :
                  "bg-indigo-500/5 border-indigo-500/20 text-indigo-200"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <span className="mt-0.5 shrink-0">
                    {adv.type === "warning" ? <AlertTriangle className="h-4 w-4 text-rose-400" /> :
                     adv.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                     <ShieldAlert className="h-4 w-4 text-indigo-400" />}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{adv.text}</p>
                    
                    {/* Execution Logs */}
                    {adv.actionKey && remediationLogs[adv.actionKey] && (
                      <pre className="mt-2 p-2 bg-black/80 rounded border border-border/30 text-[10px] font-mono text-cyan-400 overflow-x-auto whitespace-pre-wrap select-text max-h-24">
                        {remediationLogs[adv.actionKey]}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Coordination Actions */}
                {adv.actionText && adv.actionKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={runningRemediation[adv.actionKey] || isIndexing}
                    onClick={() => handleAction(adv.actionKey!)}
                    className="text-[10px] h-7 px-2 shrink-0 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 font-mono"
                  >
                    {runningRemediation[adv.actionKey] || (adv.actionKey === "refresh-embeddings" && isIndexing) ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    {adv.actionText}
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Suggested SRE Remediation Actions */}
      {briefingData?.recommendedActions?.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/10 mt-4">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Suggested Remediation Actions</h4>
          <div className="grid gap-2">
            {briefingData.recommendedActions.map((rec: any) => (
              <div key={rec.id} className="p-3 rounded-lg border border-border/30 bg-background/60 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase font-mono ${
                      rec.priority === "critical" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      rec.priority === "high" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {rec.priority}
                    </span>
                    <span className="font-semibold text-foreground text-xs">{rec.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{rec.reason}</p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAction(rec.remediationAction)}
                  disabled={runningRemediation[rec.remediationAction]}
                  className="text-[10px] h-7 px-2.5 bg-indigo-650 hover:bg-indigo-600 text-white shadow font-semibold"
                >
                  {runningRemediation[rec.remediationAction] ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Run
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardContainer>
  );
}

// Helpers
function CardContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-md relative overflow-hidden text-left">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      {children}
    </div>
  );
}

function Badge({ children, status }: { children: React.ReactNode; status: "warning" | "nominal" }) {
  return (
    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${
      status === "warning" 
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    }`}>
      {children}
    </span>
  );
}
