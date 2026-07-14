"use client";

import * as React from "react";
import { 
  Server, ShieldAlert, Cpu, Layers, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Terminal, Play, Pause, Download, Trash2, Search, Link2, Wifi, Zap, Clock, Activity, AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import Editor from "@monaco-editor/react";
import { EventBus } from "@/platform/event-bus/EventBus";

export default function RuntimePage() {
  const [activeTab, setActiveTab] = React.useState<"health" | "version" | "config" | "caps" | "status" | "inspector" | "diagnostics">("health");
  const [loading, setLoading] = React.useState(false);
  const [runtime, setRuntime] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Status Center States
  const [statusMetrics, setStatusMetrics] = React.useState<any>(null);
  const [providers, setProviders] = React.useState<any[]>([]);
  
  // Deployment Diagnostics State
  const [diagnostics, setDiagnostics] = React.useState<any>(null);

  const fetchDiagnostics = async () => {
    try {
      const res = await fetch("/api/v1/diagnostics/deployment");
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data);
      }
    } catch (e) {
      console.error("[RuntimePage] Failed to fetch diagnostics:", e);
    }
  };

  // Event Inspector States
  const [inspectorEvents, setInspectorEvents] = React.useState<any[]>([]);
  const [isPaused, setIsPaused] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [filterEventName, setFilterEventName] = React.useState("");
  const [filterSearch, setFilterSearch] = React.useState("");
  
  // Real-time metrics
  const [sessionEventCount, setSessionEventCount] = React.useState(0);

  const fetchRuntime = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/runtime");
      if (!res.ok) throw new Error("Failed to fetch runtime telemetry");
      const data = await res.json();
      setRuntime(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCenter = async () => {
    try {
      const statusRes = await fetch("/api/v1/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatusMetrics(statusData);
      }

      const providersRes = await fetch("/api/v1/providers");
      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData.providers || []);
      }
    } catch (e) {
      console.error("[RuntimePage] Failed to fetch status center data:", e);
    }
  };

  React.useEffect(() => {
    fetchRuntime();
    fetchStatusCenter();
    if (activeTab === "diagnostics") {
      fetchDiagnostics();
    }
    
    // Auto-refresh Status Center every 5s if on that tab
    const interval = setInterval(() => {
      if (activeTab === "status") {
        fetchStatusCenter();
      } else if (activeTab === "diagnostics") {
        fetchDiagnostics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Event Inspector: subscribe to EventBus wildcard events
  React.useEffect(() => {
    const sub = EventBus.subscribe("*", (event: any) => {
      if (isPaused) return;

      setSessionEventCount((prev) => prev + 1);
      setInspectorEvents((prev) => {
        // Capped at 150 entries to prevent memory pressure / DOM lag (Step 13)
        const updated = [event, ...prev];
        return updated.slice(0, 150);
      });
    });

    return () => {
      sub.unsubscribe();
    };
  }, [isPaused]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
      case "pass":
      case "active":
      case "stable":
      case "connected":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "degraded":
      case "warn":
      case "reconnecting":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "unhealthy":
      case "offline":
      case "fail":
      case "disconnected":
      case "unavailable":
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "healthy":
      case "online":
      case "pass":
      case "active":
      case "stable":
      case "connected":
      case "available":
        return "success";
      case "degraded":
      case "warn":
      case "reconnecting":
        return "warning";
      case "unhealthy":
      case "offline":
      case "fail":
      case "disconnected":
      case "unavailable":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Replay selected event onto the EventBus
  const handleReplayEvent = (event: any) => {
    if (!event) return;
    console.log(`[EventInspector] Replaying event: ${event.name}`);
    EventBus.publish(event.name, event.payload);
  };

  // Export event history to JSON
  const handleExportEvents = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inspectorEvents, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `operations_console_event_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("[EventInspector] Export failed:", e);
    }
  };

  // Filter events in real-time
  const filteredEvents = inspectorEvents.filter((evt) => {
    const matchesName = !filterEventName || evt.name.toLowerCase().includes(filterEventName.toLowerCase());
    const matchesSearch = !filterSearch || 
      evt.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      JSON.stringify(evt.payload).toLowerCase().includes(filterSearch.toLowerCase());
    return matchesName && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AegisOS Runtime Console</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time synchronization, infrastructure health, and streaming system events.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchRuntime}
            disabled={loading}
          >
            Refresh Config
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" title="Connection Failure">
          Could not communicate with AegisOS integration: {error}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/40 space-x-4 overflow-x-auto">
        {(["health", "version", "config", "caps", "status", "inspector", "diagnostics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all capitalize px-2 whitespace-nowrap ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "caps" ? "capabilities" : tab === "status" ? "Status Center" : tab === "inspector" ? "Event Inspector" : tab === "diagnostics" ? "Diagnostics" : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {runtime && (
        <div className="space-y-6">
          {activeTab === "health" && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Overall Status */}
              <Card glow className="md:col-span-1">
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Overall operational status of AegisOS Service.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="p-4 rounded-full bg-accent/5 border border-border/60">
                    {getStatusIcon(runtime.status)}
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-extrabold capitalize">{runtime.status}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last Checked: {new Date(runtime.health.lastCheckedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={getBadgeVariant(runtime.status)}>
                    {runtime.status === "online" ? "Active" : "Telemetry offline"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Specific Health Checks */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Platform Validation Checklist</CardTitle>
                  <CardDescription>Active validation check verification results.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {runtime.health.checks?.map((check: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-accent/5"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <span className="text-sm font-semibold capitalize font-mono">
                          {check.name.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">{check.message}</span>
                        <Badge variant={getBadgeVariant(check.status)}>
                          {check.status === "pass" ? "Pass" : "Fail"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "version" && (
            <Card>
              <CardHeader>
                <CardTitle>SCM Version & Environment</CardTitle>
                <CardDescription>AegisOS runtime build hashes and deployment attributes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Version</span>
                    <p className="text-lg font-bold font-mono">{runtime.version}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Build Branch</span>
                    <p className="text-lg font-bold font-mono">stable</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Gateway Port</span>
                    <p className="text-lg font-bold font-mono">{runtime.statusDetails?.port || 18789}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Process PID</span>
                    <p className="text-lg font-bold font-mono">{runtime.statusDetails?.pid || "N/A"}</p>
                  </div>
                </div>

                <div className="border-t border-border/20 pt-6">
                  <h4 className="text-sm font-bold mb-3">Host Node Attributes</h4>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="p-3 rounded-lg border border-border/30 bg-accent/5">
                      <span className="text-[10px] text-muted-foreground uppercase">OS Platform</span>
                      <p className="text-sm font-semibold mt-1">Windows host</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/30 bg-accent/5">
                      <span className="text-[10px] text-muted-foreground uppercase">Node Version</span>
                      <p className="text-sm font-semibold mt-1">v24.16.0</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border/30 bg-accent/5">
                      <span className="text-[10px] text-muted-foreground uppercase">Next.js Version</span>
                      <p className="text-sm font-semibold mt-1">16.2.10</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "config" && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration Summary</CardTitle>
                    <CardDescription>Key runtime paths and active integrations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">State Folder</span>
                      <span className="text-xs font-mono break-all">{runtime.configuration.stateDir}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Config File Path</span>
                      <span className="text-xs font-mono break-all">{runtime.configuration.configPath}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Enabled Communication Channels</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {runtime.configuration.activeChannels.map((c: string) => (
                          <Badge key={c} variant="secondary" className="capitalize text-[10px]">{c}</Badge>
                        ))}
                        {runtime.configuration.activeChannels.length === 0 && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Connected MCP Servers</CardTitle>
                    <CardDescription>Registered Model Context Protocol endpoints.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {runtime.configuration.mcpServers.map((s: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl border border-border/44 bg-accent/5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono">{s.name}</span>
                          <Badge variant="success" className="text-[9px]">Connected</Badge>
                        </div>
                        {s.command && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono break-all bg-black/40 p-1.5 rounded">
                            {s.command}
                          </p>
                        )}
                      </div>
                    ))}
                    {runtime.configuration.mcpServers.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No connected MCP Servers detected.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="overflow-hidden border border-border/30">
                <CardHeader className="pb-3 border-b border-border/20">
                  <CardTitle className="text-sm font-mono">aegisos.json Raw Config</CardTitle>
                </CardHeader>
                <div className="bg-black/60">
                  <Editor
                    height="350px"
                    language="json"
                    value={JSON.stringify(runtime.configuration.raw, null, 2)}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily: "Geist Mono, monospace",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === "caps" && (
            <Card>
              <CardHeader>
                <CardTitle>Runtime Capabilities</CardTitle>
                <CardDescription>Capabilities discoverable via the SCM integrations catalog.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {runtime.capabilities.map((cap: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border/40 bg-accent/5 flex items-start space-x-3 text-left"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold capitalize">{cap.name.replace("-", " ")}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{cap.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATUS CENTER PANEL (Step 10) */}
          {activeTab === "status" && (
            <div className="space-y-6">
              {/* Operational Stats Cards */}
              {statusMetrics && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="flex items-center p-4 space-x-4">
                    <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                      <Wifi className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Transport Layer</span>
                      <p className="text-lg font-bold font-mono">{statusMetrics.transport.primary.toUpperCase()}</p>
                      <Badge variant="success" className="text-[8px] mt-1">CONNECTED</Badge>
                    </div>
                  </Card>

                  <Card className="flex items-center p-4 space-x-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Event Throughput</span>
                      <p className="text-lg font-bold font-mono">{statusMetrics.eventThroughput} e/m</p>
                      <span className="text-[9px] text-muted-foreground mt-1 block">Live Activity Rate</span>
                    </div>
                  </Card>

                  <Card className="flex items-center p-4 space-x-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      <Terminal className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Watchers & Queues</span>
                      <p className="text-lg font-bold font-mono">{statusMetrics.filesystemWatchers.count} Watchers</p>
                      <Badge variant={statusMetrics.queueDepth > 0 ? "warning" : "secondary"} className="text-[8px] mt-1">
                        DLQ: {statusMetrics.queueDepth}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="flex items-center p-4 space-x-4">
                    <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Sync Scheduler</span>
                      <p className="text-lg font-bold font-mono">{statusMetrics.latencyMs.toFixed(1)} ms</p>
                      <span className="text-[9px] text-muted-foreground mt-1 block truncate">
                        Last: {new Date(statusMetrics.lastSynchronization).toLocaleTimeString()}
                      </span>
                    </div>
                  </Card>
                </div>
              )}

              {/* Infrastructure Provider Registry Health Grid */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Infrastructure Provider Health Registry</CardTitle>
                    <CardDescription>Real-time availability and diagnostic metrics of local hosts.</CardDescription>
                  </div>
                  <Badge variant="outline" className="h-6 flex items-center">
                    {providers.length} Providers Registered
                  </Badge>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Provider Info</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Latency</th>
                        <th className="py-3 px-4">Version</th>
                        <th className="py-3 px-4">Last Sync</th>
                        <th className="py-3 px-4">Recovery State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {providers.map((prov) => (
                        <tr key={prov.id} className="hover:bg-accent/5 transition-colors">
                          <td className="py-3 px-4 text-left">
                            <span className="font-bold block text-sm">{prov.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{prov.id}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{prov.type}</td>
                          <td className="py-3 px-4 text-left">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(prov.health)}
                              <Badge variant={getBadgeVariant(prov.health)} className="capitalize text-[10px]">
                                {prov.health}
                              </Badge>
                            </div>
                            {prov.errorState && (
                              <span className="text-[10px] text-rose-500 block max-w-xs truncate font-mono mt-1">
                                {prov.errorState}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {prov.latency.toFixed(2)} ms
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{prov.version}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {new Date(prov.lastSuccessfulSync).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={prov.recoveryStatus === 'stable' ? 'outline' : 'warning'} className="text-[10px] capitalize">
                              {prov.recoveryStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* EVENT INSPECTOR PANEL (Step 11) */}
          {activeTab === "inspector" && (
            <div className="grid gap-6 lg:grid-cols-3 text-left">
              {/* Event Stream Log */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                <Card className="flex flex-col h-[650px] overflow-hidden">
                  <CardHeader className="border-b border-border/20 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="h-5 w-5 text-primary" />
                          <span>Event Debugging Stream</span>
                        </CardTitle>
                        <CardDescription>Live capture of platform and database events.</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          onClick={() => setIsPaused(!isPaused)}
                        >
                          {isPaused ? "Resume" : "Pause"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Trash2 className="h-3 w-3" />}
                          onClick={() => {
                            setInspectorEvents([]);
                            setSelectedEvent(null);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download className="h-3 w-3" />}
                          onClick={handleExportEvents}
                          disabled={inspectorEvents.length === 0}
                        >
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Filter Inputs */}
                    <div className="grid gap-3 sm:grid-cols-2 mt-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Filter Event Name..."
                          value={filterEventName}
                          onChange={(e) => setFilterEventName(e.target.value)}
                          className="w-full bg-accent/5 border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/60"
                        />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search payloads..."
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          className="w-full bg-accent/5 border border-border/40 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary/60"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <div className="flex-1 overflow-y-auto divide-y divide-border/20 font-mono text-xs">
                    {filteredEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedEvent(evt)}
                        className={`flex items-start justify-between p-3 cursor-pointer hover:bg-accent/5 transition-all text-left ${
                          selectedEvent?.id === evt.id ? "bg-accent/10 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className="space-y-1.5 pr-4 truncate w-full">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-foreground text-sm truncate">{evt.name}</span>
                            <Badge variant={getBadgeVariant(evt.priority || "normal")} className="text-[8px] py-0 px-1 font-bold">
                              {evt.priority || "normal"}
                            </Badge>
                          </div>
                          <div className="flex items-center text-[10px] text-muted-foreground space-x-4">
                            <span>ID: {evt.id}</span>
                            <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                          {evt.name.replace(/^[a-z]+:/i, "").slice(0, 15)}
                        </Badge>
                      </div>
                    ))}
                    {filteredEvents.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <AlertCircle className="h-6 w-6 mb-2" />
                        <p>No events in buffer matching filters.</p>
                        <p className="text-[10px] mt-1">Publish an event or run operations to stream logs.</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Event Inspector Details */}
              <div className="lg:col-span-1">
                <Card className="h-[650px] flex flex-col overflow-hidden">
                  <CardHeader className="border-b border-border/20 pb-4">
                    <CardTitle className="text-sm font-bold flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span>Payload Inspector</span>
                    </CardTitle>
                    <CardDescription>Select an event to view canonical details.</CardDescription>
                  </CardHeader>

                  {selectedEvent ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 space-y-4 border-b border-border/20 text-xs bg-accent/5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm font-mono truncate">{selectedEvent.name}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<RefreshCw className="h-3 w-3" />}
                            onClick={() => handleReplayEvent(selectedEvent)}
                          >
                            Replay Event
                          </Button>
                        </div>
                        <div className="grid gap-2 grid-cols-2 text-left font-mono">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Priority</span>
                            <span className="capitalize">{selectedEvent.priority || 'normal'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Timestamp</span>
                            <span>{new Date(selectedEvent.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Correlation ID</span>
                            <span className="break-all">{selectedEvent.correlationId || 'N/A'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Trace ID</span>
                            <span className="break-all">{selectedEvent.traceId || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden relative">
                        <Editor
                          height="100%"
                          language="json"
                          value={JSON.stringify(selectedEvent.payload, null, 2)}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 11,
                            fontFamily: "Geist Mono, monospace",
                            scrollBeyondLastLine: false,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                      <AlertCircle className="h-6 w-6 mb-2" />
                      <p className="text-xs">No event selected</p>
                      <p className="text-[10px] mt-1">Select an event from the stream to view its payload, metadata and re-execute it.</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === "diagnostics" && diagnostics && (
            <div className="space-y-6">
              {/* Top Cards Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Console Version</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono">{diagnostics.buildVersion}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Commit: {diagnostics.gitCommit}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Console Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono">
                      {Math.floor(diagnostics.uptimeSeconds / 3600)}h {Math.floor((diagnostics.uptimeSeconds % 3600) / 60)}m
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Started: {new Date(diagnostics.runningSince).toLocaleTimeString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono capitalize">{diagnostics.environment}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Deploy Date: {diagnostics.deploymentDate}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">HTTPS Gateway</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${diagnostics.certificate.status === 'bound' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-xl font-bold font-mono capitalize">{diagnostics.certificate.status}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{diagnostics.certificate.provider}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Service & Directory Details */}
              <div className="grid gap-6 md:grid-cols-2 text-left">
                <Card>
                  <CardHeader>
                    <CardTitle>Downstream Providers Uptime</CardTitle>
                    <CardDescription>Uptime states of services managed via SCM.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {diagnostics.providers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-accent/5">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(p.status)}
                          <span className="text-sm font-semibold">{p.name}</span>
                        </div>
                        <Badge variant={getBadgeVariant(p.status)}>
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disk Space & Allocations</CardTitle>
                    <CardDescription>Physical disk storage consumption telemetry.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {diagnostics.diskUsage.map((d: any) => (
                      <div key={d.drive} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Partition {d.drive}</span>
                          <span>{d.percentUsed}% Used ({Math.round(d.usedBytes / 1024 / 1024 / 1024)}GB / {Math.round(d.totalBytes / 1024 / 1024 / 1024)}GB)</span>
                        </div>
                        <div className="h-2 w-full bg-accent/10 rounded-full overflow-hidden">
                          <div className={`h-full ${d.percentUsed > 85 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${d.percentUsed}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Deployment Layout Paths</CardTitle>
                    <CardDescription>Directories configured outside of application source context.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 font-mono text-xs text-left">
                    <div className="grid grid-cols-3 gap-2 border-b border-border/20 pb-2 font-bold text-muted-foreground">
                      <span>Variable / Context</span>
                      <span className="col-span-2">Target Folder Location</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-border/10 pb-2">
                      <span className="font-semibold">Config File Path</span>
                      <span className="col-span-2 break-all">{diagnostics.configuration.path}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-b border-border/10 pb-2">
                      <span className="font-semibold">Databases Directory</span>
                      <span className="col-span-2 break-all">{diagnostics.configuration.databasesDir}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pb-1">
                      <span className="font-semibold">Artifacts Repository</span>
                      <span className="col-span-2 break-all">{diagnostics.configuration.artifactsDir}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
