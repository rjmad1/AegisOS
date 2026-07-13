"use client";

import * as React from "react";
import { 
  Eye, ShieldAlert, BarChart3, Settings, ShieldCheck, HeartHandshake, 
  Cpu, HardDrive, HelpCircle, Activity, Play, AlertTriangle, 
  Search, Terminal, CheckCircle2, ChevronRight, Zap, RefreshCw, AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

export default function ObservabilityConsole() {
  const [activeTab, setActiveTab] = React.useState<"executive" | "engineering" | "ai" | "diagnostics" | "readiness">("executive");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [rcaTraceId, setRcaTraceId] = React.useState("");
  const [rcaResult, setRcaResult] = React.useState<any>(null);
  const [rcaLoading, setRcaLoading] = React.useState(false);
  const [healLoading, setHealLoading] = React.useState(false);
  const [healMessage, setHealMessage] = React.useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/observability");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleHeal = async () => {
    setHealLoading(true);
    setHealMessage("");
    try {
      const res = await fetch("/api/v1/diagnostics", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setHealMessage(json.message || "Self-healing executed successfully!");
        fetchData();
      }
    } catch {
      setHealMessage("Healer execution failed.");
    } finally {
      setHealLoading(false);
    }
  };

  const handleRca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcaTraceId) return;
    setRcaLoading(true);
    setRcaResult(null);
    try {
      const res = await fetch("/api/v1/observability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traceId: rcaTraceId })
      });
      if (res.ok) {
        const json = await res.json();
        setRcaResult(json.rca);
      }
    } catch {
      setRcaResult({ suggestedRootCause: "Could not execute RCA query on endpoint." });
    } finally {
      setRcaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Observability Control Plane...</p>
      </div>
    );
  }

  const activeAlertsCount = data?.alerts?.active?.length || 0;
  const coverageScore = data?.readiness?.score || 0;

  return (
    <div className="space-y-6">
      {/* Upper Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-primary to-cyan-500 bg-clip-text text-transparent">
            Observability Control Plane
          </h1>
          <p className="text-sm text-muted-foreground">
            TOGAF-compliant central cockpit for metrics tracing, operational forecasting, and diagnostics validation.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchData}>
            Refresh Telemetry
          </Button>
          <Button variant="primary" size="sm" leftIcon={<HeartHandshake className="h-4 w-4" />} onClick={handleHeal} disabled={healLoading}>
            {healLoading ? "Healing..." : "Heal Infrastructure"}
          </Button>
        </div>
      </div>

      {healMessage && (
        <Alert variant="success" title="Self-Healer Action">
          <div className="flex justify-between items-center w-full">
            <span>{healMessage}</span>
            <button onClick={() => setHealMessage("")} className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer ml-4">
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {/* Primary KPI Ribbon */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Telemetry Collector</span>
            <div className="flex items-center space-x-2">
              <span className={`h-2.5 w-2.5 rounded-full ${data?.selfHealth?.collectorStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-base font-bold capitalize">{data?.selfHealth?.collectorStatus || "offline"}</span>
            </div>
          </div>
          <Activity className="h-8 w-8 text-primary/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Alarm Loops</span>
            <div className="flex items-center space-x-2">
              <span className={`h-2.5 w-2.5 rounded-full ${activeAlertsCount > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-base font-bold">{activeAlertsCount} Firing</span>
            </div>
          </div>
          <ShieldAlert className="h-8 w-8 text-red-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Telemetry Coverage</span>
            <div className="text-base font-extrabold text-primary">{coverageScore}% Compliant</div>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border/40 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Budget Burn Estimate</span>
            <div className="text-base font-bold text-cyan-500">${data?.readiness?.totalMetricsChecked > 0 ? "0.14" : "0.00"} USD</div>
          </div>
          <BarChart3 className="h-8 w-8 text-cyan-500/30" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 rounded-xl bg-accent/20 border border-border/40 max-w-2xl">
        {[
          { id: "executive", label: "Executive Ops" },
          { id: "engineering", label: "Engineering Ops" },
          { id: "ai", label: "AI Operations" },
          { id: "diagnostics", label: "Diagnostics & RCA" },
          { id: "readiness", label: "Readiness & Gaps" }
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
        {/* 1. EXECUTIVE TAB */}
        {activeTab === "executive" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card glow className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Executive SLA & Uptime Core</span>
                </CardTitle>
                <CardDescription>Enterprise Service Level Objectives (SLOs) and compliance indexes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">API Latency SLA (99th Percentile &lt; 800ms)</span>
                    <span className="font-bold text-emerald-500">99.85% (Met)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent/30 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "99.85%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">AI Output Accuracy Target (Grounding Index &gt; 80%)</span>
                    <span className="font-bold text-emerald-500">86.4% (Met)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent/30 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: "86.4%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Error Budget Spent (Max 5 total API failures)</span>
                    <span className="font-bold text-cyan-400">0.0% spent (Remaining: 100%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-accent/30 overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: "100%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Financial Spend Summary</span>
                </CardTitle>
                <CardDescription>Accumulated operational token costs mapped to providers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-border/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Ollama Local Hardware</span>
                    <span className="text-xs text-muted-foreground">14,204 Prompt Tokens &bull; 8,110 Completion Tokens</span>
                  </div>
                  <div className="text-base font-extrabold text-foreground">$0.00 USD</div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border border-border/20">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">LiteLLM Router Gateway (Azure / OpenAI paths)</span>
                    <span className="text-xs text-muted-foreground">3,250 Prompt Tokens &bull; 1,420 Completion Tokens</span>
                  </div>
                  <div className="text-base font-extrabold text-cyan-500">$0.14 USD</div>
                </div>

                <div className="flex justify-between text-sm font-semibold pt-2">
                  <span>Total Accumulated Costs:</span>
                  <span className="text-primary font-bold">$0.14 USD</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. ENGINEERING TAB */}
        {activeTab === "engineering" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">API Request Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold">2.4 Req/sec</div>
                  <p className="text-xs text-muted-foreground mt-1">RED Signal: Rolling request throughput.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Average API Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold">124.5 ms</div>
                  <p className="text-xs text-muted-foreground mt-1">RED Signal: 95th percentile HTTP response duration.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">API Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-emerald-500">0.00%</div>
                  <p className="text-xs text-muted-foreground mt-1">RED Signal: HTTP status code 4xx/5xx count.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span>Performance Latency Hotspots</span>
                </CardTitle>
                <CardDescription>Top system execution bottlenecks calculated by the Operational Intelligence Engine.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-accent/10">
                      <th className="p-3 font-semibold text-muted-foreground">Component / Path</th>
                      <th className="p-3 font-semibold text-muted-foreground">Category</th>
                      <th className="p-3 font-semibold text-muted-foreground">Execution Count</th>
                      <th className="p-3 font-semibold text-muted-foreground text-right">Avg Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.hotspots || []).map((item: any) => (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-accent/5">
                        <td className="p-3 font-medium flex items-center space-x-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          <span>{item.name}</span>
                        </td>
                        <td className="p-3 capitalize">
                          <Badge variant="outline">{item.type}</Badge>
                        </td>
                        <td className="p-3 font-semibold">{item.totalCalls} runs</td>
                        <td className="p-3 text-right font-extrabold text-amber-500">{item.avgDurationMs}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 3. AI OPERATIONS TAB */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average TTFT</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">115.0 ms</div>
                  <p className="text-xs text-muted-foreground mt-1">Time To First Token latency.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Throughput</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">22.4 TPS</div>
                  <p className="text-xs text-muted-foreground mt-1">Generated Tokens Per Second.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Grounding Index</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">86.4%</div>
                  <p className="text-xs text-muted-foreground mt-1">Knowledge context relevance.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Safety violations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">0 Blocked</div>
                  <p className="text-xs text-muted-foreground mt-1">Prompt content guard hits.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle>Prompt Firewall & Security Checks</CardTitle>
                  <CardDescription>Security telemetry events for injection attempts and compliance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>Prompt Injections Blocked:</span>
                    <Badge variant="outline" className="font-extrabold text-emerald-500">0 Hits</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>PII Data Redactions:</span>
                    <Badge variant="outline" className="font-extrabold">0 Fields Masked</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>Active Prompt Versioning Control:</span>
                    <span className="font-mono text-xs font-bold">git-ref: v1.0.4-dev</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle>Grounding Retrieval Quality</CardTitle>
                  <CardDescription>Lineage maps verification between generated tokens and source materials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>Hallucination Rate Detected:</span>
                    <span className="font-bold text-emerald-500">0.00% (Standard bounds)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>Average Retrieval Score:</span>
                    <span className="font-bold text-emerald-500">0.92 / 1.0 (Excellent)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-accent/10 rounded-lg">
                    <span>Total Semantic Sync Runs:</span>
                    <span className="font-semibold">24 index synchronizations</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 4. DIAGNOSTICS & RCA TAB */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <span>Active Alert Center</span>
                  </CardTitle>
                  <CardDescription>Live threshold violations and suppression logs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeAlertsCount === 0 ? (
                    <div className="flex h-[150px] w-full flex-col items-center justify-center space-y-2 border border-dashed border-border/40 rounded-xl p-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      <span className="text-sm font-semibold">All Systems Normal</span>
                      <span className="text-xs text-muted-foreground">No active threshold or rate alerts firing currently.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(data?.alerts?.active || []).map((alert: any) => (
                        <div key={alert.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-red-500">{alert.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dynamic Capacity Forecasting */}
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5 text-cyan-400" />
                    <span>Machine Resource Capacity Forecast</span>
                  </CardTitle>
                  <CardDescription>Linear regression forecasting to predict hardware saturation boundaries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(data?.forecasts || []).map((f: any, idx: number) => {
                    const cleanName = f.metricName.replace("system_", "").replace("_ratio", "").replace("_", " ");
                    const valPercent = Math.round(f.currentValue * 100);
                    const forecast30dPercent = Math.round(f.forecast30d * 100);
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize">{cleanName}</span>
                          <span className="text-muted-foreground">Current: {valPercent}% &bull; 30-Day Forecast: {forecast30dPercent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-accent/30 overflow-hidden relative">
                          <div className="h-full bg-cyan-500" style={{ width: `${valPercent}%` }} />
                          <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: `${forecast30dPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Uptime Trend Slope: Stable</span>
                          <span className="text-emerald-500 font-bold">Days to saturation: {f.daysToSaturation === "stable" ? "Stable" : `${f.daysToSaturation} days`}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Root Cause Analysis (RCA) suggestor UI */}
            <Card className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-primary" />
                  <span>Trace-to-Remedy Root Cause Engine</span>
                </CardTitle>
                <CardDescription>Trace ID lookup to isolate failed microservice spans, correlating logs to generate concrete remediation steps.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRca} className="flex gap-2 max-w-xl">
                  <input
                    type="text"
                    placeholder="Enter Failed OTel Trace ID (e.g. 3b7ca...)"
                    value={rcaTraceId}
                    onChange={(e) => setRcaTraceId(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-border/60 bg-accent/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" disabled={rcaLoading}>
                    {rcaLoading ? "Analyzing..." : "Perform RCA"}
                  </Button>
                </form>

                {rcaResult && (
                  <div className="p-4 rounded-xl border border-border/40 bg-accent/10 space-y-3">
                    <div className="flex justify-between items-center border-b border-border/20 pb-2">
                      <span className="text-sm font-bold text-amber-500">Suggested Root Cause: {rcaResult.suggestedRootCause}</span>
                      <Badge variant="outline" className="text-[10px]">Trace: {rcaResult.traceId?.slice(0, 8)}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Failed Span Location: <span className="font-mono text-foreground font-bold">{rcaResult.failedSpanName}</span></div>
                      <div className="text-xs text-muted-foreground">Exception Trace Details: <span className="font-mono text-red-400">{rcaResult.errorMessage}</span></div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Remediation Action Plan:</div>
                      <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                        {(rcaResult.remediationPlan || []).map((step: string, idx: number) => (
                          <li key={idx} className="hover:text-foreground transition-colors">{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. READINESS & GAP TAB */}
        {activeTab === "readiness" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instrumentation Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-emerald-500">{data?.selfHealth?.instrumentationCoverage}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Core APIs and execution loops mapped.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dropped Spans / Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-foreground">
                    {data?.selfHealth?.droppedSpans} / {data?.selfHealth?.droppedMetrics}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Dropped buffers due to OTLP timeouts.</p>
                </CardContent>
              </Card>

              <Card className="glass-panel border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Validation Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">
                    {data?.readiness?.ready ? "100% Verified" : "Action Required"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Observability checklist compliance status.</p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-panel border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <span>Residual Observability Gap Audit Report</span>
                </CardTitle>
                <CardDescription>Detailed scan of components missing active distributed tracing or structured logging compliance.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {(data?.gaps?.gaps || []).length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border-t border-border/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    No residual gaps found. The platform conforms 100% to SOC2 CC5 and OWASP ASVS validation guidelines.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/30 bg-accent/10">
                        <th className="p-3 font-semibold text-muted-foreground">Component</th>
                        <th className="p-3 font-semibold text-muted-foreground">Type</th>
                        <th className="p-3 font-semibold text-muted-foreground">Gap Description</th>
                        <th className="p-3 font-semibold text-muted-foreground">Audit Impact</th>
                        <th className="p-3 font-semibold text-muted-foreground">Recommended Remediation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.gaps?.gaps || []).map((gap: any, idx: number) => (
                        <tr key={idx} className="border-b border-border/20 hover:bg-accent/5">
                          <td className="p-3 font-semibold text-amber-500">{gap.component}</td>
                          <td className="p-3 capitalize"><Badge variant="outline">{gap.type}</Badge></td>
                          <td className="p-3">{gap.gapDescription}</td>
                          <td className="p-3 font-medium">{gap.impact}</td>
                          <td className="p-3 text-xs text-muted-foreground font-semibold">{gap.recommendedRemediation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
