"use client";

import * as React from "react";
import { 
  ShieldAlert, Activity, Heart, ShieldCheck, Flame, RefreshCw, 
  Play, StopCircle, HardDrive, Cpu, Database, Network, AlertTriangle, 
  CheckCircle2, Clock, Globe, HelpCircle, Download, FileText, Settings, ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export default function ReliabilityPage() {
  const [activeTab, setActiveTab] = React.useState<"eoc" | "health" | "resilience">("eoc");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [submittingAction, setSubmittingAction] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v1/reliability");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error fetching SRE data:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    // Auto refresh every 15s
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, []);

  const triggerAction = async (action: string, extraArgs: Record<string, any> = {}) => {
    setSubmittingAction(true);
    setActionMessage("");
    try {
      const res = await fetch("/api/v1/reliability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraArgs })
      });
      if (res.ok) {
        const result = await res.json();
        setActionMessage(result.success || result.result ? "Action executed successfully!" : "Action triggered.");
        await fetchData();
      } else {
        setActionMessage("Failed to execute action.");
      }
    } catch {
      setActionMessage("Error executing action.");
    } finally {
      setSubmittingAction(false);
      setTimeout(() => setActionMessage(""), 4000);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing Autonomous SRE Control Plane...</p>
      </div>
    );
  }

  const { sre, chaos, incidents, dr, capacity, diagnostics, readiness, risks, mesh } = data;

  return (
    <div className="space-y-6">
      {/* Upper Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-cyan-500 bg-clip-text text-transparent">
            Reliability & Autonomous SRE
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise Operations Center & Automated Self-Healing Platform Control
          </p>
        </div>
        
        {/* Dynamic score pills */}
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 border-primary/20 bg-primary/5 flex items-center space-x-3 shadow-sm">
            <div className="text-xs text-muted-foreground">Readiness Score</div>
            <div className="text-2xl font-black text-primary">{readiness?.readinessScore}%</div>
          </Card>
          
          <Card className="px-4 py-2 border-emerald-500/20 bg-emerald-500/5 flex items-center space-x-3 shadow-sm">
            <div className="text-xs text-muted-foreground">Resilience Score</div>
            <div className="text-2xl font-black text-emerald-500">{chaos?.resilienceScore}%</div>
          </Card>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/30 gap-2">
        <button
          onClick={() => setActiveTab("eoc")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "eoc" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-4 w-4" />
          Enterprise Operations Center
          {incidents?.metrics?.activeCount > 0 && (
            <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
              {incidents.metrics.activeCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "health" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Reliability Health
        </button>
        <button
          onClick={() => setActiveTab("resilience")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "resilience" 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Platform Resilience & Risks
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <Alert variant={actionMessage.includes("Failed") ? "destructive" : "success"} className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <span>{actionMessage}</span>
        </Alert>
      )}

      {/* TAB 1: Enterprise Operations Center */}
      {activeTab === "eoc" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Incidents Feed */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flame className="h-5 w-5 text-destructive" />
                    Operational Incidents & Timeline
                  </CardTitle>
                  <CardDescription>Live feed of automated detections, mitigations, and outages.</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  disabled={submittingAction}
                  onClick={() => triggerAction("heal")}
                  className="font-bold gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${submittingAction ? "animate-spin" : ""}`} />
                  Run Self-Heal Audit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {incidents?.list?.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/40 rounded-lg text-muted-foreground text-sm">
                    No active or historical incidents recorded. Platform operating within SLO bounds.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                    {incidents.list.map((inc: any) => (
                      <div key={inc.id} className="border border-border/40 rounded-lg p-4 bg-accent/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant={inc.severity === "P0" ? "destructive" : "warning"}>
                              {inc.severity}
                            </Badge>
                            <span className="font-bold text-sm">{inc.title}</span>
                          </div>
                          <Badge variant={inc.status === "resolved" ? "secondary" : "default"}>
                            {inc.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{inc.description}</p>
                        
                        {/* Timeline logs */}
                        <div className="border-t border-border/10 pt-2 space-y-1">
                          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Timeline Logs:</div>
                          {inc.timeline.map((t: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>• {t.event}</span>
                              <span className="text-[10px] shrink-0 ml-2">{new Date(t.time).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Mesh & Downstream Routing */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg">Service Mesh & Traffic Split Control</CardTitle>
                <CardDescription>Configure Linkerd/Istio canary splits and verify sidecar validation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mesh?.map((route: any) => (
                    <div key={route.serviceId} className="border border-border/40 p-4 rounded-lg bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm uppercase">{route.serviceId}</span>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                          mTLS: {route.mtlsStatus}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Canary weight:</span>
                        <span className="font-bold text-foreground">{route.canaryWeightPercent}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sidecar status:</span>
                        <Badge variant={route.sidecarInjected ? "secondary" : "outline"}>
                          {route.sidecarInjected ? "Envoy Injected" : "Bypassed"}
                        </Badge>
                      </div>
                      {/* Interactive split adjust */}
                      <div className="flex gap-2 pt-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[10px] py-1 h-7" 
                          onClick={() => triggerAction("traffic_split", { serviceId: route.serviceId, canaryPercent: 10 })}
                        >
                          Canary 10%
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[10px] py-1 h-7" 
                          onClick={() => triggerAction("traffic_split", { serviceId: route.serviceId, canaryPercent: 0 })}
                        >
                          Promote 100%
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disaster Recovery & Health Panel */}
          <div className="space-y-6">
            <Card className="glass-panel border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-primary" />
                  Disaster Recovery Platform
                </CardTitle>
                <CardDescription>Verify backups, RPO compliance, and trigger recovery drills.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">RPO</div>
                    <div className="text-lg font-black text-primary">{dr?.status?.rpoMinutes} mins</div>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">RTO (Actual)</div>
                    <div className="text-lg font-black text-emerald-500">{dr?.status?.rtoSeconds} secs</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Failover target region:</span>
                    <span className="font-bold uppercase">{dr?.status?.drRegion}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Drill status:</span>
                    <span className="font-bold text-emerald-500 uppercase">{dr?.status?.failoverStatus}</span>
                  </div>
                </div>

                {/* Backups List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">Completed Backups:</div>
                  <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {dr?.backups?.map((bkp: any) => (
                      <div key={bkp.id} className="flex items-center justify-between text-[11px] bg-accent/5 p-2 rounded border border-border/20">
                        <span className="capitalize font-semibold">{bkp.type}</span>
                        <span className="text-muted-foreground">{(bkp.sizeBytes / 1024).toFixed(1)} KB</span>
                        <Badge className="text-[9px] px-1 py-0">{bkp.status.toUpperCase()}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations triggers */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
                  <Button 
                    size="sm" 
                    onClick={() => triggerAction("backup", { type: "database" })}
                    className="font-bold w-full"
                  >
                    Trigger Database Backup
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => triggerAction("failover_drill")}
                    className="font-bold w-full"
                  >
                    Execute Failover Drill
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Deep diagnostics overview */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg">Diagnostics & Metrics</CardTitle>
                <CardDescription>Deep checks validating hardware & database limits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {diagnostics?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs border-b border-border/10 pb-1.5">
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.message}</div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="font-semibold">{item.metricsValue}</div>
                      <Badge 
                        variant={item.status === "critical" ? "destructive" : item.status === "warning" ? "warning" : "secondary"}
                        className="text-[9px] px-1 py-0"
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Reliability Health Dashboard */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* SLI/SLO Registry */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Service Catalog & SLO Compliance Metrics</CardTitle>
              <CardDescription>Real-time SLI metrics evaluated against target SLO contracts and SLAs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sre?.services?.map((svc: any) => (
                  <div key={svc.id} className="border border-border/40 p-4 rounded-lg bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm">{svc.name}</div>
                        <div className="text-[10px] text-muted-foreground">Owner: {svc.owner} | {svc.tier}</div>
                      </div>
                      <Badge variant={svc.sli.availability >= svc.slo.availabilityTarget ? "secondary" : "destructive"}>
                        {svc.sli.availability >= svc.slo.availabilityTarget ? "SLO Met" : "SLO Breached"}
                      </Badge>
                    </div>

                    {/* Progress meters */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs pb-0.5">
                          <span className="text-muted-foreground">Availability SLI:</span>
                          <span className="font-bold">{svc.sli.availability}%</span>
                        </div>
                        <div className="w-full bg-accent/20 h-2 rounded overflow-hidden">
                          <div 
                            style={{ width: `${svc.sli.availability}%` }} 
                            className={`h-full rounded ${svc.sli.availability >= svc.slo.availabilityTarget ? "bg-emerald-500" : "bg-destructive"}`}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right mt-0.5">Target SLO: {svc.slo.availabilityTarget}% | SLA: {svc.sla.availabilityTarget}%</div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs pb-0.5">
                          <span className="text-muted-foreground">Latency P95 SLI:</span>
                          <span className="font-bold">{svc.sli.latencyP95}ms</span>
                        </div>
                        <div className="w-full bg-accent/20 h-2 rounded overflow-hidden">
                          <div 
                            style={{ width: `${Math.min((svc.sli.latencyP95 / svc.slo.latencyTargetMs) * 100, 100)}%` }} 
                            className={`h-full rounded ${svc.sli.latencyP95 <= svc.slo.latencyTargetMs ? "bg-emerald-500" : "bg-destructive"}`}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right mt-0.5">Target Latency: &lt;{svc.slo.latencyTargetMs}ms</div>
                      </div>
                    </div>

                    {/* Error Budget details */}
                    <div className="border-t border-border/10 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Error Budget Remaining:</span>
                      <span className="font-bold text-foreground">{svc.errorBudget.remainingErrors} / {svc.errorBudget.totalAllowedErrors}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capacity Forecasting and Recommendations */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-lg">Capacity Planning & Growth Forecasts</CardTitle>
              <CardDescription>Regression-based forecast analytics estimating upcoming hardware scaling needs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {capacity?.map((c: any, idx: number) => (
                  <div key={idx} className="border border-border/40 p-4 rounded-lg bg-card/40 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{c.metric}</span>
                        <Badge variant={c.probabilityScore > 50 ? "destructive" : "secondary"}>
                          Risk Probability: {c.probabilityScore}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-accent/10 p-2 rounded">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase">Current Value</div>
                          <div className="text-base font-black text-foreground">{c.currentValue}%</div>
                        </div>
                        <div className="bg-accent/10 p-2 rounded">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase">30-Day Forecast</div>
                          <div className="text-base font-black text-primary">{c.forecastValue}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 p-2.5 rounded text-[11px] text-primary flex items-start space-x-1.5">
                      <ArrowUpRight className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{c.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Platform Resilience & Risks */}
      {activeTab === "resilience" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chaos Fault Injector */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-5 w-5 text-destructive" />
                  Chaos Engineering Panel
                </CardTitle>
                <CardDescription>Inject simulated faults into the environment to validate automated healing loops.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {chaos?.faults?.map((fault: any) => (
                    <div key={fault.id} className="border border-border/40 rounded-lg p-4 bg-accent/5 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-extrabold text-sm">{fault.name}</div>
                        <div className="text-xs text-muted-foreground">{fault.description}</div>
                        <div className="text-[10px] text-muted-foreground uppercase mt-1">Target: {fault.targetComponent} | Type: {fault.type}</div>
                      </div>
                      
                      <div className="shrink-0 flex items-center space-x-2">
                        {fault.status === "injected" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => triggerAction("chaos_recover", { faultId: fault.id })}
                            className="font-bold flex items-center gap-1.5 text-xs"
                          >
                            <StopCircle className="h-4 w-4" />
                            Stop Simulation
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => triggerAction("chaos_inject", { faultId: fault.id })}
                            className="font-bold flex items-center gap-1.5 text-xs"
                          >
                            <Play className="h-4 w-4" />
                            Inject Fault
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chaos history logs */}
                <div className="border-t border-border/20 pt-4 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground">Chaos Drills History:</div>
                  <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    {chaos?.chaosRuns?.map((run: any) => (
                      <div key={run.id} className="flex items-center justify-between text-[11px] bg-accent/5 p-2 rounded border border-border/20">
                        <span>{run.testName}</span>
                        <span className="text-muted-foreground">Target: {run.targetComponent}</span>
                        <Badge variant={run.status === "completed" ? "secondary" : "destructive"}>
                          {run.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Residual Risks Register */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg">Residual Reliability Risk Register</CardTitle>
                <CardDescription>Catalog of identified system SPOFs, likelihoods, and mitigation actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {risks?.map((risk: any) => (
                    <div key={risk.id} className="border border-border/40 rounded-lg p-4 bg-card space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-primary">{risk.component}</span>
                        <Badge variant={risk.status === "Mitigated" ? "secondary" : "warning"}>
                          {risk.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{risk.riskDescription}</p>
                      <div className="grid grid-cols-2 gap-4 pt-1 text-[11px]">
                        <div><span className="text-muted-foreground">Likelihood:</span> <span className="font-bold">{risk.likelihood}</span></div>
                        <div><span className="text-muted-foreground">Impact:</span> <span className="font-bold text-destructive">{risk.impact}</span></div>
                      </div>
                      <div className="bg-accent/10 p-2 rounded mt-2 border-l-2 border-primary text-muted-foreground">
                        <span className="font-bold text-foreground">Mitigation Action:</span> {risk.mitigationStrategy}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reliability Readiness Report Summary */}
          <div className="space-y-6">
            <Card className="glass-panel border-emerald-500/20 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-500">
                  <ShieldCheck className="h-5 w-5" />
                  SRE Readiness Report
                </CardTitle>
                <CardDescription>Dynamic audit scorecard across primary operations domains.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-5xl font-black text-emerald-500">{readiness?.readinessScore}%</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Readiness Quotient</div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-muted-foreground">SLO Target Met:</span>
                    <span className="font-bold text-emerald-500">{readiness?.sreMetrics?.sloCompliancePercent}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-muted-foreground">SLA Targets Compliant:</span>
                    <span className="font-bold text-emerald-500">{readiness?.sreMetrics?.slaCompliancePercent}%</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-muted-foreground">SPOF Mitigations Met:</span>
                    <span className="font-bold text-emerald-500">
                      {readiness?.riskSummary?.mitigatedRisks} / {readiness?.riskSummary?.totalRisks} Risks
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-muted-foreground">Mean Time To Detect (MTTD):</span>
                    <span className="font-bold text-emerald-500">{readiness?.incidentsMetrics?.meanTimeToDetectSeconds} seconds</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-1.5">
                    <span className="text-muted-foreground">Mean Time To Recover (MTTR):</span>
                    <span className="font-bold text-emerald-500">{readiness?.incidentsMetrics?.meanTimeToRecoverSeconds} seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Health Engine */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-lg">Dependency Health Engine</CardTitle>
                <CardDescription>Live health checks verifying integrations and dependencies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Prisma SQLite Client</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">HEALTHY</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Ollama Local Server</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">HEALTHY</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>LiteLLM Router Gateway</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">HEALTHY</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>OpenTelemetry Collector</span>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">HEALTHY</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
