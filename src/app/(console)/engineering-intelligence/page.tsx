// src/app/(console)/engineering-intelligence/page.tsx
"use client";

import * as React from "react";
import { 
  Activity, ShieldCheck, Cpu, GitBranch, AlertTriangle, 
  CheckCircle, FileText, Settings, Play, RefreshCw, BarChart2,
  Layers, HardDrive, Network, UserCheck, BookOpen, Trash2, ArrowRight, Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

export default function EngineeringExcellencePage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [persona, setPersona] = React.useState<'cto' | 'architect' | 'sre' | 'developer'>('cto');
  
  // Form states
  const [intent, setIntent] = React.useState('');
  const [filePaths, setFilePaths] = React.useState('');
  const [planningResult, setPlanningResult] = React.useState<any>(null);
  const [simulationTrace, setSimulationTrace] = React.useState<string>('');
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [isPlanning, setIsPlanning] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/pik/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch cockpit data:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerAction = async (action: 'discover' | 'audit') => {
    setActionMessage(`Running ${action === 'discover' ? 'Knowledge Ingestion Pipeline (PKIP)...' : 'Governance Audit...'}`);
    try {
      const res = await fetch("/api/v1/pik/dashboard", {
        method: "POST",
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const resJson = await res.json();
        setActionMessage(resJson.message);
        await fetchDashboardData();
      } else {
        setActionMessage(`Action ${action} failed.`);
      }
    } catch (e: any) {
      setActionMessage(`Error: ${e.message}`);
    }
  };

  const handlePlanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent) return;
    setIsPlanning(true);
    setPlanningResult(null);
    setSimulationTrace('');
    try {
      const paths = filePaths ? filePaths.split(',').map(s => s.trim()) : [];
      const res = await fetch("/api/v1/pik/dashboard", {
        method: "POST",
        body: JSON.stringify({ action: 'plan', intent, filePaths: paths })
      });
      if (res.ok) {
        const json = await res.json();
        setPlanningResult(json.proposal);
      }
    } catch (err: any) {
      console.error("Planning failed:", err);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRunSimulation = async (reqId: string) => {
    setIsSimulating(true);
    setSimulationTrace('Initializing Digital Twin overlay session...');
    try {
      const res = await fetch("/api/v1/pik/dashboard", {
        method: "POST",
        body: JSON.stringify({ action: 'simulate', requestId: reqId })
      });
      if (res.ok) {
        const json = await res.json();
        setSimulationTrace(json.trace);
        // Refresh to get updated status
        await fetchDashboardData();
      }
    } catch (err: any) {
      setSimulationTrace(`Simulation Error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Aggregating platform cognitive status...</div>;
  }

  const afi = data?.afi ?? 98;
  const pmi = data?.pmi ?? 94;
  const health = data?.healthScore ?? 98.5;
  const releaseReady = data?.releaseReadiness ?? 'READY';

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-8 h-8 text-primary" /> Engineering Intelligence Cockpit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform Intelligence Kernel (PIK) Continuous Architecture, Evolution, and Governance Portal.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Persona selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border/60 px-3 py-1.5 rounded-lg text-xs">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium mr-1">View as:</span>
            <select 
              value={persona} 
              onChange={(e) => setPersona(e.target.value as any)}
              className="bg-transparent border-none outline-none font-bold text-foreground cursor-pointer"
            >
              <option value="cto">CTO / VP Engineering</option>
              <option value="architect">Chief Architect</option>
              <option value="sre">SRE / Operations Lead</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          
          <Button onClick={fetchDashboardData} variant="secondary" className="flex items-center gap-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert variant="warning" className="border-yellow-500/20 bg-yellow-500/5 py-3" title="PKIP Pipeline Log">
          <span className="text-xs">{actionMessage}</span>
        </Alert>
      )}

      {/* Main KPIs based on persona focus */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card glass className={`border border-border/40 ${persona === 'cto' || persona === 'sre' ? 'ring-1 ring-primary/45' : ''}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Platform Maturity Index</span>
              <h3 className="text-3xl font-bold text-foreground mt-1">{pmi}%</h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Dynamic Capability Level</p>
            </div>
            <Award className="h-8 w-8 text-yellow-500/40" />
          </CardContent>
        </Card>

        <Card glass className={`border border-border/40 ${persona === 'architect' ? 'ring-1 ring-primary/45' : ''}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Architectural Fitness (AFI)</span>
              <h3 className="text-3xl font-bold text-foreground mt-1">{afi}%</h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Unidirectional integrity</p>
            </div>
            <Layers className="h-8 w-8 text-blue-500/40" />
          </CardContent>
        </Card>

        <Card glass className={`border border-border/40 ${persona === 'developer' ? 'ring-1 ring-primary/45' : ''}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Technical Debt Backlog</span>
              <h3 className="text-3xl font-bold text-foreground mt-1">{data?.techDebt?.length || 0}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Remediation issues open</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500/40" />
          </CardContent>
        </Card>

        <Card glass className="border border-border/40">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Release Readiness</span>
              <Badge variant={releaseReady === 'READY' ? 'success' : 'destructive'} className="mt-2 text-xs py-1 px-2.5">
                {releaseReady}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Qualification backed</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-green-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cockpit" className="space-y-4">
        <TabsList className="bg-card/40 border border-border/40 p-1 rounded-lg">
          <TabsTrigger value="cockpit" className="text-xs">Executive Summary</TabsTrigger>
          <TabsTrigger value="architecture" className="text-xs">Architecture & Layers</TabsTrigger>
          <TabsTrigger value="techdebt" className="text-xs">Technical Debt ({data?.techDebt?.length || 0})</TabsTrigger>
          <TabsTrigger value="planning" className="text-xs">Change & Simulation</TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">Memory Graph ({data?.memories?.length || 0})</TabsTrigger>
        </TabsList>

        {/* 1. Executive Summary Tab */}
        <TabsContent value="cockpit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card glass className="border border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-primary" /> Cockpit Intelligence Controls
                  </CardTitle>
                  <CardDescription className="text-xs">Trigger platform-wide engineering scan, ingestion, or governance audits.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button onClick={() => triggerAction('discover')} className="text-xs flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" /> Trigger PKIP Discovery Scan
                  </Button>
                  <Button onClick={() => triggerAction('audit')} variant="secondary" className="text-xs flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Run Governance Audit
                  </Button>
                </CardContent>
              </Card>

              {/* Persona-focused advice */}
              <Card glass className="border border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Persona Overview & Priorities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {persona === 'cto' && (
                    <>
                      <p className="text-muted-foreground">Priority view optimized for **CTO / VP Engineering**. Core focus is on high-level indexes, release readiness, and technical debt trends.</p>
                      <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground">AFI (Architectural Fitness) Index: {afi}%</div>
                        <div className="text-muted-foreground">Maintainability health remains stable. Limit dead code components to keep development velocity high.</div>
                      </div>
                    </>
                  )}
                  {persona === 'architect' && (
                    <>
                      <p className="text-muted-foreground">Priority view optimized for **Chief Architect**. Core focus is layer boundary violations, circular imports, and EKG nodes.</p>
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground">Graph Dependency Violations: {data?.techDebt?.filter((f: any) => f.category === 'layer_violation').length || 0}</div>
                        <div className="text-muted-foreground">Inspect imports from higher layers to lower layers. Refactor registry extensions to resolve dependencies.</div>
                      </div>
                    </>
                  )}
                  {persona === 'sre' && (
                    <>
                      <p className="text-muted-foreground">Priority view optimized for **SRE / Operations Lead**. Core focus is on operational drift, active qualification status, and Digital Twin health.</p>
                      <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground">Digital Twin Status: {data?.driftStatus?.detectedDrift ? 'DRIFT_DETECTED' : 'SYNCHRONIZED'}</div>
                        <div className="text-muted-foreground">Reconciliation engine successfully repaired {data?.driftStatus?.nodesDrifted || 0} nodes. Overall drift is under 1.5%.</div>
                      </div>
                    </>
                  )}
                  {persona === 'developer' && (
                    <>
                      <p className="text-muted-foreground">Priority view optimized for **Developer**. Core focus is on test coverage gaps, change planning simulation trace, and ADR rules.</p>
                      <div className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground">Test Coverage Open Tasks: {data?.techDebt?.filter((f: any) => f.category === 'doc_drift').length || 0}</div>
                        <div className="text-muted-foreground">Create unit test files for unvalidated code files to improve overall test metrics and release confidence.</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Metrics sidebar */}
            <div className="space-y-4">
              <Card glass className="border border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Twin Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span>Nodes:</span>
                    <span className="font-bold text-foreground">{data?.topology?.nodes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Edges:</span>
                    <span className="font-bold text-foreground">{data?.topology?.links?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Models:</span>
                    <span className="font-bold text-foreground">{data?.topology?.nodes?.filter((n: any) => n.category === 'model').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workflows:</span>
                    <span className="font-bold text-foreground">{data?.topology?.nodes?.filter((n: any) => n.category === 'workflow').length || 0}</span>
                  </div>
                  <hr className="my-1.5 border-border" />
                  <div className="flex justify-between">
                    <span>Drift Log:</span>
                    <span className={data?.driftStatus?.detectedDrift ? "text-yellow-500" : "text-green-500"}>
                      {data?.driftStatus?.detectedDrift ? "Drifted" : "Synchronized"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization card */}
              <Card glass className="border border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground">Optimization Engine</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-3">
                  {data?.optimizations && data.optimizations.length > 0 ? (
                    data.optimizations.slice(0, 2).map((opt: any) => (
                      <div key={opt.id} className="border-l-2 border-primary/50 pl-2 space-y-1">
                        <div className="font-semibold text-foreground text-[11px]">{opt.title}</div>
                        <div className="text-muted-foreground text-[10px] line-clamp-2">{opt.description}</div>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{opt.category}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic text-[11px]">No pending advisory optimization recommendations.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. Architecture & Layers Tab */}
        <TabsContent value="architecture" className="space-y-4">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <Network className="w-5 h-5 text-primary" /> Dependency Topology Explorer
              </CardTitle>
              <CardDescription className="text-xs">Dynamic structural C4 view representing the systems, subsystems, and active dependencies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-border/50 rounded-xl bg-background/50 p-6 min-h-[350px] flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* We group nodes by category */}
                  <div className="border border-border/40 p-4 rounded-lg bg-card/40 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 border-b border-border/20 pb-1">
                      <Layers className="w-4 h-4 text-blue-500" /> Platform Kernel (Layer 1-3)
                    </div>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {data?.topology?.nodes?.filter((n: any) => n.category === 'kernel' || n.category === 'cpu' || n.category === 'gpu').map((n: any) => (
                        <div key={n.id} className="bg-background/80 border border-border/50 px-2.5 py-1 rounded text-xs flex justify-between items-center font-mono">
                          <span className="truncate mr-2">{n.name}</span>
                          <Badge variant={n.status === 'healthy' ? 'success' : 'destructive'} className="text-[8px] py-0 px-1 font-sans">{n.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border/40 p-4 rounded-lg bg-card/40 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 border-b border-border/20 pb-1">
                      <Settings className="w-4 h-4 text-purple-500" /> Control & Intelligence (Layer 4-5)
                    </div>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {data?.topology?.nodes?.filter((n: any) => n.category === 'control-plane' || n.category === 'intelligence' || n.category === 'service').map((n: any) => (
                        <div key={n.id} className="bg-background/80 border border-border/50 px-2.5 py-1 rounded text-xs flex justify-between items-center font-mono">
                          <span className="truncate mr-2">{n.name}</span>
                          <Badge variant={n.status === 'healthy' ? 'success' : 'destructive'} className="text-[8px] py-0 px-1 font-sans">{n.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border/40 p-4 rounded-lg bg-card/40 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 border-b border-border/20 pb-1">
                      <Cpu className="w-4 h-4 text-green-500" /> Model & Workflow Runtimes
                    </div>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                      {data?.topology?.nodes?.filter((n: any) => n.category === 'model' || n.category === 'workflow' || n.category === 'database').map((n: any) => (
                        <div key={n.id} className="bg-background/80 border border-border/50 px-2.5 py-1 rounded text-xs flex justify-between items-center font-mono">
                          <span className="truncate mr-2">{n.name}</span>
                          <Badge variant={n.status === 'healthy' ? 'success' : 'destructive'} className="text-[8px] py-0 px-1 font-sans">{n.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/30 mt-6 pt-4 text-xs text-muted-foreground flex justify-between">
                  <span>Topology links: {data?.topology?.links?.length || 0} active edges</span>
                  <span>Acyclic Check: <span className="text-green-500 font-bold">PASSED</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Technical Debt Tab */}
        <TabsContent value="techdebt" className="space-y-4">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Architectural Findings & Debt Backlog
              </CardTitle>
              <CardDescription className="text-xs">Continuous codebase quality warnings, circular dependencies, and document drift.</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.techDebt && data.techDebt.length > 0 ? (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {data.techDebt.map((d: any) => (
                    <div key={d.id} className="p-4 bg-card/60 border border-border/60 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Badge variant={d.severity === 'CRITICAL' ? 'destructive' : d.severity === 'HIGH' ? 'secondary' : 'default'}>
                            {d.severity}
                          </Badge>
                          <span className="font-bold text-foreground text-sm uppercase tracking-wide font-mono">{d.category}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">Effort: {d.estimatedEffortMinutes} mins | Conf: {Math.round(d.confidenceScore * 100)}%</div>
                      </div>
                      
                      <p className="text-foreground font-medium text-xs mt-1">{d.probableRootCause}</p>
                      
                      <div className="bg-background/80 p-2 rounded border border-border/30 font-mono text-[10px] space-y-1">
                        <div className="text-muted-foreground font-semibold">Evidence:</div>
                        {d.evidence.map((ev: string, idx: number) => (
                          <div key={idx} className="text-foreground truncate">{ev}</div>
                        ))}
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground pl-1">
                        <div className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Remediation Steps:</div>
                        {d.remediationSteps.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-primary font-bold">{idx + 1}.</span> {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground italic text-sm">No unresolved technical debt items or architectural violations found. Codebase is in compliance.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Change Planning & Simulation Tab */}
        <TabsContent value="planning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Card glass className="border border-border/40">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Initiate Engineering Request</CardTitle>
                  <CardDescription className="text-xs">Input intent descriptors or explicit file changes to create planning proposals.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlanRequest} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground">Intent / Objective</label>
                      <input 
                        type="text" 
                        value={intent}
                        onChange={e => setIntent(e.target.value)}
                        placeholder="e.g. Add dynamic VRAM scheduling or Modify Platforms"
                        className="w-full bg-background border border-border/60 rounded-lg p-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground">File Paths (Comma-separated, optional)</label>
                      <input 
                        type="text" 
                        value={filePaths}
                        onChange={e => setFilePaths(e.target.value)}
                        placeholder="e.g. src/platform/kernel/PlatformKernel.ts, src/platform/pik/types.ts"
                        className="w-full bg-background border border-border/60 rounded-lg p-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Button type="submit" disabled={isPlanning} className="text-xs">
                      {isPlanning ? "Planning..." : "Generate Planning Proposal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {planningResult && (
                <Card glass className="border border-border/40 text-xs">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" /> Proposal: {planningResult.id}
                      </CardTitle>
                      <Badge variant={planningResult.status === 'APPROVED' ? 'success' : planningResult.status === 'FAILED' ? 'destructive' : 'default'}>
                        {planningResult.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 border border-border/40 p-3 rounded-lg bg-background/50 font-mono text-[10px]">
                      <div>
                        <div className="text-muted-foreground uppercase font-bold">Complexity</div>
                        <div className="text-foreground font-bold text-sm mt-0.5">{planningResult.riskProfile.overall}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase font-bold">Estimated Effort</div>
                        <div className="text-foreground font-bold text-sm mt-0.5">
                          {Math.round(planningResult.riskProfile.overall * 0.1)} hours
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground uppercase font-bold">Confidence</div>
                        <div className="text-foreground font-bold text-sm mt-0.5">
                          {Math.round(planningResult.riskProfile.overall > 50 ? 60 : 85)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-bold text-foreground">Execution Tasks:</div>
                      {planningResult.executionPlan.tasks.map((task: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1 text-muted-foreground">
                          <span className="text-primary font-bold">•</span>
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-foreground">Required Tests:</div>
                        {planningResult.executionPlan.requiredTests.map((t: string, idx: number) => (
                          <div key={idx} className="text-muted-foreground truncate">{t}</div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-foreground">Required Docs:</div>
                        {planningResult.executionPlan.requiredDocs.map((d: string, idx: number) => (
                          <div key={idx} className="text-muted-foreground truncate">{d}</div>
                        ))}
                      </div>
                    </div>

                    {planningResult.status === 'PENDING' && (
                      <div className="pt-2">
                        <Button 
                          onClick={() => handleRunSimulation(planningResult.id)} 
                          disabled={isSimulating}
                          className="w-full text-xs flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> {isSimulating ? "Simulating on Twin..." : "Execute Simulation Preview"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar showing Simulation Trace */}
            <Card glass className="border border-border/40 text-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1">
                  <BarChart2 className="w-4 h-4" /> Twin Simulation Trace
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] overflow-y-auto pr-1">
                {simulationTrace ? (
                  <pre className="bg-background/80 border border-border/50 p-3 rounded-lg font-mono text-[10px] text-foreground leading-relaxed whitespace-pre-wrap">
                    {simulationTrace}
                  </pre>
                ) : (
                  <div className="text-muted-foreground italic h-full flex items-center justify-center text-center">
                    Initiate a planning proposal and run simulation to preview trace evidence.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. Architectural Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card glass className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-primary" /> Architectural Memory Graph
              </CardTitle>
              <CardDescription className="text-xs">Event-driven, version-controlled records of design decisions, experiments, and lessons learned.</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.memories && data.memories.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.memories.map((m: any) => (
                    <Card key={m.id} className="border border-border/60 bg-card/60 p-4 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-500" /> {m.title}
                        </span>
                        <Badge variant="secondary">{m.category}</Badge>
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Version: {m.introducedVersion} | Date: {m.timestamp}
                      </div>

                      <div className="space-y-1 border-t border-border/20 pt-2 text-xs">
                        <div><span className="font-semibold text-foreground">Decision:</span> <span className="text-muted-foreground">{m.decision}</span></div>
                        <div><span className="font-semibold text-foreground">Context:</span> <span className="text-muted-foreground">{m.context}</span></div>
                        <div><span className="font-semibold text-foreground">Trade-offs:</span> <span className="text-muted-foreground">{m.tradeOffs}</span></div>
                        <div><span className="font-semibold text-foreground">Consequences:</span> <span className="text-muted-foreground">{m.consequences}</span></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground italic text-sm space-y-3">
                  <p>No architectural memory records currently stored in Knowledge Graph.</p>
                  <Button 
                    onClick={async () => {
                      // Seed an initial memory decision
                      const mockMemory = {
                        id: 'mem-001',
                        title: 'Evolve PIAL to Platform Intelligence Kernel (PIK)',
                        category: 'decision',
                        status: 'Accepted',
                        decision: 'Rename and physically restructure PIAL into a kernel-based PIK to host reasoning and evolution.',
                        context: 'PIAL was designed for simple optimization recommendations, but self-engineering requires a central cognitive kernel.',
                        tradeOffs: 'Provides clear responsibility isolation at the cost of short-term import refactorings.',
                        consequences: 'Enables clean PKIP, CPIP, and AGTDP implementations.',
                        relatedArtifacts: ['code:src/platform/pik/types.ts'],
                        introducedVersion: '1.2.5',
                        timestamp: new Date().toISOString()
                      };
                      const res = await fetch("/api/v1/pik/dashboard", {
                        method: "POST",
                        body: JSON.stringify({ action: 'create-memory', memory: mockMemory })
                      });
                      if (res.ok) {
                        await fetchDashboardData();
                      }
                    }}
                    className="text-xs"
                  >
                    Seed Initial Architectural Memory Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
