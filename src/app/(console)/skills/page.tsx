// src/app/(console)/skills/page.tsx
// Frontend Dashboard for the AegisOS Skills & Capabilities Control Center

"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Loading } from "@/components/ui/Loading";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { 
  Cpu, Search, Zap, GitPullRequest, TrendingUp, AlertTriangle, 
  CheckCircle2, Play, ArrowRight, Shield, Activity, DollarSign, Clock, Plus, HelpCircle, Server
} from "lucide-react";

export default function SkillsControlCenter() {
  const [activeTab, setActiveTab] = React.useState("registry");
  const [skills, setSkills] = React.useState<any[]>([]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Intent search / Discovery state
  const [intentQuery, setIntentQuery] = React.useState("");
  const [discoveryResults, setDiscoveryResults] = React.useState<any[]>([]);
  const [discovering, setDiscovering] = React.useState(false);

  // Composition / Orchestration state
  const [selectedChain, setSelectedChain] = React.useState<string[]>([]);
  const [compositionResult, setCompositionResult] = React.useState<any>(null);
  const [composing, setComposing] = React.useState(false);
  const [simulating, setSimulating] = React.useState(false);
  const [simulationLogs, setSimulationLogs] = React.useState<any[]>([]);
  const [simulationStatus, setSimulationStatus] = React.useState<"idle" | "running" | "succeeded" | "failed">("idle");

  // Marketplace state
  const [installedPackages, setInstalledPackages] = React.useState<string[]>([]);
  const [installingId, setInstallingId] = React.useState<string | null>(null);

  const fetchSkillsAndMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }

      // Fetch analytics
      const analyticRes = await fetch("/api/v1/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analytics" })
      });
      if (analyticRes.ok) {
        const analyticData = await analyticRes.json();
        setAnalytics(analyticData);
      }
    } catch (e) {
      console.error("Failed to load skills details", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSkillsAndMetrics();
  }, []);

  const handleToggleSkill = async (id: string, currentStatus: string) => {
    const nextEnabled = currentStatus !== "enabled";
    // Optimistic Update
    setSkills(prev => prev.map(s => s.id === id ? { ...s, status: nextEnabled ? "enabled" : "disabled" } : s));

    try {
      const res = await fetch(`/api/v1/skills/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", enabled: nextEnabled })
      });
      if (!res.ok) {
        // Rollback on failure
        setSkills(prev => prev.map(s => s.id === id ? { ...s, status: currentStatus } : s));
      } else {
        // Refresh analytics
        fetchSkillsAndMetrics();
      }
    } catch {
      setSkills(prev => prev.map(s => s.id === id ? { ...s, status: currentStatus } : s));
    }
  };

  const handleDiscoverySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intentQuery.trim()) return;

    setDiscovering(true);
    try {
      const res = await fetch("/api/v1/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover", intent: intentQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveryResults(data);
      }
    } catch (e) {
      console.error("Discovery query failed", e);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleChainSelection = (skillId: string) => {
    setSelectedChain(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const handleVerifyComposition = async () => {
    if (selectedChain.length === 0) return;
    setComposing(true);
    try {
      const res = await fetch("/api/v1/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compose", skillIds: selectedChain })
      });
      if (res.ok) {
        const data = await res.json();
        setCompositionResult(data);
      }
    } catch (e) {
      console.error("Composition validation failed", e);
    } finally {
      setComposing(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!compositionResult || !compositionResult.compatible) return;
    
    setSimulating(true);
    setSimulationStatus("running");
    setSimulationLogs([]);

    const chain = compositionResult.pipeline;
    const mockInputs: Record<string, any> = {
      task: "Simulating pipeline execution: " + intentQuery
    };

    for (let i = 0; i < chain.length; i++) {
      const skillId = chain[i];
      const targetSkill = skills.find(s => s.id === skillId);
      
      setSimulationLogs(prev => [
        ...prev, 
        { 
          step: i + 1, 
          skillName: targetSkill?.name || skillId, 
          status: "running", 
          message: "Invoking capabilities and checking sandbox..." 
        }
      ]);

      // Delay to simulate processing steps
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const res = await fetch(`/api/v1/skills/${skillId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "execute", input: mockInputs })
        });
        const data = await res.json();

        if (res.ok && !data.error) {
          setSimulationLogs(prev => prev.map((l, idx) => idx === i ? {
            ...l,
            status: "success",
            message: `Successfully executed. Output: ${JSON.stringify(data.output)}`
          } : l));
          // Feed output into next inputs
          mockInputs[skillId + "_output"] = data.output;
        } else {
          throw new Error(data.error || "Execution error encountered.");
        }
      } catch (err: any) {
        setSimulationLogs(prev => prev.map((l, idx) => idx === i ? {
          ...l,
          status: "failed",
          message: `Execution failed: ${err.message}`
        } : l));
        setSimulationStatus("failed");
        setSimulating(false);
        return;
      }
    }

    setSimulationStatus("succeeded");
    setSimulating(false);
    fetchSkillsAndMetrics(); // Refresh stats
  };

  const handleInstallMarketplace = async (id: string) => {
    setInstallingId(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInstalledPackages(prev => [...prev, id]);
    setInstallingId(null);
    fetchSkillsAndMetrics();
  };

  // Mock Marketplace Items
  const marketplaceItems = [
    { id: "k8s-autoscale", name: "Kubernetes Cloud Orchestrator Pack", desc: "Automates pod autoscaling, replicas config, and loadbalancer checks.", author: "Aegis Cloud Corp", version: "1.2.4", cost: 0.05, rating: 4.8 },
    { id: "gemini-rag-adv", name: "Gemini Advanced RAG Assistant", desc: "High confidence prompt template mappings, vector caching, and semantic search utilities.", author: "Gemini Team", version: "2.0.1", cost: 0.08, rating: 4.9 },
    { id: "gcs-compliance", name: "ISO-27001 Data Lineage Compliance Analyzer", desc: "Monitors storage logs, audits file transfers, and signs lineage checks records.", author: "Compliance Guard", version: "1.0.3", cost: 0.04, rating: 4.7 }
  ];

  const tabsItems = [
    { id: "registry", label: "Skills Registry" },
    { id: "discovery", label: "Intent Discovery" },
    { id: "orchestration", label: "Orchestration Simulator" },
    { id: "telemetry", label: "Telemetry & Analytics" },
    { id: "marketplace", label: "Marketplace" }
  ];

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 bg-[#0a0a0c] text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
            Skills Control Center
          </h1>
          <p className="text-gray-400 mt-1">
            Dynamic registry, dependency routing, and orchestration pipelines for the AegisOS modular framework.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-indigo-900/40 text-indigo-400 border border-indigo-700/50 px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" /> 23 Capability Domains
          </Badge>
          <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> Sandbox Verified
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800/50">
        <div className="flex space-x-6 overflow-x-auto scrollbar-none pb-px">
          {tabsItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loading size="lg" label="Syncing capabilities registry..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: REGISTRY */}
          {activeTab === "registry" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill) => (
                <Card key={skill.id} className="bg-[#121216] border-gray-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge className="bg-gray-800 text-gray-300 border border-gray-700/60 font-medium px-2 py-0.5 text-[10px]">
                          {skill.domain}
                        </Badge>
                        <CardTitle className="text-lg font-bold text-gray-100 flex items-center gap-2 mt-1.5">
                          {skill.name}
                        </CardTitle>
                      </div>
                      <Switch
                        checked={skill.status === "enabled"}
                        onChange={() => handleToggleSkill(skill.id, skill.status)}
                      />
                    </div>
                    <CardDescription className="text-gray-400 text-xs mt-2 leading-relaxed">
                      {skill.purpose}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="border-t border-gray-800/80 pt-3 flex flex-wrap gap-1">
                      {skill.triggers.slice(0, 3).map((trigger: string, idx: number) => (
                        <Badge key={idx} className="bg-indigo-950/20 text-indigo-300 border border-indigo-900/40 text-[10px] py-px">
                          {trigger}
                        </Badge>
                      ))}
                      {skill.triggers.length > 3 && (
                        <span className="text-[10px] text-gray-500 self-center pl-1">
                          +{skill.triggers.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-gray-900/30 border border-gray-800/50 rounded-lg p-2.5 text-center text-xs">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Confidence</p>
                        <p className="text-gray-200 font-semibold mt-0.5">{Math.round(skill.confidenceScore * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Cost Unit</p>
                        <p className="text-emerald-400 font-semibold mt-0.5">${skill.executionCost}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Latency</p>
                        <p className="text-gray-200 font-semibold mt-0.5">{skill.latencyMs}ms</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Version: {skill.version}</span>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Sandbox policy active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 2: INTENT DISCOVERY */}
          {activeTab === "discovery" && (
            <div className="space-y-6">
              <Card className="bg-[#121216] border-gray-800/80">
                <CardHeader>
                  <CardTitle className="text-xl">AegisOS Intent Discovery Engine</CardTitle>
                  <CardDescription className="text-gray-400">
                    Input a natural language request, and the engine will dynamically parse triggers, verify active dependencies, and select the optimal execution path.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDiscoverySearch} className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 h-4 text-gray-500" />
                      <Input
                        value={intentQuery}
                        onChange={(e) => setIntentQuery(e.target.value)}
                        placeholder="e.g. Write devops configuration, design security patterns and scan code files"
                        className="pl-10 bg-gray-900/50 border-gray-800 text-gray-200 focus:border-indigo-500 h-10"
                      />
                    </div>
                    <Button type="submit" disabled={discovering} className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-semibold flex gap-1.5">
                      {discovering ? <Loading size="sm" /> : <Search className="w-4 h-4" />} Discover Skills
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {discoveryResults.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-300">Matching Capabilities Found ({discoveryResults.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discoveryResults.map((result, idx) => (
                      <Card key={idx} className="bg-[#121216] border-gray-850 p-4 flex flex-col justify-between hover:border-gray-700 transition duration-200">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 rounded-full px-2 py-0.5">
                              {result.skill.domain}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400">Match Rank:</span>
                              <Badge className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/40">
                                {Math.round(result.confidenceScore * 100)}% Confidence
                              </Badge>
                            </div>
                          </div>
                          <h4 className="text-md font-bold text-gray-100">{result.skill.name}</h4>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{result.skill.purpose}</p>
                          <p className="text-xs text-gray-500 mt-2">Match Criteria: <span className="font-semibold text-gray-300">{result.matchType.toUpperCase()}</span></p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                          <span>Unit cost: ${result.skill.executionCost}</span>
                          <span>Latency: {result.skill.latencyMs}ms</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : intentQuery && !discovering ? (
                <div className="text-center py-10 text-gray-500">
                  No matching capability domains found for input query. Try search triggers like "dbt", "docker", "gcp", or "security".
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: ORCHESTRATION SIMULATOR */}
          {activeTab === "orchestration" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Selector */}
              <div className="space-y-4">
                <Card className="bg-[#121216] border-gray-800/80">
                  <CardHeader>
                    <CardTitle className="text-lg">Compose Orchestration Chain</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      Compose multi-skill chains to run end-to-end workflows (e.g. Research → Architecture → Diagram → Code Gen).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {skills.map(s => {
                        const selected = selectedChain.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleChainSelection(s.id)}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition duration-150 cursor-pointer ${
                              selected 
                                ? "bg-indigo-950/20 border-indigo-500/60 text-indigo-300"
                                : "bg-gray-900/30 border-gray-800 text-gray-400 hover:bg-gray-900/50"
                            }`}
                          >
                            <span className="text-xs font-semibold">{s.name}</span>
                            {selected ? <CheckCircle2 className="w-4 h-4 text-indigo-500" /> : <Plus className="w-4 h-4 text-gray-600" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleVerifyComposition}
                        disabled={selectedChain.length === 0 || composing}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs"
                      >
                        {composing ? "Resolving..." : "Verify Pipeline"}
                      </Button>
                      <Button
                        onClick={() => { setSelectedChain([]); setCompositionResult(null); setSimulationLogs([]); setSimulationStatus("idle"); }}
                        className="border border-gray-800 hover:bg-gray-900 text-xs text-gray-400"
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Composition Graph & Runner */}
              <div className="lg:col-span-2 space-y-4">
                {compositionResult ? (
                  <Card className="bg-[#121216] border-gray-800/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Orchestration Graph Definition</CardTitle>
                        <Badge className={compositionResult.compatible ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/50" : "bg-rose-950/30 text-rose-400 border border-rose-900/50"}>
                          {compositionResult.compatible ? "Validated Compatibility" : "Validation Failed"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Flowchart Diagram */}
                      <div className="bg-gray-950/60 border border-gray-800/50 rounded-xl p-6 flex flex-wrap items-center justify-center gap-4">
                        {compositionResult.pipeline.map((skillId: string, idx: number) => {
                          const skill = skills.find(s => s.id === skillId);
                          return (
                            <React.Fragment key={skillId}>
                              <div className="flex flex-col items-center p-3 bg-gray-900 border border-gray-800 rounded-lg min-w-[120px] text-center shadow-lg">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{skill?.domain || "Skill"}</span>
                                <span className="text-xs font-semibold text-gray-200 mt-1">{skill?.name || skillId}</span>
                              </div>
                              {idx < compositionResult.pipeline.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-indigo-500 animate-pulse" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Error Messages */}
                      {compositionResult.errors.length > 0 && (
                        <div className="space-y-2">
                          {compositionResult.errors.map((err: string, i: number) => (
                            <Alert key={i} className="bg-rose-950/20 border-rose-900/40 text-rose-300 text-xs">
                              <AlertTriangle className="w-4 h-4 text-rose-400" /> {err}
                            </Alert>
                          ))}
                        </div>
                      )}

                      {/* Run Console Simulator */}
                      {compositionResult.compatible && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-t border-gray-800/80 pt-4">
                            <span className="text-xs text-gray-400">Ready to simulate sequence. Output variables will feed forward.</span>
                            <Button 
                              onClick={handleRunSimulation} 
                              disabled={simulating} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs flex gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5" /> Start Simulation
                            </Button>
                          </div>

                          {simulationLogs.length > 0 && (
                            <div className="bg-black/80 rounded-lg p-4 font-mono text-[11px] space-y-2 border border-gray-900 max-h-[250px] overflow-y-auto scrollbar-thin">
                              <p className="text-indigo-400 font-bold mb-1">AegisOS Orchestrator Console logs:</p>
                              {simulationLogs.map((log, idx) => (
                                <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-gray-950 pb-1.5 last:border-b-0">
                                  <span className="text-gray-600 font-bold">[{log.step}]</span>
                                  <div className="flex-1">
                                    <span className="text-gray-300 font-semibold">{log.skillName}: </span>
                                    <span className={
                                      log.status === "success" ? "text-emerald-400" :
                                      log.status === "failed" ? "text-rose-400" : "text-amber-400 animate-pulse"
                                    }>
                                      {log.message}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {simulationStatus === "succeeded" && (
                                <p className="text-emerald-500 font-bold mt-2">✓ Dynamic orchestration completed successfully.</p>
                              )}
                              {simulationStatus === "failed" && (
                                <p className="text-rose-500 font-bold mt-2">✗ Orchestration pipeline execution aborted due to error.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="border border-dashed border-gray-800 rounded-xl py-20 flex flex-col items-center justify-center text-gray-500">
                    <GitPullRequest className="w-10 h-10 mb-3 text-gray-650" />
                    <p className="text-sm">No pipeline chain selected.</p>
                    <p className="text-xs text-gray-600 mt-1">Select skills from the registry on the left and click "Verify Pipeline".</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY & ANALYTICS */}
          {activeTab === "telemetry" && analytics && (
            <div className="space-y-6">
              {/* Analytics Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#121216] border-gray-800/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Runs</span>
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2">{analytics.totalExecs}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Successful + failed runs count</p>
                </Card>

                <Card className="bg-[#121216] border-gray-800/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Avg Latency</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2">{analytics.avgLatency}ms</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Total average execute time</p>
                </Card>

                <Card className="bg-[#121216] border-gray-800/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Total Cost Unit</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2">${analytics.totalCost}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Model tokens usage charges estimation</p>
                </Card>

                <Card className="bg-[#121216] border-gray-800/80 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Violations Blocked</span>
                    <Shield className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold mt-2 text-rose-500">{analytics.violationsCount}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">Sandbox policy unauthorized events blocked</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Skills */}
                <Card className="bg-[#121216] border-gray-800/80 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-md">Most Executed Domains</CardTitle>
                    <CardDescription className="text-xs text-gray-400">Capability modules receiving highest runtime traffic.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.topSkills.length > 0 ? (
                      analytics.topSkills.map((s: any, idx: number) => {
                        const skill = skills.find(sk => sk.id === s.skillId);
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/30 rounded border border-gray-850">
                            <div>
                              <p className="text-xs font-semibold text-gray-300">{skill?.name || s.skillId}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{skill?.domain || "System"}</p>
                            </div>
                            <Badge className="bg-indigo-950/20 text-indigo-400 border border-indigo-900/40 font-mono text-xs">{s.count} runs</Badge>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-6">No executions tracked yet. Run some simulations to view analytics.</p>
                    )}
                  </CardContent>
                </Card>

                {/* History list */}
                <Card className="bg-[#121216] border-gray-800/80 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-md">Observability & Logs Registry</CardTitle>
                    <CardDescription className="text-xs text-gray-400">Recent telemetry records for execution metrics.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.latencyHistory.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {analytics.latencyHistory.map((h: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-950/40 rounded border border-gray-900/80 font-mono">
                            <span className="text-indigo-400">{new Date(h.timestamp).toLocaleTimeString()}</span>
                            <span className="text-gray-400">Latency Metric Log</span>
                            <span className="font-semibold text-emerald-400">{h.value}ms</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-10">No metric logs registered.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 5: MARKETPLACE */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-900/40 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    AegisOS Skill Marketplace
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Download and extend your AI's runtime capability domains with verified third-party integrations and tools packages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceItems.map((item) => {
                  const installed = installedPackages.includes(item.id);
                  const installing = installingId === item.id;
                  
                  return (
                    <Card key={item.id} className="bg-[#121216] border-gray-800/80 flex flex-col justify-between p-4 hover:border-indigo-500/50 transition-all duration-200">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{item.author}</span>
                            <h4 className="text-md font-bold text-gray-100 mt-0.5">{item.name}</h4>
                          </div>
                          <Badge className="bg-yellow-950/20 text-yellow-500 border border-yellow-900/30 text-xs px-2 py-0.5">
                            ★ {item.rating}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{item.desc}</p>
                        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500">
                          <span>Version: {item.version}</span>
                          <span>|</span>
                          <span className="text-indigo-400 font-semibold">Metered Unit Cost: ${item.cost}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-800/60 flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-400">Free Install</span>
                        <Button
                          onClick={() => handleInstallMarketplace(item.id)}
                          disabled={installed || installing}
                          className={`text-xs px-4 py-1.5 h-8 font-semibold rounded-lg transition duration-200 ${
                            installed
                              ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/50"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {installing ? "Installing..." : installed ? "Active" : "Install"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
