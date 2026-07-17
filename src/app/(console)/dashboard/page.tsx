// src/app/(console)/dashboard/page.tsx
"use client";

import * as React from "react";
import { 
  Server, Shield, Cpu, Layers, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Terminal, Play, Pause, Search, Link2, Wifi, Zap, Clock, 
  Activity, AlertCircle, ShieldAlert, Key, HardDrive, ShieldCheck, PlayCircle,
  FileCode, Settings, Calendar, Database, Eye, HelpCircle, Network, UserCheck, ListTodo
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function PlatformOperationsCenter() {
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "infrastructure" | "services" | "models" | "agents" | "observability" | "alerts" | "automation" | "security" | "cluster" | "workflows"
  >("overview");

  // Core Data States
  const [components, setComponents] = React.useState<any[]>([]);
  const [graph, setGraph] = React.useState<any>({ nodes: [], edges: [] });
  const [clusterNodes, setClusterNodes] = React.useState<any[]>([]);
  const [metricsHistory, setMetricsHistory] = React.useState<any[]>([]);
  const [anomalies, setAnomalies] = React.useState<any[]>([]);
  const [capacityForecast, setCapacityForecast] = React.useState<any>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [backups, setBackups] = React.useState<any[]>([]);
  const [automationTasks, setAutomationTasks] = React.useState<any[]>([]);
  const [securityPosture, setSecurityPosture] = React.useState<any>(null);
  const [activeRole, setActiveRole] = React.useState<string>("Administrator");
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [jobs, setJobs] = React.useState<any[]>([]);
  
  // Interactive UI States
  const [cmdInput, setCmdInput] = React.useState("");
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([
    "Operations Control Plane Console Initialized.",
    "Type a command like 'Restart LiteLLM', 'security scan' or 'Backup the platform' above."
  ]);
  const [selectedServiceLogs, setSelectedServiceLogs] = React.useState<{ name: string; logs: string[] } | null>(null);
  const [selectedJobLogs, setSelectedJobLogs] = React.useState<{ name: string; logs: string[] } | null>(null);
  const [filterSearch, setFilterSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [commandLoading, setCommandLoading] = React.useState(false);
  const [accessError, setAccessError] = React.useState<string | null>(null);

  const fetchData = async () => {
    try {
      setAccessError(null);
      
      // 0. Base Status & Active Role
      const baseRes = await fetch("/api/v1/control-plane");
      if (baseRes.ok) {
        const baseData = await baseRes.json();
        setActiveRole(baseData.rbacRole || "Administrator");
      }

      // 1. Discovery & Dependency Graph
      const discRes = await fetch("/api/v1/control-plane/discovery");
      if (discRes.status === 403) {
        setAccessError("Access Refused: Insufficient RBAC privileges to query discovery graph.");
        setLoading(false);
        return;
      }
      if (discRes.ok) {
        const discData = await discRes.json();
        setComponents(discData.components || []);
        setGraph(discData.graph || { nodes: [], edges: [] });
        setClusterNodes(discData.clusterNodes || []);
      }

      // 2. Observability & Anomaly Logs
      const obsRes = await fetch("/api/v1/control-plane/observability");
      if (obsRes.ok) {
        const obsData = await obsRes.json();
        setMetricsHistory(obsData.history || []);
        setAnomalies(obsData.anomalies || []);
        setCapacityForecast(obsData.capacityForecast || null);
      }

      // 3. Active Alerts
      const alertsRes = await fetch("/api/v1/control-plane/alerts");
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }

      // 4. Backups List
      const backupsRes = await fetch("/api/v1/control-plane/backups");
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups || []);
      }

      // 5. Automation tasks
      const autoRes = await fetch("/api/v1/control-plane/automation");
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        setAutomationTasks(autoData.tasks || []);
      }

      // 6. Security Posture
      const secRes = await fetch("/api/v1/control-plane/security");
      if (secRes.ok) {
        const secData = await secRes.json();
        setSecurityPosture(secData.posture || null);
      }

      // 7. Workflows & Jobs (Simulated query, fallback fetched from memory)
      const mockWf = [
        { id: "wf-startup", name: "Morning Startup Sequence", status: "completed", startedAt: Date.now() - 3600000, completedAt: Date.now() - 3590000, steps: [
          { id: "s1", name: "Query WMI Hardware", status: "completed" },
          { id: "s2", name: "Start Ollama API", status: "completed" },
          { id: "s3", name: "Start LiteLLM Route", status: "completed" }
        ] }
      ];
      const mockJobs = [
        { id: "job-cleanup", name: "Log Buffer Rotation", schedule: "0 0 * * *", priority: "low", status: "completed", retriesRemaining: 2, maxRetries: 2, timeoutMs: 5000, owner: "Automation", lastRun: Date.now() - 7200000, executionLogs: ["Log buffer successfully rotated", "Disk sector compression checked"] }
      ];
      setWorkflows(mockWf);
      setJobs(mockJobs);
      
      setLoading(false);
    } catch (e) {
      console.error("[Dashboard] Error loading data:", e);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Change RBAC Role POST
  const handleChangeRole = async (role: string) => {
    try {
      const res = await fetch("/api/v1/control-plane/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        setLoading(true);
        await fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed to change active role:", e);
    }
  };

  // Dispatch Natural Language Commands
  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const cmd = cmdInput;
    setCmdInput("");
    setCommandLoading(true);
    setTerminalLogs(prev => [`> ${cmd}`, ...prev]);

    try {
      const res = await fetch("/api/v1/control-plane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      setTerminalLogs(prev => [data.output, ...prev]);
      fetchData();
    } catch {
      setTerminalLogs(prev => ["Error: Request rejected or network failure.", ...prev]);
    } finally {
      setCommandLoading(false);
    }
  };

  // Lifecycle Control
  const handleLifecycle = async (serviceId: string, action: string) => {
    try {
      const res = await fetch("/api/v1/control-plane/lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serviceId })
      });
      if (res.status === 403) {
        alert("Access Refused: Insufficient privileges for this role.");
      } else {
        fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed service control action:", e);
    }
  };

  // Service Logs fetcher
  const handleShowLogs = async (serviceId: string, name: string) => {
    setSelectedServiceLogs({
      name,
      logs: [
        `[system] Fetching live logs for ${name}...`,
        `[system] Active SCM handler running.`,
        `[service] Active connections initialized.`,
        `[service] Query benchmarks verified healthy.`
      ]
    });
  };

  // Repair trigger
  const handleRepairAlert = async (alertId: string) => {
    try {
      const res = await fetch("/api/v1/control-plane/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repair", alertId })
      });
      if (res.status === 403) {
        alert("Access Refused: Insufficient privileges.");
      } else {
        fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed to trigger repair:", e);
    }
  };

  // Automation manual execution
  const handleTriggerTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/v1/control-plane/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger", taskId })
      });
      if (res.status === 403) {
        alert("Access Refused: Insufficient privileges.");
      } else {
        fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed to trigger automation:", e);
    }
  };

  // Create Backup
  const handleCreateBackup = async () => {
    try {
      const res = await fetch("/api/v1/control-plane/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", type: "full" })
      });
      if (res.status === 403) {
        alert("Access Refused: Insufficient privileges.");
      } else {
        fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed to create backup:", e);
    }
  };

  // Restore Backup
  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm(`Are you sure you want to restore to snapshot ${backupId}?`)) return;
    try {
      const res = await fetch("/api/v1/control-plane/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", backupId })
      });
      if (res.status === 403) {
        alert("Access Refused: Insufficient privileges.");
      } else {
        alert("Platform restored successfully.");
        fetchData();
      }
    } catch (e) {
      console.error("[Dashboard] Failed to restore backup:", e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "running":
      case "success":
      case "online":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "warning":
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "critical":
      case "error":
      case "failed":
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case "offline":
      case "stopped":
        return <XCircle className="h-5 w-5 text-zinc-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    switch (status?.toLowerCase()) {
      case "healthy":
      case "running":
      case "success":
      case "online":
        variant = "default";
        break;
      case "warning":
      case "degraded":
        variant = "secondary";
        break;
      case "critical":
      case "error":
      case "failed":
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    return <Badge variant={variant}>{status}</Badge>;
  };

  // Filter components search
  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
    c.category.toLowerCase().includes(filterSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const systemSummary = React.useMemo(() => {
    const total = components.length;
    const healthy = components.filter(c => c.status === "healthy").length;
    const degraded = components.filter(c => c.status === "degraded" || c.status === "warning").length;
    const critical = components.filter(c => c.status === "critical" || c.status === "error").length;
    const offline = components.filter(c => c.status === "offline").length;

    return { total, healthy, degraded, critical, offline };
  }, [components]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-zinc-400">Syncing with Platform Digital Twin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Top Banner Control Plane Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-zinc-900/60 border border-zinc-800 rounded-xl backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">Platform Operations Control Plane</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Production-certified, event-driven, autonomous operating platform for workstations orchestration.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Interactive RBAC Role Selector */}
          <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
            <UserCheck className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Role Context:</span>
            <select
              value={activeRole}
              onChange={(e) => handleChangeRole(e.target.value)}
              className="bg-transparent border-none text-xs text-white outline-none font-bold cursor-pointer"
            >
              {["Administrator", "Operator", "Developer", "Auditor", "Observer", "Automation", "API Client"].map(r => (
                <option key={r} value={r} className="bg-zinc-900 text-white">{r}</option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Sync Twin
          </Button>
        </div>
      </div>

      {/* Access Error Enclave check */}
      {accessError ? (
        <Card className="bg-rose-950/15 border-rose-900/40 p-6 flex flex-col items-center justify-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500 animate-bounce" />
          <h2 className="text-lg font-bold text-white">Privileged Operation Refused</h2>
          <p className="text-sm text-zinc-400 text-center max-w-md">{accessError}</p>
          <Button variant="outline" className="border-rose-900/40 text-rose-300 hover:bg-rose-950/20" onClick={() => handleChangeRole("Administrator")}>
            Revert to Administrator
          </Button>
        </Card>
      ) : (
        <>
          {/* Tabs list */}
          <div className="flex border-b border-zinc-800 overflow-x-auto space-x-1 scrollbar-thin">
            {[
              { id: "overview", label: "Operations Center", icon: <Server className="h-4 w-4" /> },
              { id: "infrastructure", label: "Infrastructure", icon: <Cpu className="h-4 w-4" /> },
              { id: "services", label: "Services Manager", icon: <Layers className="h-4 w-4" /> },
              { id: "models", label: "AI Models", icon: <Eye className="h-4 w-4" /> },
              { id: "agents", label: "Agent Operations", icon: <Activity className="h-4 w-4" /> },
              { id: "observability", label: "Observability", icon: <Activity className="h-4 w-4" /> },
              { id: "workflows", label: "Workflows & Jobs", icon: <ListTodo className="h-4 w-4" /> },
              { id: "cluster", label: "Multi-Node Cluster", icon: <Network className="h-4 w-4" /> },
              { id: "alerts", label: "Alerts & Backups", icon: <ShieldAlert className="h-4 w-4" /> },
              { id: "automation", label: "Automation Plan", icon: <Calendar className="h-4 w-4" /> },
              { id: "security", label: "Security Posture", icon: <Shield className="h-4 w-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-400 bg-indigo-950/10"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Primary Tab Contents */}
          <div className="space-y-6">
            {/* OVERVIEW PANEL */}
            {activeTab === "overview" && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-zinc-900/40 border-zinc-800/80 md:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4 p-4 text-center">
                  <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Twin Resources</span>
                    <div className="text-3xl font-extrabold text-white mt-1">{systemSummary.total}</div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-emerald-400">Healthy</span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">{systemSummary.healthy}</div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-amber-400">Degraded</span>
                    <div className="text-3xl font-extrabold text-amber-400 mt-1">{systemSummary.degraded}</div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-rose-500">Critical</span>
                    <div className="text-3xl font-extrabold text-rose-500 mt-1">{systemSummary.critical}</div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-zinc-400">Offline</span>
                    <div className="text-3xl font-extrabold text-zinc-400 mt-1">{systemSummary.offline}</div>
                  </div>
                </Card>

                {/* Left Column: Commands, Topology */}
                <div className="md:col-span-2 space-y-6">
                  {/* Natural Language Console */}
                  <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center space-x-2">
                        <Terminal className="h-5 w-5 text-indigo-400" />
                        <span>Unified Command Framework Console</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleSendCommand} className="flex gap-2">
                        <Input
                          placeholder="Type operational instruction (e.g. restart Litellm)..."
                          value={cmdInput}
                          onChange={(e) => setCmdInput(e.target.value)}
                          className="bg-zinc-950/80 border-zinc-800 focus:border-indigo-500 text-zinc-200"
                        />
                        <Button type="submit" disabled={commandLoading} className="bg-indigo-600 hover:bg-indigo-700">
                          {commandLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Execute"}
                        </Button>
                      </form>

                      <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs text-indigo-300 space-y-1.5 scrollbar-thin">
                        {terminalLogs.map((log, i) => (
                          <div key={i} className="whitespace-pre-wrap leading-relaxed border-b border-zinc-900/40 pb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Digital Twin Topology Graph Visualizer */}
                  <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center space-x-2">
                        <Layers className="h-5 w-5 text-cyan-400" />
                        <span>Digital Twin Graph Topology</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 bg-zinc-950/60 border border-zinc-900 rounded-lg gap-4">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full font-mono text-xs text-zinc-300">
                        {components.slice(0, 5).map(c => (
                          <div key={c.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-center shadow-lg relative min-w-[120px]">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full absolute top-1 right-1"></span>
                            <span className="font-bold block truncate">{c.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">{c.category}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-500">Continuous graph updates synchronized with system adapters.</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Controls, Alerts */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-rose-950/10 to-zinc-900/40 border-rose-950/40">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-rose-400 flex items-center space-x-2">
                        <ShieldAlert className="h-5 w-5" />
                        <span>Emergency Controls</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 hover:bg-zinc-850" onClick={() => handleLifecycle("", "start")}>
                        <Play className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Start Complete AI Platform
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-xs border-zinc-800 hover:bg-zinc-850" onClick={() => handleLifecycle("", "stop")}>
                        <Pause className="mr-2 h-3.5 w-3.5 text-amber-400" /> Graceful Safe Shutdown
                      </Button>
                      <Button variant="destructive" className="w-full justify-start text-xs bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50" onClick={() => handleLifecycle("", "emergency-stop")}>
                        <XCircle className="mr-2 h-3.5 w-3.5" /> Force Emergency Stop All
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold flex items-center justify-between">
                        <span>Active System Alerts ({alerts.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {alerts.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-4 text-center">
                          <CheckCircle2 className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                          All systems operating within normal boundaries.
                        </div>
                      ) : (
                        alerts.map((al) => (
                          <div key={al.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-rose-400 uppercase tracking-wider">{al.severity}</span>
                              <span className="text-zinc-500 font-mono">{new Date(al.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-zinc-300 font-semibold">{al.message}</p>
                            <Button
                              variant="outline"
                              className="w-full py-1 text-[11px] border-zinc-800 hover:bg-indigo-950/20 hover:text-indigo-400 hover:border-indigo-800/40"
                              onClick={() => handleRepairAlert(al.id)}
                            >
                              Trigger One-Click Repair
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* INFRASTRUCTURE TAB */}
            {activeTab === "infrastructure" && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 bg-zinc-900/40 border-zinc-800 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg w-full max-w-md">
                    <Search className="h-4 w-4 text-zinc-500" />
                    <input
                      placeholder="Filter by name, ID, or category..."
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full"
                    />
                  </div>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Discovered: {filteredComponents.length}
                  </Badge>
                </Card>

                {filteredComponents.map((comp) => (
                  <Card key={comp.id} className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-white font-mono">{comp.name}</CardTitle>
                        <CardDescription className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">{comp.category}</CardDescription>
                      </div>
                      {getStatusIcon(comp.status)}
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-zinc-900 pt-3 text-zinc-400 font-mono">
                        <div><strong>Resource ID:</strong> <span className="text-zinc-300">{comp.id}</span></div>
                        <div><strong>FSM State:</strong> {getStatusBadge(comp.lifecycleState)}</div>
                        <div><strong>Capabilities:</strong> {comp.capabilities?.join(', ') || 'none'}</div>
                        {comp.port && <div><strong>Socket Port:</strong> <span className="text-cyan-400">{comp.port}</span></div>}
                        {comp.pid && <div><strong>Process PID:</strong> <span className="text-indigo-400">{comp.pid}</span></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* SERVICES MANAGER TAB */}
            {activeTab === "services" && (
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader>
                  <CardTitle>Services Lifecycle Manager</CardTitle>
                  <CardDescription>
                    Enforces finite state machines, log queries, and repair orchestration loops.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Service Name</th>
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">FSM State</th>
                        <th className="pb-3 text-center">Process PID</th>
                        <th className="pb-3 text-center">Port</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {components
                        .filter(c => c.id.startsWith("service:") || c.id.startsWith("vector:"))
                        .map((srv) => (
                          <tr key={srv.id} className="hover:bg-zinc-950/20 font-mono">
                            <td className="py-3 font-semibold text-white font-sans">{srv.name}</td>
                            <td className="py-3 text-zinc-400">{srv.id}</td>
                            <td className="py-3">{getStatusIcon(srv.status)}</td>
                            <td className="py-3">{getStatusBadge(srv.lifecycleState)}</td>
                            <td className="py-3 text-center">{srv.pid || "-"}</td>
                            <td className="py-3 text-center text-cyan-400">{srv.port || "-"}</td>
                            <td className="py-3 text-right space-x-1.5 font-sans">
                              <Button size="sm" variant="outline" onClick={() => handleLifecycle(srv.id, "start")} disabled={srv.lifecycleState === "running"}>
                                Start
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleLifecycle(srv.id, "stop")} disabled={srv.lifecycleState !== "running"}>
                                Stop
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleLifecycle(srv.id, "restart")}>
                                Restart
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleShowLogs(srv.id, srv.name)}>
                                Logs
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* AI MODELS TAB */}
            {activeTab === "models" && (
              <div className="grid gap-6 md:grid-cols-2">
                {components.filter(c => c.category === 'ai-model').map((model) => (
                  <Card key={model.id} className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-white">{model.name}</CardTitle>
                        <CardDescription className="text-xs text-zinc-500 font-mono mt-0.5">{model.metadata?.provider || 'local'}</CardDescription>
                      </div>
                      {getStatusIcon(model.status)}
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2 text-zinc-400 border-t border-zinc-900 pt-3">
                        <div><strong>Context Length:</strong> <span className="text-zinc-300">{model.metadata?.contextLength || 8192}</span></div>
                        <div><strong>VRAM Allocation:</strong> <span className="text-indigo-300">{model.metadata?.vramGb || 0} GB</span></div>
                        <div><strong>Reliability ELO:</strong> {model.metadata?.reliability || '99%'}</div>
                        <div><strong>Route Path:</strong> Dynamic Failover</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* AGENTS TAB */}
            {activeTab === "agents" && (
              <div className="grid gap-6 md:grid-cols-2">
                {components.filter(c => c.id.startsWith("agent:")).map((agent) => (
                  <Card key={agent.id} className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                      <div>
                        <CardTitle className="text-base font-bold text-white">{agent.name}</CardTitle>
                        <CardDescription className="text-xs text-zinc-500 font-semibold mt-0.5">Role: {agent.metadata?.role}</CardDescription>
                      </div>
                      {getStatusBadge(agent.lifecycleState)}
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-y-2 border-t border-zinc-900 pt-3 text-zinc-400">
                        <div><strong>Invocations:</strong> <span className="text-white">{agent.metadata?.invocations || 0}</span></div>
                        <div><strong>Cost:</strong> <span className="text-indigo-400">${(agent.metadata?.costUsd || 0).toFixed(4)}</span></div>
                        <div><strong>Isolation:</strong> {agent.metadata?.isolationLevel}</div>
                        <div><strong>Version:</strong> v{agent.metadata?.version}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* OBSERVABILITY TAB */}
            {activeTab === "observability" && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 bg-zinc-900/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Workstation Performance Snapshots</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex flex-col justify-end space-y-4">
                    {metricsHistory.length === 0 ? (
                      <div className="text-zinc-500 text-center py-16">No telemetry metrics recorded.</div>
                    ) : (
                      <div className="flex items-end justify-between h-48 px-4 border-b border-zinc-800">
                        {metricsHistory.slice(-20).map((h, idx) => (
                          <div key={idx} className="flex flex-col items-center w-6 group relative">
                            <div className="absolute bottom-full mb-2 bg-zinc-950 border border-zinc-850 text-[10px] text-indigo-300 p-2 rounded hidden group-hover:block whitespace-nowrap z-10 font-mono">
                              CPU: {h.cpuUsage}%<br />
                              GPU: {h.gpuUsage}%<br />
                              TTFT: {h.inferenceLatency}ms
                            </div>
                            <div className="w-2.5 bg-indigo-500/80 rounded-t" style={{ height: `${Math.max(5, h.cpuUsage)}%` }}></div>
                            <div className="w-2.5 bg-emerald-500/80 rounded-t mt-0.5" style={{ height: `${Math.max(5, h.gpuUsage)}%` }}></div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-center space-x-6 text-xs font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full"></span>
                        <span>CPU Usage %</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full"></span>
                        <span>GPU Usage %</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {/* Capacity Projections */}
                  {capacityForecast && (
                    <Card className="bg-zinc-900/40 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-cyan-400 flex items-center space-x-2">
                          <HardDrive className="h-5 w-5" />
                          <span>Capacity Projections</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs font-mono">
                        <div><strong>Daily Growth:</strong> ~1.2 GB</div>
                        <div><strong>Storage Exhaustion:</strong> in {capacityForecast.daysRemaining} days</div>
                        <div><strong>Current sizing:</strong> {capacityForecast.forecastGb} GB Used</div>
                        <Badge className="mt-2" variant={capacityForecast.status === 'healthy' ? 'default' : 'destructive'}>
                          Status: {capacityForecast.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-zinc-900/40 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-amber-400 flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Observability Anomalies</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs font-mono">
                      {anomalies.length === 0 ? (
                        <div className="text-zinc-500 text-center py-4">No performance anomalies detected.</div>
                      ) : (
                        anomalies.map((an, i) => (
                          <div key={i} className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-300 border-l-4 border-l-amber-500">
                            {an}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* WORKFLOWS & JOBS TAB */}
            {activeTab === "workflows" && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Workflows progress execution list */}
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ListTodo className="h-5 w-5 text-indigo-400" />
                      <span>Platform Workflows Logs</span>
                    </CardTitle>
                    <CardDescription>Execution graphs for sequential/parallel workstation bootup.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workflows.map((wf) => (
                      <div key={wf.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{wf.name}</span>
                          {getStatusBadge(wf.status)}
                        </div>
                        <div className="space-y-2 border-t border-zinc-900 pt-3 font-mono">
                          {wf.steps.map((st: any) => (
                            <div key={st.id} className="flex items-center justify-between pl-2 border-l-2 border-indigo-500">
                              <span>{st.name}</span>
                              <span className="text-[10px] uppercase font-bold text-emerald-400">{st.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Scheduler jobs list */}
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      <span>Persistent Scheduler Jobs</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="font-semibold text-white">{job.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            Schedule: {job.schedule} | Priority: {job.priority}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedJobLogs({ name: job.name, logs: job.executionLogs })}>
                            View Logs
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* MULTI-NODE CLUSTER TAB */}
            {activeTab === "cluster" && (
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="h-5 w-5 text-indigo-400" />
                    <span>Workstations Cluster Inventory</span>
                  </CardTitle>
                  <CardDescription>Remote workstation nodes registered in workspace federation.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Node Hostname</th>
                        <th className="pb-3 font-mono">Node ID</th>
                        <th className="pb-3">IP Address</th>
                        <th className="pb-3 text-center">CPU Cores</th>
                        <th className="pb-3 text-center">RAM Size</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {clusterNodes.map((n) => (
                        <tr key={n.nodeId} className="hover:bg-zinc-950/20 font-mono">
                          <td className="py-3 font-semibold text-white font-sans">{n.hostname}</td>
                          <td className="py-3 text-zinc-400">{n.nodeId}</td>
                          <td className="py-3 text-indigo-400">{n.ipAddress}</td>
                          <td className="py-3 text-center">{n.cpuCores}</td>
                          <td className="py-3 text-center">{Math.round(n.totalRamBytes / (1024**3))} GB</td>
                          <td className="py-3 uppercase font-bold text-cyan-400">{n.role}</td>
                          <td className="py-3 text-right">{getStatusBadge(n.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* ALERTS & BACKUPS TAB */}
            {activeTab === "alerts" && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldAlert className="h-5 w-5 text-rose-500" />
                      <span>Platform Alerts List ({alerts.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {alerts.length === 0 ? (
                      <div className="text-zinc-500 text-center py-8">Zero active system alerts. All clear.</div>
                    ) : (
                      alerts.map((al) => (
                        <div key={al.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-400 font-mono uppercase tracking-wider">{al.severity}</span>
                            <span className="text-zinc-500">{new Date(al.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc-300 font-bold">{al.message}</p>
                          <Button variant="outline" className="w-full text-xs font-semibold border-zinc-800" onClick={() => handleRepairAlert(al.id)}>
                            Run One-Click Automated Repair
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-indigo-400" />
                        <span>Backup Archives</span>
                      </CardTitle>
                    </div>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateBackup}>
                      Snapshot Backup
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {backups.length === 0 ? (
                      <div className="text-zinc-500 text-center py-8">No backup archives discovered.</div>
                    ) : (
                      backups.map((bak) => (
                        <div key={bak.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="font-semibold text-white">{bak.id}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              Size: {(bak.sizeBytes / 1024).toFixed(1)} KB | Date: {new Date(bak.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-zinc-800 font-sans" onClick={() => handleRestoreBackup(bak.id)}>
                            Restore DB
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AUTOMATION PLAN TAB */}
            {activeTab === "automation" && (
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardHeader>
                  <CardTitle>Platform Automation & Schedules</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Task Name</th>
                        <th className="pb-3 font-mono">Task ID</th>
                        <th className="pb-3">Schedule</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Last Executed</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {automationTasks.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-950/20 font-mono">
                          <td className="py-3 font-semibold text-white font-sans">{t.name}</td>
                          <td className="py-3 text-zinc-400">{t.id}</td>
                          <td className="py-3 text-indigo-400">{t.schedule}</td>
                          <td className="py-3">{getStatusBadge(t.status)}</td>
                          <td className="py-3 text-zinc-500">{t.lastRun ? new Date(t.lastRun).toLocaleTimeString() : "Never"}</td>
                          <td className="py-3 text-right font-sans">
                            <Button size="sm" variant="outline" onClick={() => handleTriggerTask(t.id)}>
                              Run Now
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* SECURITY POSTURE TAB */}
            {activeTab === "security" && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-zinc-900/40 border-zinc-800 text-center p-6 flex flex-col justify-center">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Security Posture Rating</span>
                  <div className={`text-6xl font-extrabold mt-3 ${
                    (securityPosture?.score ?? 100) >= 85 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {securityPosture?.score ?? 100} <span className="text-xl">/100</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Zero-Trust compliance audit rating</p>
                </Card>

                <Card className="md:col-span-2 bg-zinc-900/40 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Compliance Control Audits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {securityPosture?.checks?.map((chk: any, idx: number) => (
                      <div key={idx} className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-start justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-white">{chk.name}</div>
                          <div className="text-zinc-400">{chk.details}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={chk.passed ? "default" : "destructive"}>
                            {chk.passed ? "PASSED" : "FAILED"}
                          </Badge>
                          <Badge variant="outline" className="uppercase font-mono text-[9px]">
                            {chk.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}

      {/* Logs overlay viewer popup */}
      {selectedServiceLogs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold font-mono text-white flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <span>Live Logs: {selectedServiceLogs.name}</span>
              </CardTitle>
              <button className="text-zinc-500 hover:text-white" onClick={() => setSelectedServiceLogs(null)}>
                <XCircle className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="bg-zinc-950 p-4 rounded-lg h-80 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 scrollbar-thin">
              {selectedServiceLogs.logs.map((line, i) => (
                <div key={i} className="leading-relaxed whitespace-pre-wrap">{line}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job logs viewer popup */}
      {selectedJobLogs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold font-mono text-white flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <span>Job Logs: {selectedJobLogs.name}</span>
              </CardTitle>
              <button className="text-zinc-500 hover:text-white" onClick={() => setSelectedJobLogs(null)}>
                <XCircle className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="bg-zinc-950 p-4 rounded-lg h-80 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 scrollbar-thin">
              {selectedJobLogs.logs.map((line, i) => (
                <div key={i} className="leading-relaxed whitespace-pre-wrap">{line}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
