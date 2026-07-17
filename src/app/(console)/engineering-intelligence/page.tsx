// src/app/(console)/engineering-intelligence/page.tsx
// Executive Engineering Dashboard for the AegisOS Engineering Brain (EIP).

"use client";

import * as React from "react";
import { 
  Brain, ShieldAlert, Cpu, HardDrive, BarChart3, HelpCircle, 
  Activity, Play, CheckCircle2, ChevronRight, Zap, RefreshCw, 
  AlertCircle, Network, TrendingUp, ShieldCheck, Flame, GitCommit, 
  Workflow, Database, UserCheck, Check, X, Clock, HelpCircle as HelpIcon, Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { motion } from "framer-motion";

export default function EngineeringBrainConsole() {
  const [activeTab, setActiveTab] = React.useState<"overview" | "queue" | "graph" | "correlations" | "predictions" | "memory">("overview");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState("");
  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  
  // Custom outcome logger state
  const [feedbackInput, setFeedbackInput] = React.useState<Record<string, string>>({});
  const [showOutcomeDialogId, setShowOutcomeDialogId] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/engineering-intelligence");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("[EipUI] Fetch summary error:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (recId: string, action: "approve" | "reject" | "snooze" | "implemented", feedbackText?: string) => {
    setActionLoadingId(recId);
    setActionMessage("");
    try {
      const res = await fetch("/api/v1/engineering-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recId, action, feedback: feedbackText })
      });
      if (res.ok) {
        const json = await res.json();
        setActionMessage(json.message || `Action '${action}' executed successfully!`);
        setData(json.summary);
        setShowOutcomeDialogId(null);
      }
    } catch {
      setActionMessage("Recommendation state update failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Synchronizing Engineering Brain state...</p>
      </div>
    );
  }

  const phi = data?.platformHealthIndex ?? 100;
  const emi = data?.engineeringMaturityLevel ?? 4;
  const priorityQueue = data?.priorityQueue ?? [];
  const correlations = data?.correlatedChains ?? [];
  const predictions = data?.predictions ?? [];
  const graph = data?.knowledgeGraph ?? { nodes: [], edges: [] };
  const outcomes = data?.outcomes ?? [];

  return (
    <div className="space-y-6">
      {/* Upper Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
            <span>Engineering Intelligence Platform</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Autonomic AI Operating System decision brain, correlating anomalies, predicting capacity thresholds, and governing prioritization.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>
            Scan Workspace
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert variant="success" title="Engineering Brain Event">
          <div className="flex justify-between items-center w-full">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer ml-4">
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {/* Primary KPI Ribbon */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Platform Health Index</span>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${phi >= 90 ? 'text-emerald-500' : phi >= 75 ? 'text-amber-500' : 'text-red-500'}`}>{phi}%</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase">Active Score</span>
            </div>
          </div>
          <Activity className="h-8 w-8 text-primary/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Maturity Level</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-cyan-400">L{emi}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                {emi === 5 ? "Optimized" : emi === 4 ? "Managed" : emi === 3 ? "Defined" : "Initial"}
              </span>
            </div>
          </div>
          <Award className="h-8 w-8 text-cyan-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Causal Risks</span>
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-extrabold ${correlations.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{correlations.length} Alerting</span>
            </div>
          </div>
          <ShieldAlert className="h-8 w-8 text-amber-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Decision Queue</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-primary">{priorityQueue.filter((r: any) => r.status === "pending").length} Items</span>
            </div>
          </div>
          <Zap className="h-8 w-8 text-primary/30" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 rounded-xl bg-accent/20 border border-border/40 max-w-3xl">
        {[
          { id: "overview", label: "Executive Summary" },
          { id: "queue", label: "Prioritized Queue" },
          { id: "graph", label: "Knowledge Graph" },
          { id: "correlations", label: "Causal Chains" },
          { id: "predictions", label: "Risk Forecasts" },
          { id: "memory", label: "Brain Memory & Learning" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Panels */}
      <div className="grid gap-6">
        
        {/* ==================================================================== */}
        {/* 1. OVERVIEW TAB */}
        {/* ==================================================================== */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card glow className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Engineering Maturity Breakdown</span>
                </CardTitle>
                <CardDescription>Maturity indices evaluated across structural and execution layers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Architectural Modularity", score: data?.maturityIndexes?.modularity || 4, desc: "C4 strict boundary conformance" },
                  { name: "Verification & Testing", score: data?.maturityIndexes?.testing || 4, desc: "Static coverage and regression assertions" },
                  { name: "Reference Documentation", score: data?.maturityIndexes?.documentation || 3, desc: "Freshness and synchronization mapping" },
                  { name: "Observability Coverage", score: data?.maturityIndexes?.observability || 4, desc: "Tracing span and log density" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">{item.name}</span>
                      <span className="font-bold text-primary">Level {item.score} / 5</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent/30 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(item.score / 5) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <span>Top Engineering Opportunities</span>
                </CardTitle>
                <CardDescription>EIP recommended changes providing maximum return on engineering investment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data?.topOpportunities || []).map((opp: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-border/20">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{opp.title}</span>
                      <span className="text-xs text-muted-foreground">Effort: <span className="capitalize font-bold">{opp.effort}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 font-bold bg-emerald-500/5">
                        +{opp.expectedValue} Value
                      </Badge>
                      <button 
                        onClick={() => setActiveTab("queue")}
                        className="text-xs font-bold text-primary hover:underline flex items-center cursor-pointer"
                      >
                        Details <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="space-y-2 border-t border-border/20 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Active Risks:</div>
                  {(data?.topRisks || []).map((risk: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <div className="flex items-center space-x-2 text-red-400">
                        <Flame className="h-3.5 w-3.5" />
                        <span className="font-semibold">{risk.name}</span>
                      </div>
                      <Badge variant="destructive" className="text-[10px] font-extrabold uppercase py-0 px-1">
                        {risk.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. PRIORITIZED QUEUE TAB */}
        {/* ==================================================================== */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <h2 className="text-xl font-bold">Engineering Decision Support System</h2>
              <span className="text-xs text-muted-foreground">Sorted by priority rating (value/effort)</span>
            </div>

            {priorityQueue.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border/40 rounded-xl bg-accent/5">
                No active prioritizations generated. Scan the system to refresh.
              </div>
            ) : (
              <div className="space-y-6">
                {priorityQueue.map((rec: any) => (
                  <Card key={rec.id} className={`glass-panel border-border/40 ${rec.status === "implemented" ? "opacity-75" : ""}`}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="secondary" className="font-extrabold text-[10px] bg-primary/20 text-primary">
                            Priority Score: {rec.priorityScore}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            Status: {rec.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-bold">{rec.title}</CardTitle>
                        <CardDescription className="text-xs">{rec.architecturalImpact}</CardDescription>
                      </div>
                      {rec.status === "pending" && (
                        <div className="flex items-center space-x-1 shrink-0">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            leftIcon={<Check className="h-4 w-4" />}
                            onClick={() => handleAction(rec.id, "approve", "Approved by Executive control panel.")}
                            disabled={actionLoadingId === rec.id}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            leftIcon={<X className="h-4 w-4" />}
                            onClick={() => handleAction(rec.id, "reject", "Rejected due to effort constraints.")}
                            disabled={actionLoadingId === rec.id}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {rec.status === "approved" && (
                        <div className="flex items-center space-x-1 shrink-0">
                          <Button 
                            variant="primary" 
                            size="sm"
                            leftIcon={<CheckCircle2 className="h-4 w-4" />}
                            onClick={() => setShowOutcomeDialogId(rec.id)}
                          >
                            Complete
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Problem Statement</span>
                            <p className="text-xs text-foreground font-medium">{rec.problemStatement}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Primary Cause</span>
                            <p className="text-xs text-muted-foreground">{rec.rootCause}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Recommended Action</span>
                            <p className="text-xs font-semibold text-primary">{rec.recommendedAction}</p>
                          </div>
                        </div>

                        <div className="space-y-2 bg-accent/5 p-3 rounded-lg border border-border/20">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Decision Support Metrics</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Business Value: <span className="font-bold text-foreground">{rec.estimatedBusinessValue} / 10</span></div>
                            <div>Risk Reduction: <span className="font-bold text-foreground">{rec.estimatedRiskReduction} / 10</span></div>
                            <div>Engineering Effort: <span className="font-bold capitalize text-foreground">{rec.estimatedEngineeringEffort}</span></div>
                            <div>Execution Cost: <span className="font-bold text-foreground">${rec.estimatedCostUsd} USD</span></div>
                          </div>
                          <div className="border-t border-border/20 pt-2 mt-2 text-xs">
                            <span className="font-semibold block">Rollback Strategy:</span>
                            <span className="text-[11px] text-muted-foreground">{rec.rollbackStrategy}</span>
                          </div>
                        </div>
                      </div>

                      {/* Alternate Options Comparison */}
                      <div className="border-t border-border/20 pt-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Alternatives Analysis</span>
                        <div className="space-y-2">
                          {rec.alternativeActions.map((alt: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded bg-accent/10 border border-border/10 text-xs">
                              <span className="font-bold block text-foreground mb-1">Option: {alt.action}</span>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-emerald-500"><span className="font-semibold">Pros:</span> {alt.pros}</div>
                                <div className="text-red-400"><span className="font-semibold">Cons:</span> {alt.cons}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {showOutcomeDialogId === rec.id && (
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 mt-4">
                          <h4 className="text-sm font-bold text-primary">Record Execution Outcome (Continuous Learning Feedback)</h4>
                          <p className="text-xs text-muted-foreground">Measure effectiveness: Did the recommendation resolve the root causes?</p>
                          <textarea
                            placeholder="Enter execution results, e.g. Grounding index increased to 94%, query latency dropped to 4ms."
                            value={feedbackInput[rec.id] || ""}
                            onChange={(e) => setFeedbackInput({ ...feedbackInput, [rec.id]: e.target.value })}
                            className="w-full p-2 text-xs rounded border border-border/60 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleAction(rec.id, "implemented", feedbackInput[rec.id])}
                            >
                              Submit Outcome
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setShowOutcomeDialogId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. KNOWLEDGE GRAPH TAB */}
        {/* ==================================================================== */}
        {activeTab === "graph" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Dynamic Digital Twin Architecture Graph</h2>
                <p className="text-xs text-muted-foreground">Visualizes live links between files, models, services, workflows, and engineers.</p>
              </div>
              {selectedNode && (
                <Button variant="outline" size="sm" onClick={() => setSelectedNode(null)}>
                  Clear Selection
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Interactive SVG Graph Area */}
              <div className="md:col-span-2 glass-panel p-4 rounded-xl border border-border/40 bg-accent/5 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                <svg className="w-full h-full min-h-[380px]" viewBox="0 0 600 380">
                  {/* Edges/Links */}
                  {graph.edges.map((edge: any, idx: number) => {
                    const srcNode = graph.nodes.find((n: any) => n.id === edge.source);
                    const tgtNode = graph.nodes.find((n: any) => n.id === edge.target);
                    if (!srcNode || !tgtNode) return null;

                    // Simulated node coordinate offsets for graph rendering
                    const coordinates = getSimCoords(edge.source, edge.target);
                    
                    return (
                      <line
                        key={idx}
                        x1={coordinates.x1}
                        y1={coordinates.y1}
                        x2={coordinates.x2}
                        y2={coordinates.y2}
                        stroke="rgba(var(--text-muted), 0.15)"
                        strokeWidth="1.5"
                        strokeDasharray={edge.type === "references" ? "4" : undefined}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {graph.nodes.map((node: any, idx: number) => {
                    const coords = getNodeCoords(node.id);
                    const isSelected = selectedNode?.id === node.id;
                    let nodeColor = "#3b82f6"; // primary blue
                    if (node.type === "service") nodeColor = "#10b981"; // emerald
                    if (node.type === "model") nodeColor = "#8b5cf6"; // purple
                    if (node.type === "adr") nodeColor = "#f59e0b"; // amber
                    if (node.type === "expert") nodeColor = "#ec4899"; // pink
                    if (node.type === "database") nodeColor = "#06b6d4"; // cyan
                    
                    return (
                      <g 
                        key={idx} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedNode(node)}
                      >
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={isSelected ? 10 : 7}
                          fill={nodeColor}
                          className="transition-all hover:scale-125"
                          stroke={isSelected ? "#ffffff" : undefined}
                          strokeWidth={isSelected ? 2 : undefined}
                        />
                        <text
                          x={coords.x}
                          y={coords.y - 12}
                          textAnchor="middle"
                          fill="rgba(255, 255, 255, 0.85)"
                          fontSize="9"
                          fontWeight="bold"
                          className="pointer-events-none select-none"
                        >
                          {node.label.slice(0, 16)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[8px] uppercase font-bold text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/40">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Service</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" /> Model</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> ADR</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-500" /> SME</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> File</span>
                </div>
              </div>

              {/* Node Inspector Details Panel */}
              <div className="glass-panel p-4 rounded-xl border border-border/40 bg-accent/5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Digital Twin Node Inspector</h3>
                
                {selectedNode ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">ID / Type</span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] capitalize">{selectedNode.type}</Badge>
                        <span className="font-mono text-muted-foreground">{selectedNode.id}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Label</span>
                      <div className="font-bold text-sm text-primary">{selectedNode.label}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Status Indicator</span>
                      <Badge variant={selectedNode.status === "healthy" ? "success" : "warning"} className="mt-0.5">
                        {selectedNode.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Metadata Manifest</span>
                      <pre className="mt-1 p-2 rounded bg-black/40 border border-border/20 text-[10px] font-mono text-cyan-400 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedNode.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[280px] text-center text-xs text-muted-foreground">
                    <Network className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <span>Select an architecture node in the graph viewport to inspect its properties and active links.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 4. CAUSAL CORRELATIONS TAB */}
        {/* ==================================================================== */}
        {activeTab === "correlations" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Causal Correlation Chains</h2>
            <p className="text-xs text-muted-foreground">Cross-domain telemetry event sequences isolated by the unified reasoning engine.</p>

            <div className="space-y-6">
              {correlations.map((chain: any) => (
                <Card key={chain.id} className="glass-panel border-border/40">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-bold bg-amber-500/5">
                        Confidence: {(chain.confidenceScore * 100).toFixed(0)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{new Date(chain.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <CardTitle className="text-base font-bold">{chain.name}</CardTitle>
                    <CardDescription className="text-xs">{chain.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Visual Pathway timeline */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 py-2">
                      {chain.events.map((evt: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <div className="flex items-start space-x-2 bg-accent/20 p-2.5 rounded-lg border border-border/40 max-w-[200px] shrink-0">
                            {getDomainIcon(evt.domain)}
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">{evt.domain}</span>
                              <div className="text-[11px] font-semibold truncate max-w-[150px]">{evt.name}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-2">{evt.description}</p>
                            </div>
                          </div>
                          {idx < chain.events.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 hidden md:block shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 border-t border-border/20 pt-4 text-xs">
                      <div>
                        <span className="font-bold text-amber-500 block mb-1">Primary Diagnose Cause:</span>
                        <p className="text-muted-foreground">{chain.primaryCause}</p>
                      </div>
                      <div>
                        <span className="font-bold text-muted-foreground block mb-1">Contributing Factors:</span>
                        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                          {chain.contributingFactors.map((f: string, idx: number) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 5. RISK FORECASTS TAB */}
        {/* ==================================================================== */}
        {activeTab === "predictions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Predictive Risk Engineering</h2>
            <p className="text-xs text-muted-foreground">System erosion forecasts, accuracy regressions, and capacity saturation bounds.</p>

            <div className="grid gap-6 md:grid-cols-2">
              {predictions.map((pred: any) => (
                <Card key={pred.id} className="glass-panel border-border/40">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">{pred.category}</Badge>
                      <Badge variant="secondary" className="text-[10px] font-extrabold bg-primary/20 text-primary">
                        Probability: {(pred.probability * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold mt-2">{pred.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">{pred.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-accent/5 p-2 rounded border border-border/20">
                      <div>Time-to-Impact: <span className="font-bold text-amber-500">{pred.estimatedTime}</span></div>
                      <div>Confidence Score: <span className="font-bold text-foreground">{(pred.confidenceScore * 100).toFixed(0)}%</span></div>
                      <div>Business Impact: <span className="font-bold capitalize text-foreground">{pred.businessImpact}</span></div>
                      <div>Operational Impact: <span className="font-bold capitalize text-foreground">{pred.operationalImpact}</span></div>
                    </div>
                    <div>
                      <span className="font-semibold block text-primary">Recommended Prevention Strategy:</span>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{pred.recommendedPrevention}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 6. BRAIN MEMORY & LEARNING TAB */}
        {/* ==================================================================== */}
        {activeTab === "memory" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Historical Brain Memory & Outcomes</h2>
            <p className="text-xs text-muted-foreground">Audit records verifying EIP recommendation effectiveness and continuous learning adjustments.</p>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Scorecard panel */}
              <div className="md:col-span-1 glass-panel p-4 rounded-xl border border-border/40 bg-accent/5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">EIP Accuracy Ratings</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Forecast Saturation Accuracy</span>
                      <span className="text-emerald-500">96.5%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: "96.5%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Engineering Effort Estimation Accuracy</span>
                      <span className="text-primary">82.0%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "82%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Mitigation Effectiveness Rate</span>
                      <span className="text-cyan-400">94.1%</span>
                    </div>
                    <div className="h-1.5 w-full bg-accent/30 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: "94.1%" }} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/20 pt-3 text-[11px] text-muted-foreground">
                  The Brain updates its scoring parameters whenever human engineers submit resolution feedbacks, reducing scheduling risk over time.
                </div>
              </div>

              {/* Memory Outcomes Ledger */}
              <div className="md:col-span-2 glass-panel p-4 rounded-xl border border-border/40 bg-accent/5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Historical Recommendation outcomes</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {outcomes.map((log: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-border/20 bg-black/20 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">{log.title}</span>
                        <Badge variant="success">RESOLVED</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                        <div>Value ROI: <span className="text-emerald-500 font-semibold">+{log.expectedValue} Exp</span></div>
                        <div>Cost Saving: <span className="text-cyan-400">${log.costSavingUsd?.toFixed(4) || "0.0000"}</span></div>
                        <div>Latency Gain: <span className="font-semibold text-foreground">-{log.performanceGainMs || 0}ms</span></div>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {new Date(log.timestamp).toLocaleDateString()} &bull; Effort: {log.expectedEffort}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Simulated SVG node coordinates helper
function getNodeCoords(id: string): { x: number; y: number } {
  const mapping: Record<string, { x: number; y: number }> = {
    "svc:ollama": { x: 120, y: 300 },
    "svc:litellm": { x: 260, y: 220 },
    "svc:aegisos": { x: 420, y: 160 },
    "svc:omniroute": { x: 480, y: 280 },
    "db:sqlite": { x: 500, y: 80 },
    "file:platform-kernel": { x: 100, y: 120 },
    "expert:usr-admin-01": { x: 300, y: 60 },
    "expert:usr-operator-02": { x: 520, y: 220 },
    "adr:ADR-009-Autonomic-Operating-System-Architecture": { x: 150, y: 50 },
    "adr:ADR-010-Executive-Control-Plane": { x: 230, y: 40 },
    "adr:ADR-011-Event-Driven-System-Decoupling": { x: 360, y: 40 },
    "adr:ADR-012-Cognitive-Observability-And-Continuous-Evaluation": { x: 200, y: 100 },
    "model:gemma4:latest": { x: 60, y: 200 },
    "model:gemma2:9b": { x: 80, y: 250 },
    "model:gemma4:26b": { x: 180, y: 160 },
    "model:gemma4:31b": { x: 220, y: 280 },
    "model:qwen2.5:14b": { x: 340, y: 250 },
    "model:qwen3:14b": { x: 380, y: 320 },
    "model:qwen3:30b": { x: 300, y: 310 },
    "model:qwen3.6:27b": { x: 140, y: 220 },
    "model:deepseek-r1:32b": { x: 120, y: 170 },
    "model:gpt-oss:20b": { x: 210, y: 210 },
    "model:all-minilm:latest": { x: 310, y: 180 },
    "model:smollm:135m": { x: 80, y: 310 },
    "wf:sample": { x: 450, y: 220 }
  };
  return mapping[id] || { x: 100 + Math.random() * 400, y: 50 + Math.random() * 250 };
}

// Coordinate links helper
function getSimCoords(srcId: string, tgtId: string) {
  const p1 = getNodeCoords(srcId);
  const p2 = getNodeCoords(tgtId);
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

// Dynamic icons map helper
function getDomainIcon(domain: string) {
  const classes = "h-4 w-4 mt-0.5 shrink-0";
  switch (domain) {
    case "observability": return <Activity className={`${classes} text-primary`} />;
    case "architecture": return <Network className={`${classes} text-cyan-400`} />;
    case "model": return <Brain className={`${classes} text-purple-400`} />;
    case "knowledge": return <GitCommit className={`${classes} text-amber-400`} />;
    case "workflow": return <Workflow className={`${classes} text-pink-400`} />;
    case "database": return <Database className={`${classes} text-cyan-500`} />;
    default: return <Cpu className={`${classes} text-muted-foreground`} />;
  }
}
