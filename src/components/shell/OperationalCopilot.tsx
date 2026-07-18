// src/components/shell/OperationalCopilot.tsx
"use client";

import * as React from "react";
import {
  Brain,
  Cpu,
  Activity,
  Layers,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Send,
  X,
  FileText,
  Clock,
  Terminal,
  Shield,
  CheckCircle2,
  HelpCircle,
  CornerDownRight,
  Info
} from "lucide-react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

interface OperationalCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperationalCopilot({ isOpen, onClose }: OperationalCopilotProps) {
  const [activeTab, setActiveTab] = React.useState<"chat" | "brief" | "recs" | "timeline" | "rca">("chat");
  const [chatMessage, setChatMessage] = React.useState("");
  const [chatHistory, setChatHistory] = React.useState<{ role: "user" | "assistant"; content: string; actions?: any[]; explanation?: any }[]>([
    {
      role: "assistant",
      content: "Hello. I am the AegisOS Operational Intelligence Assistant. I am continuously auditing system logs, Digital Twin metrics, and workflows.\n\nAsk me about platform health, recent changes, or troubleshooting problems."
    }
  ]);
  const [isPending, setIsPending] = React.useState(false);
  
  // State loaders for OIL APIs
  const [brief, setBrief] = React.useState<any>(null);
  const [situation, setSituation] = React.useState<any>(null);
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [timeline, setTimeline] = React.useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = React.useState("all");
  const [timelinePlaying, setTimelinePlaying] = React.useState(true);
  const [rcaQuestion, setRcaQuestion] = React.useState("inference slow");
  const [rcaReport, setRcaReport] = React.useState<any>(null);
  const [remediationLogs, setRemediationLogs] = React.useState<Record<string, { loading: boolean; log?: string; success?: boolean }>>({});

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch all states initially and periodically
  const fetchState = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/oil");
      const data = await res.json();
      if (data.success) {
        setBrief(data.brief);
        setSituation(data.situation);
      }

      const recsRes = await fetch("/api/v1/oil/recommendations");
      const recsData = await recsRes.json();
      if (recsData.success) {
        setRecommendations(recsData.recommendations);
      }

      const timelineRes = await fetch(`/api/v1/oil/timeline?category=${timelineFilter}`);
      const timelineData = await timelineRes.json();
      if (timelineData.success) {
        setTimeline(timelineData.events);
      }
    } catch (e) {
      console.error("OIL state load failed", e);
    }
  }, [timelineFilter]);

  React.useEffect(() => {
    if (isOpen) {
      fetchState();
    }
  }, [isOpen, fetchState]);

  // Timeline Auto-polling/playback
  React.useEffect(() => {
    if (isOpen && timelinePlaying) {
      const interval = setInterval(() => {
        fetchState();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, timelinePlaying, fetchState]);

  // Scroll to bottom of chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendChat = async (msgText?: string) => {
    const textToSend = msgText || chatMessage;
    if (!textToSend.trim()) return;

    if (!msgText) setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", content: textToSend }]);
    setIsPending(true);

    try {
      const res = await fetch("/api/v1/oil/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            actions: data.structuredActions,
            explanation: data.explanation
          }
        ]);
        // Re-fetch recommendations and timeline since commands might alter system state
        fetchState();
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "assistant", content: "Error communicating with reasoning engine." }]);
    } finally {
      setIsPending(false);
    }
  };

  const handleExecuteRemediation = async (action: string) => {
    setRemediationLogs(prev => ({
      ...prev,
      [action]: { loading: true }
    }));

    try {
      const res = await fetch("/api/v1/oil/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setRemediationLogs(prev => ({
          ...prev,
          [action]: { loading: false, success: data.result.success, log: data.result.log }
        }));
        fetchState();
      }
    } catch (e) {
      setRemediationLogs(prev => ({
        ...prev,
        [action]: { loading: false, success: false, log: "Remediation failed to execute." }
      }));
    }
  };

  const handleRunRca = async (query: string) => {
    setRcaReport(null);
    setRcaQuestion(query);
    try {
      const res = await fetch(`/api/v1/oil/rca?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setRcaReport(data.report);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-950 text-rose-400 border-rose-800";
      case "high":
        return "bg-amber-950 text-amber-400 border-amber-800";
      case "warning":
      case "medium":
        return "bg-yellow-950/50 text-yellow-500 border-yellow-800/50";
      case "success":
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex h-full w-[450px] flex-col border-l border-border bg-card/90 backdrop-blur-xl text-card-foreground shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4 bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div>
                <h2 className="font-semibold text-sm tracking-wide uppercase text-zinc-100">Operational Intelligence (OIL)</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Continuous SRE Auditing</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {situation && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-border">
                  <span className="text-[10px] text-zinc-400 font-medium">Confidence:</span>
                  <span className={cn(
                    "text-xs font-bold",
                    situation.confidenceScore >= 90 ? "text-emerald-400" :
                    situation.confidenceScore >= 70 ? "text-yellow-500" : "text-rose-500"
                  )}>
                    {situation.confidenceScore}%
                  </span>
                </div>
              )}
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-zinc-900/30 p-1">
            {[
              { id: "chat", label: "Copilot", icon: Brain },
              { id: "brief", label: "Situation", icon: FileText },
              { id: "recs", label: "Remediate", icon: Cpu },
              { id: "timeline", label: "Timeline", icon: Clock },
              { id: "rca", label: "RCA", icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium border-b-2 transition-all rounded",
                  activeTab === tab.id 
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" 
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}
              >
                <tab.icon className="h-4 w-4 mb-0.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Wrapper */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 1. CHAT TAB */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full space-y-3">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {chatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg max-w-[90%] border border-border/50",
                        chat.role === "user" 
                          ? "bg-zinc-800/80 text-zinc-100 ml-auto border-zinc-700" 
                          : "bg-zinc-900/60 text-zinc-300 border-zinc-800"
                      )}
                    >
                      <div className="whitespace-pre-line font-mono">{chat.content}</div>
                      
                      {/* Structured NLO Actions */}
                      {chat.actions && chat.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
                          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">Structured Platform Remediations:</span>
                          {chat.actions.map((act, aIdx) => (
                            <div key={aIdx} className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800">
                              <span className="font-mono text-[10px] text-zinc-400">{act.target}</span>
                              <button
                                onClick={() => handleExecuteRemediation(act.target)}
                                disabled={remediationLogs[act.target]?.loading}
                                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                              >
                                {remediationLogs[act.target]?.loading ? "Running..." : "Run"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explainability Block */}
                      {chat.explanation && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-400 font-mono bg-zinc-950/20 p-2 rounded">
                          <div className="flex items-center gap-1 text-indigo-400 font-semibold mb-1">
                            <Info className="h-3 w-3" />
                            <span>Explainability Manifest</span>
                          </div>
                          <div><strong>Evidence:</strong> {chat.explanation.evidence.join(', ')}</div>
                          <div><strong>Reasoning:</strong> {chat.explanation.reasoning}</div>
                          <div><strong>Confidence:</strong> {Math.round(chat.explanation.confidence * 100)}%</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isPending && (
                    <div className="flex items-center gap-2 p-3 rounded-lg max-w-[80%] bg-zinc-900 border border-zinc-800 text-zinc-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Reasoning...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestions Quick Buttons */}
                <div className="grid grid-cols-2 gap-2 pb-1">
                  {[
                    { text: "Why is inference slow?", action: "Why is inference slow?" },
                    { text: "Show overnight changes", action: "Show what changed overnight" },
                    { text: "Optimize GPU VRAM", action: "Optimize VRAM usage" },
                    { text: "Prepare research desk", action: "Prepare workstation for research" }
                  ].map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendChat(sug.action)}
                      className="px-2.5 py-1.5 text-left rounded bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 hover:text-indigo-300 text-[10px] text-zinc-400 font-mono transition-all truncate"
                    >
                      {sug.text}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask Operational Copilot..."
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleSendChat()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. SITUATION & DAILY BRIEF TAB */}
            {activeTab === "brief" && (
              <div className="space-y-4">
                {/* Situation Assessment Dimensions */}
                {situation && (
                  <div className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Situation Assessment
                    </h3>
                    <div className="grid gap-2 text-[11px]">
                      {Object.entries(situation.dimensions).map(([key, val]: any) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-850">
                          <span className="capitalize text-zinc-400 font-mono">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                              val.status === 'Nominal' ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50" :
                              val.status === 'Degraded' ? "bg-yellow-950/50 text-yellow-500 border-yellow-900/50" : "bg-rose-950/50 text-rose-500 border-rose-900/50"
                            )}>
                              {val.status}
                            </span>
                            <span className="font-mono text-zinc-300 w-8 text-right">{val.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive Daily Brief */}
                {brief && (
                  <div className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      Executive Daily Briefing
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                      {brief.summary}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-500 block">Workflows Completed</span>
                        <span className="text-lg font-bold text-zinc-200">{brief.overnightStats.workflowsCompleted}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-850">
                        <span className="text-zinc-500 block">Workflows Failed</span>
                        <span className="text-lg font-bold text-rose-400">{brief.overnightStats.workflowsFailed}</span>
                      </div>
                    </div>

                    {brief.plannedMaintenance && brief.plannedMaintenance.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">Planned Maintenance Window</span>
                        {brief.plannedMaintenance.map((m: string, mIdx: number) => (
                          <div key={mIdx} className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-2 rounded border border-zinc-850 flex items-start gap-1">
                            <CornerDownRight className="h-3 w-3 mt-0.5 text-zinc-500 flex-shrink-0" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. RECOMMENDATIONS & REMEDIATIONS */}
            {activeTab === "recs" && (
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <div className="text-center p-6 text-zinc-500 text-xs">No active recommendations generated.</div>
                ) : (
                  recommendations.map((rec) => (
                    <div key={rec.id} className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[9px] font-semibold border rounded uppercase",
                            getSeverityBadgeClass(rec.priority)
                          )}>
                            {rec.priority}
                          </span>
                          <h4 className="text-xs font-semibold text-zinc-200">{rec.title}</h4>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded border border-zinc-850 leading-relaxed">
                        {rec.reason}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 rounded bg-zinc-950/40 border border-zinc-850/60">
                          <span className="text-zinc-500 block text-[9px]">Impact</span>
                          <span className="text-zinc-300 font-medium">{rec.impact}</span>
                        </div>
                        <div className="p-1.5 rounded bg-zinc-950/40 border border-zinc-850/60">
                          <span className="text-zinc-500 block text-[9px]">Risk</span>
                          <span className="text-zinc-300 font-medium">{rec.risk}</span>
                        </div>
                      </div>

                      {/* One-click remediation handler */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleExecuteRemediation(rec.remediationAction)}
                          disabled={remediationLogs[rec.remediationAction]?.loading}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-850 text-white disabled:text-zinc-500 font-semibold text-[11px] rounded transition-all shadow-md"
                        >
                          <Cpu className="h-3.5 w-3.5" />
                          {remediationLogs[rec.remediationAction]?.loading ? "Executing Remediation..." : 
                            rec.requiresApproval ? "Request Exec Approval" : "Execute Remediation"}
                        </button>

                        {/* Remediation Execution Logs Panel */}
                        {remediationLogs[rec.remediationAction] && (
                          <div className={cn(
                            "p-2.5 rounded text-[9px] font-mono whitespace-pre-wrap border",
                            remediationLogs[rec.remediationAction].success === true ? "bg-emerald-950/20 text-emerald-400 border-emerald-900" :
                            remediationLogs[rec.remediationAction].success === false ? "bg-rose-950/20 text-rose-400 border-rose-900" : "bg-zinc-950 text-zinc-400 border-zinc-800"
                          )}>
                            {remediationLogs[rec.remediationAction].loading ? (
                              <div className="flex items-center gap-1.5">
                                <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />
                                <span>Running SRE automated steps (Diagnose, Plan, Simulate)...</span>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold mb-1 flex items-center gap-1">
                                  {remediationLogs[rec.remediationAction].success ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                  <span>Remediation Outcome</span>
                                </div>
                                {remediationLogs[rec.remediationAction].log}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. VISUAL PLAYBACK OPERATIONAL TIMELINE */}
            {activeTab === "timeline" && (
              <div className="space-y-3">
                {/* Playback Controls */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-border">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTimelinePlaying(!timelinePlaying)}
                      className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300"
                    >
                      {timelinePlaying ? <Pause className="h-3.5 w-3.5 text-indigo-400" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                    </button>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {timelinePlaying ? "Live Playback Active" : "Playback Paused"}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {["all", "workflow", "security", "lifecycle"].map(f => (
                      <button
                        key={f}
                        onClick={() => setTimelineFilter(f)}
                        className={cn(
                          "px-2 py-0.5 text-[9px] rounded font-semibold capitalize transition-all",
                          timelineFilter === f ? "bg-indigo-600 text-white" : "bg-zinc-850 text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline Feed */}
                <div className="relative pl-4 border-l border-zinc-800 space-y-4">
                  {timeline.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative text-[10px]">
                      {/* Timeline Dot */}
                      <span className={cn(
                        "absolute -left-[20px] top-1 h-2 w-2 rounded-full border bg-zinc-950",
                        evt.severity === "critical" ? "border-rose-500 bg-rose-500" :
                        evt.severity === "warning" ? "border-yellow-500 bg-yellow-500" :
                        evt.severity === "success" ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 bg-zinc-400"
                      )}></span>
                      
                      <div className="flex justify-between items-center text-zinc-500 font-mono mb-0.5">
                        <span className="font-semibold text-zinc-400 uppercase tracking-wide">{evt.category}</span>
                        <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="font-mono text-zinc-300 font-semibold">{evt.title}</div>
                      <p className="text-zinc-400 font-mono mt-0.5 bg-zinc-950/40 p-1.5 rounded border border-zinc-900/60 leading-relaxed truncate-2-lines">
                        {evt.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. INTERACTIVE RCA DIAGNOSTIC TAB */}
            {activeTab === "rca" && (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    Root Cause Analysis Dashboard
                  </h3>
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-semibold block">Select target scenario for diagnosis:</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      {[
                        { label: "Why is inference slow?", query: "inference slow" },
                        { label: "Why did workflow fail?", query: "workflow fail" },
                        { label: "Why is VRAM usage high?", query: "gpu vram high" },
                        { label: "Twin reconciliation lag?", query: "digital twin unhealthy" }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRunRca(item.query)}
                          className={cn(
                            "p-2 rounded text-left border transition-all truncate",
                            rcaQuestion === item.query 
                              ? "bg-indigo-950/30 border-indigo-500 text-indigo-300"
                              : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Display RCA Report */}
                {rcaReport ? (
                  <div className="space-y-4">
                    {/* Findings Card */}
                    <div className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Most Likely Root Cause</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                          <span className="text-[9px] text-zinc-500">Confidence:</span>
                          <span className="text-[10px] font-bold text-indigo-400">{Math.round(rcaReport.confidence * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-zinc-200 font-mono bg-indigo-950/20 p-2.5 rounded border border-indigo-900/40 leading-relaxed">
                        {rcaReport.mostLikelyRootCause}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold block">Observed Symptoms</span>
                        {rcaReport.observedSymptoms.map((sym: string, sIdx: number) => (
                          <div key={sIdx} className="text-[10px] text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-850 flex items-start gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <span>{sym}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold block">Diagnostic Evidence</span>
                        {rcaReport.evidence.map((ev: string, eIdx: number) => (
                          <div key={eIdx} className="text-[10px] text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-850 flex items-start gap-1">
                            <Info className="h-3.5 w-3.5 mt-0.5 text-indigo-400 flex-shrink-0" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold block">System Dependency Path</span>
                        <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-950 rounded border border-zinc-850 text-[9px] font-mono text-zinc-400">
                          {rcaReport.dependencyChain.map((dep: string, dIdx: number) => (
                            <React.Fragment key={dIdx}>
                              {dIdx > 0 && <span className="text-zinc-650 mx-0.5">→</span>}
                              <span className={cn(
                                "px-1.5 py-0.5 rounded border",
                                dIdx === rcaReport.dependencyChain.length - 1 ? "bg-indigo-950 border-indigo-900 text-indigo-300" : "bg-zinc-900 border-zinc-800"
                              )}>{dep}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RCA Actions */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wide">Recommended SRE Mitigations:</span>
                      {rcaReport.recommendedActions.map((rec: any) => (
                        <div key={rec.id} className="p-3 bg-zinc-900/40 rounded-lg border border-border space-y-2">
                          <div className="text-xs font-semibold text-zinc-200">{rec.description}</div>
                          <div className="text-[10px] text-zinc-400 font-mono leading-relaxed">{rec.benefit}</div>
                          <button
                            onClick={() => handleExecuteRemediation(rec.remediationAction)}
                            disabled={remediationLogs[rec.remediationAction]?.loading}
                            className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition-all disabled:opacity-50"
                          >
                            {remediationLogs[rec.remediationAction]?.loading ? "Running Remediation..." : "Execute This Fix"}
                          </button>
                          
                          {remediationLogs[rec.remediationAction] && (
                            <div className={cn(
                              "p-2 rounded text-[9px] font-mono whitespace-pre-wrap border mt-2",
                              remediationLogs[rec.remediationAction].success === true ? "bg-emerald-950/20 text-emerald-400 border-emerald-900" :
                              remediationLogs[rec.remediationAction].success === false ? "bg-rose-950/20 text-rose-400 border-rose-900" : "bg-zinc-950 text-zinc-400 border-zinc-800"
                            )}>
                              {remediationLogs[rec.remediationAction].log}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-zinc-500 text-xs">Select a scenario to run Root Cause Analysis.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
