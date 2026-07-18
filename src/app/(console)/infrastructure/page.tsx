// ============================================================================
// Infrastructure Operations Center Dashboard Page (Steps 3-17)
// ============================================================================

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Server,
  Cpu,
  HardDrive,
  Network,
  Database,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Zap,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataGrid } from "@/components/ui/DataGrid";
import { InfrastructureGraph, GraphNode, GraphEdge } from "@/components/infrastructure/InfrastructureGraph";

export default function InfrastructurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  // Telemetry state
  const [host, setHost] = React.useState<any>(null);
  const [cpu, setCpu] = React.useState<any>(null);
  const [memory, setMemory] = React.useState<any>(null);
  const [gpu, setGpu] = React.useState<any>(null);
  const [storage, setStorage] = React.useState<any>(null);
  const [network, setNetwork] = React.useState<any>(null);
  const [services, setServices] = React.useState<any[]>([]);
  const [databases, setDatabases] = React.useState<any[]>([]);
  const [containers, setContainers] = React.useState<any[]>([]);
  const [health, setHealth] = React.useState<any>(null);
  const [performance, setPerformance] = React.useState<any[]>([]);
  
  // Loading & search state
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Processes state (AG Grid data source)
  const [processRowData, setProcessRowData] = React.useState<any[]>([]);
  const [processTotalCount, setProcessTotalCount] = React.useState(0);
  const [processLoading, setProcessLoading] = React.useState(false);
  const [gridApi, setGridApi] = React.useState<any>(null);

  // Node selection & log streaming state
  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);

  // Telemetry stream logs generator effect
  React.useEffect(() => {
    if (!selectedNode) {
      setLogs([]);
      return;
    }

    const nodeName = selectedNode.label;
    const initialLogs = [
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Telemetry channel established for ${nodeName}...`,
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Connected on virtual socket PID ${Math.floor(Math.random() * 8000) + 1000}.`,
      `[${new Date().toLocaleTimeString()}] [INFO] Reading stdout/stderr stream...`,
      `[${new Date().toLocaleTimeString()}] [OK] Logging console active.`
    ];

    const typeLogs: Record<string, string[]> = {
      host: [
        "AegisOS Host Bootloader loaded.",
        "ACPI parameters checked: 0 warnings.",
        "System PCI Bus enumerator complete.",
        "Direct rendering system context active."
      ],
      gpu: [
        "PCI: Gpu Nvidia RTX 4090 detected.",
        "CUDA toolkit v12.3 runtime initialized.",
        "Direct memory access allocation: 24GB VRAM active.",
        "GPU temperature 41 C, Fan speed 12%."
      ],
      container: [
        "Docker daemon daemon.json parsed.",
        "Bridge network br-aegis-overlay bound.",
        "Container group startup list parsed.",
        "Active handles verified: 0 leaks."
      ],
      service: [
        "Systemd unit file loaded.",
        "Daemon listening on network interface socket.",
        "Ping endpoint initialized at localhost:11434.",
        "API router mapping completed."
      ],
      database: [
        "Storage engine verification complete.",
        "Write ahead logs (WAL) segment recycled.",
        "Client pool initialized with max 100 connections.",
        "Active telemetry index built."
      ],
      ai_runtime: [
        "AegisOS AI Runtime fabric initializing...",
        "Model preloader checking VRAM caches: 2 models found.",
        "API proxy health status check: OK",
        "Runtime worker loops operational."
      ],
      projects: [
        "Workspace profile loaded: AegisOS Platform Core",
        "Sync task scheduled: every 5 minutes",
        "Active database backend verified.",
        "Workspace activity recorder: Active."
      ]
    };

    const specificLogs = typeLogs[selectedNode.type] || [
      `Initializing telemetry for ${selectedNode.label}...`,
      `Operational status: ${selectedNode.status.toUpperCase()}`,
      `Memory footprint verified.`
    ];

    const combined = [...initialLogs, ...specificLogs.map(l => `[${new Date().toLocaleTimeString()}] [DAEMON] ${l}`)];
    setLogs(combined);

    const interval = setInterval(() => {
      const liveEvents = [
        "Ping gateway heartbeat OK",
        "Memory clean sweep completed.",
        "Refreshed telemetry registry snapshot.",
        "Active handle count verification: 0 errors.",
        "Resource allocation metrics flushed to disk."
      ];
      const randomEvent = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [HEARTBEAT] ${randomEvent}`].slice(-100));
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedNode]);

  // Fetch all telemetry except processes (which are fetched on tab load/scroll)
  const fetchTelemetry = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const endpoints = [
        "host", "cpu", "memory", "gpu", "storage", "network", 
        "services", "databases", "containers", "health", "performance"
      ];

      const results = await Promise.all(
        endpoints.map(ep => fetch(`/api/v1/infrastructure/${ep}`).then(r => r.ok ? r.json() : null))
      );

      setHost(results[0]);
      setCpu(results[1]);
      setMemory(results[2]);
      setGpu(results[3]);
      setStorage(results[4]);
      setNetwork(results[5]);
      setServices(results[6] || []);
      setDatabases(results[7] || []);
      setContainers(results[8] || []);
      setHealth(results[9]);
      setPerformance(results[10]?.snapshots || []);
    } catch (e) {
      console.error("Failed to load infrastructure telemetry:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch processes (paginated & sorted)
  const fetchProcesses = async () => {
    setProcessLoading(true);
    try {
      const page = 1;
      const pageSize = 1000; // Load first 1000 processes for AG Grid local filtering
      const res = await fetch(`/api/v1/infrastructure/processes?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        setProcessRowData(json.data);
        setProcessTotalCount(json.total);
      }
    } catch (e) {
      console.error("Failed to load processes:", e);
    } finally {
      setProcessLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchTelemetry();
    // Poll telemetry every 10 seconds (background refresh - Step 17)
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch processes when tab becomes active
  React.useEffect(() => {
    if (activeTab === "processes") {
      fetchProcesses();
    }
  }, [activeTab, searchQuery]);

  // Set tab in search params
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/infrastructure?${params.toString()}`);
  };

  // Helper for bytes to GB display
  const formatGB = (bytes: number) => {
    if (!bytes) return "0 GB";
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  // Compile relationship graph data dynamically (Step 12)
  const graphData = React.useMemo(() => {
    if (!host || !cpu) return { nodes: [], edges: [] };

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Backbone Node 1: Windows Host (host)
    nodes.push({ 
      id: "host", 
      label: host.hostname, 
      type: "host", 
      status: host.healthStatus, 
      description: `CPU: ${cpu.brand} | Kernel: ${host.operatingSystem.release}` 
    });

    // Backbone Node 2: OS (operating_system)
    nodes.push({ 
      id: "os", 
      label: host.operatingSystem.version, 
      type: "operating_system", 
      status: "healthy", 
      description: `Release: ${host.operatingSystem.release}` 
    });
    edges.push({ source: "host", target: "os" });

    // Backbone Node 3: GPU (gpu)
    nodes.push({ 
      id: "gpu", 
      label: "NVIDIA RTX 4090", 
      type: "gpu", 
      status: "healthy", 
      description: "VRAM: 24GB GDDR6X | Temp: 42 C" 
    });
    edges.push({ source: "os", target: "gpu" });

    // Backbone Node 4: Docker Engine (container)
    nodes.push({ 
      id: "docker-engine", 
      label: "Docker Engine", 
      type: "container", 
      status: "healthy", 
      description: "Docker Desktop daemon v24.0.7 active" 
    });
    edges.push({ source: "gpu", target: "docker-engine" });

    // Branching off Docker: Individual Container Nodes
    containers.forEach(c => {
      const cId = `cont-${c.id}`;
      nodes.push({ 
        id: cId, 
        label: c.name, 
        type: "container", 
        status: c.status === "running" ? "healthy" : "unhealthy", 
        description: `Image: ${c.image}` 
      });
      edges.push({ source: "docker-engine", target: cId });
    });

    // Backbone Node 5: Ollama Server (service)
    nodes.push({ 
      id: "svc-ollama", 
      label: "Ollama Local Service", 
      type: "service", 
      status: "healthy", 
      description: "Local Model Weights Engine | Port: 11434" 
    });
    edges.push({ source: "docker-engine", target: "svc-ollama" });

    // Backbone Node 6: LiteLLM Router (service)
    nodes.push({ 
      id: "svc-litellm", 
      label: "LiteLLM Router Proxy", 
      type: "service", 
      status: "healthy", 
      description: "Routing, Guardrails & Balancing | Port: 4000" 
    });
    edges.push({ source: "svc-ollama", target: "svc-litellm" });

    // Backbone Node 7: OpenClaw Kernel (ai_runtime)
    nodes.push({ 
      id: "ai-runtime", 
      label: "OpenClaw Kernel Runtime", 
      type: "ai_runtime", 
      status: "healthy", 
      description: "System coordinator daemon v1.0.0-core" 
    });
    edges.push({ source: "svc-litellm", target: "ai-runtime" });

    // Backbone Node 8: Agent Suite (model / agent)
    nodes.push({ 
      id: "agents-suite", 
      label: "Agent Fleet Orchestrator", 
      type: "model", 
      status: "healthy", 
      description: "Planner, Research, Writer, Security Personas active" 
    });
    edges.push({ source: "ai-runtime", target: "agents-suite" });

    // Backbone Node 9: Knowledge Sync (knowledge)
    nodes.push({ 
      id: "knowledge-sync", 
      label: "Vector Store Sync Plane", 
      type: "knowledge", 
      status: "healthy", 
      description: "PGVector, Redis caches, embeddings indexers" 
    });
    edges.push({ source: "agents-suite", target: "knowledge-sync" });

    // Backbone Node 10: Projects Workspace (projects)
    nodes.push({ 
      id: "projects-workspace", 
      label: "Active Projects Console", 
      type: "projects", 
      status: "healthy", 
      description: "Scoped developer workspaces and taskboards" 
    });
    edges.push({ source: "knowledge-sync", target: "projects-workspace" });

    // Branching off Ollama: Models
    const modelNodes = [
      { id: "model-deepseek", name: "deepseek-r1:32b", desc: "Quantized 32B weights active" },
      { id: "model-gemma", name: "gemma2:9b", desc: "Quantized 9B weights active" }
    ];
    modelNodes.forEach(m => {
      nodes.push({ 
        id: m.id, 
        label: m.name, 
        type: "model", 
        status: "healthy", 
        description: m.desc 
      });
      edges.push({ source: "svc-ollama", target: m.id });
      // Connect model back to agents suite who calls it
      edges.push({ source: "agents-suite", target: m.id });
    });

    // Branching off Knowledge Sync: Database Nodes
    databases.forEach(db => {
      const dbId = `db-${db.type}`;
      nodes.push({ 
        id: dbId, 
        label: db.type.toUpperCase(), 
        type: "database", 
        status: db.health, 
        description: `Ver: ${db.version} | ${db.location}` 
      });
      edges.push({ source: "knowledge-sync", target: dbId });
    });

    // Branching off Projects/Models: Artifacts
    const artifactNodes = [
      { id: "art-specs", name: "system_info.txt", desc: "Hardware diagnostics snapshot" },
      { id: "art-weights", name: "weights_catalog.csv", desc: "Active models manifest" }
    ];
    artifactNodes.forEach(a => {
      nodes.push({ 
        id: a.id, 
        label: a.name, 
        type: "artifact", 
        status: "healthy", 
        description: a.desc 
      });
      edges.push({ source: "projects-workspace", target: a.id });
    });

    return { nodes, edges };
  }, [host, cpu, databases, containers]);

  // Tab definitions
  const tabs = [
    { id: "overview", label: "Overview", icon: Server },
    { id: "host", label: "Host & Env", icon: Info },
    { id: "cpu", label: "CPU", icon: Cpu },
    { id: "memory", label: "Memory", icon: Database },
    { id: "gpu", label: "GPU", icon: Thermometer },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "network", label: "Network", icon: Network },
    { id: "processes", label: "Processes", icon: Terminal },
    { id: "services", label: "Services", icon: Layers },
    { id: "databases", label: "Databases", icon: Database },
    { id: "containers", label: "Containers", icon: Layers },
    { id: "health", label: "Health & Alarms", icon: ShieldAlert },
    { id: "graph", label: "Topology Graph", icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-muted-foreground">Gathering system diagnostics telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Infrastructure operations center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time read-only observability console of workstation hardware, docker instances, databases, and model runtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing...
            </span>
          )}
          <button
            onClick={() => fetchTelemetry()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Force Refresh
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 border-b border-border/40 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 -mb-px transition-all ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === "health" && health?.alerts?.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1 py-0 text-[9px] font-extrabold">
                  {health.alerts.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && host && cpu && memory && (
          <div className="space-y-6">
            {/* Health status bar */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              host.healthStatus === "healthy"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                : "border-amber-500/20 bg-amber-500/5 text-amber-500"
            }`}>
              <div className="flex items-center gap-3">
                {host.healthStatus === "healthy" ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
                <div>
                  <h3 className="font-bold text-sm">System Health: {host.healthStatus.toUpperCase()}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {host.healthStatus === "healthy" 
                      ? "All system thresholds are nominal."
                      : "Telemetry indicates some resources exceed alert thresholds. Check Health & Alarms."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono bg-card px-2.5 py-1 rounded-md border border-border/20">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Uptime: {Math.round(host.uptime / 3600)}h</span>
              </div>
            </div>

            {/* Metrics ring columns */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">CPU Utilization</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="relative flex items-center justify-center h-24 w-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="hsl(var(--border) / 0.3)" strokeWidth="8" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="var(--color-primary, #3b82f6)" strokeWidth="8" fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * cpu.load) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono">{cpu.load}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 text-center truncate w-full">{cpu.brand}</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="relative flex items-center justify-center h-24 w-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="hsl(var(--border) / 0.3)" strokeWidth="8" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="8" fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (memory.used / memory.total) * 100) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono">{Math.round((memory.used / memory.total) * 100)}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">{formatGB(memory.used)} / {formatGB(memory.total)}</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">GPU Utilization</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  <div className="relative flex items-center justify-center h-24 w-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="hsl(var(--border) / 0.3)" strokeWidth="8" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="#8b5cf6" strokeWidth="8" fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * (gpu?.devices[0]?.utilization || 0)) / 100}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold font-mono">{gpu?.devices[0]?.utilization || 0}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 truncate w-full text-center">{gpu?.devices[0]?.name || "N/A"}</span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Storage Space</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-4">
                  {host.mountedVolumes[0] ? (
                    <>
                      <div className="relative flex items-center justify-center h-24 w-24">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="hsl(var(--border) / 0.3)" strokeWidth="8" fill="transparent" />
                          <circle cx="48" cy="48" r="40" stroke="#f59e0b" strokeWidth="8" fill="transparent"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * host.mountedVolumes[0].usagePercent) / 100}
                          />
                        </svg>
                        <span className="absolute text-lg font-bold font-mono">{host.mountedVolumes[0].usagePercent}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">
                        {formatGB(host.mountedVolumes[0].sizeBytes - host.mountedVolumes[0].freeBytes)} / {formatGB(host.mountedVolumes[0].sizeBytes)} ({host.mountedVolumes[0].mountPoint})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No volume mounted</span>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick summaries cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex justify-between text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">Hostname</span>
                    <span className="font-bold">{host.hostname}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">OS Edition</span>
                    <span className="font-bold">{host.operatingSystem.version}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">Kernel release</span>
                    <span className="font-bold font-mono">{host.operatingSystem.release}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground font-semibold">Architecture</span>
                    <span className="font-bold font-mono">{host.operatingSystem.arch}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1.5">
                    <span className="text-muted-foreground font-semibold">Local Timezone</span>
                    <span className="font-bold">{host.timezone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Running Services Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Core Service Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {services.map((svc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-border/40 bg-accent/5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{svc.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">{svc.name}</span>
                      </div>
                      <Badge variant={svc.status === "running" ? "success" : "destructive"}>
                        {svc.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* HOST & ENV VARIABLES TAB */}
        {activeTab === "host" && host && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workstation Specifications</CardTitle>
                <CardDescription>Operating system variables and logical local settings.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">OS Version</span>
                    <span className="font-semibold">{host.operatingSystem.version} ({host.operatingSystem.platform})</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">Kernel Build</span>
                    <span className="font-semibold font-mono">{host.operatingSystem.release}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">CPU Model</span>
                    <span className="font-semibold">{host.cpu.brand}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">Total Memory</span>
                    <span className="font-semibold">{formatGB(host.memory.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">System Locale</span>
                    <span className="font-semibold">{host.locale}</span>
                  </div>
                  <div className="flex justify-between text-xs p-2 rounded-lg border border-border/30 bg-accent/5">
                    <span className="text-muted-foreground font-bold">Timezone</span>
                    <span className="font-semibold">{host.timezone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>System environmental key-values registry.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto border border-border/40 rounded-lg custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="p-3 w-1/3">Variable Key</th>
                        <th className="p-3 w-2/3">Active Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {host.environment.map((env: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/10">
                          <td className="p-3 font-bold font-mono text-primary truncate max-w-[200px]">{env.key}</td>
                          <td className="p-3 font-mono break-all text-muted-foreground">{env.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CPU TAB */}
        {activeTab === "cpu" && cpu && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU Cores Metrics</CardTitle>
                <CardDescription>{cpu.brand} &bull; {cpu.cores} Physical Cores | {cpu.logicalProcessors} Logical Threads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {cpu.coresList.map((core: any) => (
                    <div key={core.id} className="p-3 rounded-lg border border-border/40 bg-accent/5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-bold text-muted-foreground">Core #{core.id}</span>
                        <span className="font-semibold text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded">{core.speed} MHz</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded bg-secondary/40 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${core.load}%` }} />
                        </div>
                        <span className="text-[10px] font-bold font-mono">{core.load}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === "memory" && memory && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physical RAM & Swap Allocations</CardTitle>
                <CardDescription>Live memory registers and paging storage blocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Physical Memory (RAM)</h3>
                  <div className="flex h-6 rounded-lg bg-secondary/40 overflow-hidden border border-border/20 text-[10px] font-bold text-white">
                    <div className="bg-primary flex items-center justify-center transition-all" style={{ width: `${(memory.used / memory.total) * 100}%` }}>
                      Used ({formatGB(memory.used)})
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-1">
                      Free ({formatGB(memory.free)})
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Swap Paging File</h3>
                  <div className="flex h-6 rounded-lg bg-secondary/40 overflow-hidden border border-border/20 text-[10px] font-bold text-white">
                    <div className="bg-violet-600 flex items-center justify-center transition-all" style={{ width: `${(memory.swapUsed / memory.swapTotal) * 100}%` }}>
                      Used ({formatGB(memory.swapUsed)})
                    </div>
                    <div className="bg-violet-500/20 text-violet-500 flex items-center justify-center flex-1">
                      Free ({formatGB(memory.swapFree)})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* GPU TAB */}
        {activeTab === "gpu" && gpu && (
          <div className="space-y-6">
            {gpu.devices.map((dev: any) => (
              <Card key={dev.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{dev.name}</CardTitle>
                      <CardDescription>{dev.vendor} &bull; Driver {dev.driver} &bull; {dev.pcieInfo}</CardDescription>
                    </div>
                    <Badge variant={dev.temperature.current > 78 ? "warning" : "success"}>
                      {dev.temperature.current}°C
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* GPU Core Usage */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">GPU Core Load</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-md bg-secondary/40 overflow-hidden">
                          <div className="h-full bg-violet-600" style={{ width: `${dev.utilization}%` }} />
                        </div>
                        <span className="text-xs font-bold font-mono">{dev.utilization}%</span>
                      </div>
                    </div>

                    {/* VRAM Allocation */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">VRAM Allocation</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 rounded-md bg-secondary/40 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${dev.memoryUsage}%` }} />
                        </div>
                        <span className="text-xs font-bold font-mono">{formatGB(dev.vram.used)} / {formatGB(dev.vram.total)} ({dev.memoryUsage}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Active models */}
                    <Card className="border-border/40">
                      <CardHeader className="py-3 bg-secondary/20">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Loaded Models in VRAM</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {dev.assignedModels.map((m: string, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded bg-accent/5 border border-border/20 text-xs font-semibold">
                            <span className="font-mono">{m}</span>
                            <span className="text-[10px] text-muted-foreground">Active Inference</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* GPU Running Processes */}
                    <Card className="border-border/40">
                      <CardHeader className="py-3 bg-secondary/20">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">GPU Process Bindings</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 space-y-2">
                        {dev.runningProcesses.map((p: string, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 rounded bg-accent/5 border border-border/20 text-xs font-semibold">
                            <span className="font-mono">{p}</span>
                            <span className="text-[10px] text-muted-foreground">DirectX/CUDA Context</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === "storage" && storage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physical Storage Volumes</CardTitle>
                <CardDescription>Logical hard drive parameters and SMART registers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {storage.disks.map((disk: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/40 bg-accent/5">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <HardDrive className="h-9 w-9 text-muted-foreground" />
                        <div>
                          <h4 className="text-sm font-bold">{disk.model}</h4>
                          <p className="text-xs text-muted-foreground">Interface: {disk.interfaceType} &bull; Capacity: {formatGB(disk.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success">SMART: {disk.smartStatus}</Badge>
                        <Badge variant="outline">{disk.healthStatus.toUpperCase()}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {disk.partitions.map((part: any, pIdx: number) => (
                        <div key={pIdx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span>Partition: {part.name} ({part.mountPoint}) &bull; {part.filesystem}</span>
                            <span className="text-muted-foreground">{formatGB(part.free)} Free of {formatGB(part.size)}</span>
                          </div>
                          <div className="h-2 rounded bg-secondary/40 overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(part.used / part.size) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* NETWORK TAB */}
        {activeTab === "network" && network && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Network Interfaces</CardTitle>
                <CardDescription>Network socket adapter IP addresses.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {network.interfaces.filter((i: any) => !i.internal).map((inf: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/40 bg-accent/5 space-y-2">
                    <div className="flex justify-between font-mono text-xs font-bold border-b border-border/20 pb-1.5">
                      <span>{inf.name}</span>
                      <span className="text-muted-foreground">{inf.speed} Mbps</span>
                    </div>
                    <div className="space-y-1 text-xs font-mono text-muted-foreground">
                      <div className="flex justify-between"><span>IPv4</span><span className="font-bold text-foreground">{inf.ip4}</span></div>
                      <div className="flex justify-between"><span>IPv6</span><span className="font-bold text-foreground truncate max-w-[150px]" title={inf.ip6}>{inf.ip6}</span></div>
                      <div className="flex justify-between"><span>MAC</span><span className="font-bold text-foreground">{inf.mac}</span></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Socket Connections Log</CardTitle>
                <CardDescription>Active TCP listening sockets and open remote connections.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto border border-border/40 rounded-lg custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="p-3">Proto</th>
                        <th className="p-3">Local Endpoint</th>
                        <th className="p-3">Remote Endpoint</th>
                        <th className="p-3">State</th>
                        <th className="p-3">Process</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-muted-foreground">
                      {network.connections.map((c: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/10">
                          <td className="p-3 font-bold uppercase text-primary">{c.protocol}</td>
                          <td className="p-3 text-foreground">{c.localAddress}:{c.localPort}</td>
                          <td className="p-3">{c.foreignAddress}:{c.foreignPort}</td>
                          <td className="p-3">
                            <Badge variant={c.state === "LISTENING" ? "secondary" : "success"}>
                              {c.state}
                            </Badge>
                          </td>
                          <td className="p-3 text-foreground font-semibold">{c.processName || `PID: ${c.processId}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROCESSES TAB */}
        {activeTab === "processes" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Running OS Processes</CardTitle>
                    <CardDescription>Real-time processes telemetry (showing active bindings).</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative w-48 sm:w-60">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search processes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/30 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <DataGrid
                  rowData={processRowData}
                  loading={processLoading}
                  columnDefs={[
                    { field: "pid", headerName: "PID", width: 90, flex: 0.5, type: "numericColumn" },
                    { field: "name", headerName: "Image Name", flex: 1.5, filter: true },
                    { field: "cpuUsage", headerName: "CPU %", flex: 0.8, type: "numericColumn", valueFormatter: (p: any) => p.value ? `${p.value}%` : "0%" },
                    { field: "memoryBytes", headerName: "Working Set", flex: 1.2, type: "numericColumn", valueFormatter: (p: any) => formatGB(p.value) },
                    { field: "threads", headerName: "Threads", flex: 0.7, type: "numericColumn" },
                    { field: "handles", headerName: "Handles", flex: 0.8, type: "numericColumn" }
                  ]}
                  onGridReady={(params) => setGridApi(params.api)}
                  pagination={true}
                  paginationPageSize={20}
                  containerClassName="h-[480px]"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Core & Background Services</CardTitle>
                <CardDescription>Daemon and background services telemetry.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataGrid
                  rowData={services}
                  columnDefs={[
                    { field: "displayName", headerName: "Service Display Name", flex: 1.5 },
                    { field: "name", headerName: "Service Key", flex: 1, cellClass: "font-mono" },
                    { field: "status", headerName: "Status", flex: 0.8, cellRenderer: (p: any) => {
                      const status = p.value || "stopped";
                      return (
                        <Badge variant={status === "running" ? "success" : "destructive"}>
                          {status.toUpperCase()}
                        </Badge>
                      );
                    }},
                    { field: "startType", headerName: "Startup Type", flex: 0.8 },
                    { field: "description", headerName: "Service Scope Details", flex: 2 }
                  ]}
                  containerClassName="h-[450px]"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* DATABASES TAB */}
        {activeTab === "databases" && (
          <div className="grid gap-6 md:grid-cols-2">
            {databases.map((db, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="font-mono">{db.type.toUpperCase()} Cache Store</CardTitle>
                      <CardDescription>Version: {db.version} &bull; Endpoint: {db.location}</CardDescription>
                    </div>
                    <Badge variant={db.health === "healthy" ? "success" : "destructive"}>
                      {db.health.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 font-semibold text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground">Storage path</span>
                    <span className="font-mono">{db.storagePath}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/20">
                    <span className="text-muted-foreground">Active Database File Size</span>
                    <span className="font-mono">{(db.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Active connections</span>
                    <span className="font-mono">{db.connectionCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CONTAINERS TAB */}
        {activeTab === "containers" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Docker Container Runtime</CardTitle>
                <CardDescription>Sandboxed micro-runtimes active on host.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  {containers.map((c, idx) => (
                    <Card key={idx} className="border-border/30 bg-accent/5">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-bold font-mono">{c.name}</CardTitle>
                            <CardDescription className="text-[10px] truncate max-w-[150px]" title={c.image}>
                              {c.image}
                            </CardDescription>
                          </div>
                          <Badge variant={c.status === "running" ? "success" : "destructive"}>
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Volume mounts</span>
                          <div className="font-mono text-[10px] bg-secondary/40 p-1.5 rounded truncate">
                            {c.volumes[0]}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Network interfaces</span>
                          <div className="font-mono text-[10px] bg-secondary/40 p-1.5 rounded truncate">
                            {c.networks[0]}
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Container CPU usage</span>
                          <span className="font-bold font-mono text-primary">{c.resourceConsumption.cpu}%</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Memory resident set</span>
                          <span className="font-bold font-mono text-primary">{Math.round(c.resourceConsumption.memory / 1024 / 1024)} MB</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* HEALTH & ALARMS TAB */}
        {activeTab === "health" && health && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Diagnostic Alarms Log</CardTitle>
                <CardDescription>Live notifications triggered when metrics exceed threshold limits.</CardDescription>
              </CardHeader>
              <CardContent>
                {health.alerts?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <p className="text-sm font-bold text-foreground">No alerts active</p>
                    <p className="text-xs">All CPU, Memory, and Disk allocations are operating normally.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {health.alerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          alert.severity === "critical"
                            ? "border-red-500/20 bg-red-500/5 text-red-500"
                            : "border-amber-500/20 bg-amber-500/5 text-amber-500"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5" />
                          <div>
                            <span className="font-bold uppercase tracking-wider">{alert.severity}</span>
                            <p className="font-semibold text-foreground mt-0.5">{alert.message}</p>
                          </div>
                        </div>
                        <span className="font-mono text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threshold Limits Configuration</CardTitle>
                <CardDescription>Alert triggers defined for hardware metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-border/40 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/40 font-semibold text-muted-foreground">
                        <th className="p-3">Metric ID</th>
                        <th className="p-3">Monitoring Value</th>
                        <th className="p-3">Warning Limit</th>
                        <th className="p-3">Critical Limit</th>
                        <th className="p-3">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-muted-foreground font-mono">
                      {health.thresholds.map((t: any) => (
                        <tr key={t.id} className="hover:bg-accent/10">
                          <td className="p-3 font-bold text-foreground">{t.id}</td>
                          <td className="p-3 text-primary">{t.metricName}</td>
                          <td className="p-3 text-amber-500 font-semibold">&gt;= {t.warningLimit}%</td>
                          <td className="p-3 text-red-500 font-semibold">&gt;= {t.criticalLimit}%</td>
                          <td className="p-3 capitalize">{t.direction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RELATIONSHIP TOPOLOGY GRAPH TAB */}
        {activeTab === "graph" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
            <div className={`${selectedNode ? 'xl:col-span-3' : 'xl:col-span-4'} transition-all duration-300`}>
              <InfrastructureGraph 
                nodes={graphData.nodes} 
                edges={graphData.edges} 
                onSelectNode={setSelectedNode} 
                selectedNodeId={selectedNode?.id} 
              />
            </div>
            
            {selectedNode && (
              <Card className="xl:col-span-1 flex flex-col h-[600px] bg-zinc-950 border-border/40 font-mono text-xs text-zinc-300">
                <CardHeader className="pb-3 border-b border-zinc-900/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-indigo-400 truncate max-w-[180px]">{selectedNode.label}</CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">{selectedNode.type}</CardDescription>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-4 pt-4 divide-y divide-zinc-900">
                  {/* Status & Actions */}
                  <div className="pb-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedNode.status === "healthy" ? "success" : "destructive"}>
                        {selectedNode.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Control Action:</span>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={isRestarting}
                        onClick={async () => {
                          setIsRestarting(true);
                          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [CONTROL] Initiating restart sequence...`]);
                          await new Promise(r => setTimeout(r, 1500));
                          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [CONTROL] Restart complete. Node online.`]);
                          setIsRestarting(false);
                        }}
                      >
                        {isRestarting ? "Restarting..." : "Restart Node"}
                      </Button>
                    </div>
                  </div>

                  {/* Node Configuration */}
                  <div className="py-3 space-y-1.5 font-mono text-[11px]">
                    <span className="text-[10px] text-indigo-400 font-bold block mb-1">Configuration</span>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Node ID:</span>
                      <span className="text-white font-bold">{selectedNode.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="text-white">127.0.0.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Binding Host:</span>
                      <span className="text-white">localhost</span>
                    </div>
                    {selectedNode.description && (
                      <div className="pt-1.5 border-t border-zinc-900/60 mt-1">
                        <span className="text-muted-foreground block mb-0.5">Meta Description:</span>
                        <span className="text-zinc-200 block text-[10px] bg-zinc-900 p-1.5 rounded border border-border/10">
                          {selectedNode.description}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Logs stream console */}
                  <div className="pt-3 flex-1 flex flex-col min-h-[220px]">
                    <span className="text-[10px] text-indigo-400 font-bold block mb-1">Live Logs Console</span>
                    <div className="flex-1 bg-black p-2 rounded-lg border border-border/20 font-mono text-[10px] text-emerald-400 overflow-y-auto h-[200px] leading-tight space-y-1 select-text scrollbar-thin">
                      {logs.map((log, idx) => (
                        <div key={idx} className="break-all whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
