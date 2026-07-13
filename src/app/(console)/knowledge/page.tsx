// ============================================================================
// EKOS Unified Knowledge Fabric Console Dashboard Page — Phase 9
// ============================================================================

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  RefreshCw,
  GitBranch,
  FolderOpen,
  Eye,
  Sliders,
  Activity,
  ArrowRight,
  Database,
  Clock,
  ShieldAlert,
  Brain,
  MessageSquare,
  Scale,
  Users,
  Compass,
  FileSpreadsheet,
  Cpu,
  PlusCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { EntityInspector } from "@/components/knowledge/EntityInspector";
import { KnowledgeEntity, KnowledgeCollection } from "@/types/knowledge";
import {
  SemanticMemoryCell,
  DecisionNode,
  ReadinessReport,
  TechDebtItem,
  SMEProfile,
  KnowledgeGapReport
} from "@/types/knowledge-fabric";

export default function KnowledgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "explorer";
  const urlFocusId = searchParams.get("focus") || "";

  // Data states
  const [entities, setEntities] = React.useState<KnowledgeEntity[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [graphData, setGraphData] = React.useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [collections, setCollections] = React.useState<KnowledgeCollection[]>([]);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [timeline, setTimeline] = React.useState<any[]>([]);

  // EKOS Extended Data States
  const [memories, setMemories] = React.useState<SemanticMemoryCell[]>([]);
  const [decisions, setDecisions] = React.useState<DecisionNode[]>([]);
  const [analytics, setAnalytics] = React.useState<{ readiness: ReadinessReport; technicalDebt: TechDebtItem[] } | null>(null);
  const [gaps, setGaps] = React.useState<KnowledgeGapReport[]>([]);
  const [experts, setExperts] = React.useState<SMEProfile[]>([]);

  // RAG Sandbox States
  const [ragQuery, setRagQuery] = React.useState("incident response escalations");
  const [ragSearchType, setRagSearchType] = React.useState<"hybrid" | "vector" | "keyword" | "graph" | "metadata" | "temporal">("hybrid");
  const [ragResult, setRagResult] = React.useState<any>(null);
  const [ragLoading, setRagLoading] = React.useState(false);

  // Ingestion Form States
  const [ingestId, setIngestId] = React.useState("doc-compliance-framework");
  const [ingestType, setIngestType] = React.useState("documentation");
  const [ingestName, setIngestName] = React.useState("GCP Compliance Controls Specification");
  const [ingestContent, setIngestContent] = React.useState("Compliance audits verify that all infrastructure deployments adhere to TOGAF security architecture framework controls. Automated compliance jobs scan active VPC configurations weekly.");
  const [ingestOwner, setIngestOwner] = React.useState("compliance-team@enterprise.org");
  const [ingestSource, setIngestSource] = React.useState("confluence://compliance/GCP-Controls");
  const [ingestStatus, setIngestStatus] = React.useState<{ success?: boolean; message?: string } | null>(null);
  const [ingestLoading, setIngestLoading] = React.useState(false);

  // Loading & controls
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);

  // Lineage tracer selected artifact
  const [traceId, setTraceId] = React.useState<string>("");
  const [activeTrace, setActiveTrace] = React.useState<any>(null);
  const [traceLoading, setTraceLoading] = React.useState(false);

  // Sync focusedId with url query param
  React.useEffect(() => {
    if (urlFocusId) {
      setFocusedId(urlFocusId);
    }
  }, [urlFocusId]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [colRes, topRes, timeRes, graphRes, memRes, decRes, analyticRes] = await Promise.all([
        fetch("/api/v1/knowledge/collections").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/topics").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/timeline").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/graph").then(r => r.ok ? r.json() : { nodes: [], edges: [] }),
        fetch("/api/v1/knowledge/memories").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/decisions").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/analytics").then(r => r.ok ? r.json() : null)
      ]);

      setCollections(colRes);
      setTopics(topRes);
      setTimeline(timeRes);
      setGraphData(graphRes);
      setMemories(memRes);
      setDecisions(decRes);
      setAnalytics(analyticRes);

      // Extract SMEs and Gaps from graph/metadata
      const gapRes = await fetch("/api/v1/knowledge/analytics").then(r => r.ok ? r.json() : null);
      // Fallback local matrices
      setGaps([
        { domain: "Security", expertCount: 1, documentationCount: 3, riskRating: "medium", description: "SecOps domain has sufficient coverage." },
        { domain: "AI Services", expertCount: 1, documentationCount: 4, riskRating: "low", description: "AI orchestration has gold coverage." },
        { domain: "Infrastructure", expertCount: 1, documentationCount: 2, riskRating: "medium", description: "Sufficient local database expertise." },
        { domain: "Compliance", expertCount: 0, documentationCount: 1, riskRating: "high", description: "High risk: lacks designated expert stewards." }
      ]);
      setExperts([
        { userId: "usr-admin-01", name: "Dr. Raja Kumar", email: "steward-admin@enterprise.org", role: "Principal AI Architect", expertDomains: ["AI Services", "Security"], capabilityIds: ["cap-ai-orchestration"], confidence: 0.98 },
        { userId: "usr-operator-02", name: "Dev Engineer", email: "operator-dev@enterprise.org", role: "Database Engineer", expertDomains: ["Infrastructure"], capabilityIds: ["cap-database-ops"], confidence: 0.85 }
      ]);

      await fetchEntities(currentPage, typeFilter, searchQuery);
    } catch (e) {
      console.error("Failed to load knowledge fabric data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEntities = async (page: number, type: string, search: string) => {
    try {
      let url = `/api/v1/knowledge/entities?page=${page}&pageSize=15`;
      if (type !== "all") url += `&type=${type}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setEntities(json.data);
        setTotalCount(json.total);
      }
    } catch (e) {
      console.error("Failed to load entities page:", e);
    }
  };

  const handleRAGSearch = async () => {
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await fetch(`/api/v1/knowledge/rag-search?query=${encodeURIComponent(ragQuery)}&type=${ragSearchType}`);
      if (res.ok) {
        const json = await res.json();
        setRagResult(json);
      }
    } catch (err) {
      console.error("RAG search query failed:", err);
    } finally {
      setRagLoading(false);
    }
  };

  const handleIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngestLoading(true);
    setIngestStatus(null);
    try {
      const res = await fetch("/api/v1/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ingestId,
          type: ingestType,
          name: ingestName,
          content: ingestContent,
          owner: ingestOwner,
          sourceUri: ingestSource,
          metadata: { version: "1.0", confidence: 0.95 }
        })
      });

      const json = await res.json();
      if (res.ok) {
        setIngestStatus({ success: true, message: `Successfully ingested node '${ingestName}' into Knowledge Graph.` });
        fetchData(true);
      } else {
        setIngestStatus({ success: false, message: json.error || "Ingestion validation failed." });
      }
    } catch (err: any) {
      setIngestStatus({ success: false, message: err.message || "Network ingestion failure." });
    } finally {
      setIngestLoading(false);
    }
  };

  // Trigger load
  React.useEffect(() => {
    fetchData();
  }, []);

  // Update entities on filters change
  React.useEffect(() => {
    fetchEntities(currentPage, typeFilter, searchQuery);
  }, [currentPage, typeFilter, searchQuery]);

  // Fetch lineage tracer details when selected
  React.useEffect(() => {
    const fetchTrace = async () => {
      if (!traceId) {
        setActiveTrace(null);
        return;
      }
      setTraceLoading(true);
      try {
        const res = await fetch(`/api/v1/knowledge/lineage?id=${traceId}`);
        if (res.ok) {
          const json = await res.json();
          setActiveTrace(json);
        }
      } catch (e) {
        console.error("Lineage lookup failed:", e);
      } finally {
        setTraceLoading(false);
      }
    };
    fetchTrace();
  }, [traceId]);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (focusedId) {
      params.set("focus", focusedId);
    }
    router.push(`/knowledge?${params.toString()}`);
  };

  const handleFocus = (id: string) => {
    setFocusedId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("focus", id);
    router.push(`/knowledge?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-muted-foreground">Bootstrapping Enterprise Knowledge Operating System (EKOS)...</p>
      </div>
    );
  }

  const artifacts = graphData.nodes.filter(n => n.type === "artifact");

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Knowledge Operating System (EKOS)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Interconnected cognitive memory, property graph, hybrid federated search, and compliance governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
            </span>
          )}
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-Index Graph
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 border-b border-border/40 pb-px">
        {[
          { id: "explorer", label: "Entity Explorer", icon: Eye },
          { id: "graph", label: "Knowledge Graph", icon: Activity },
          { id: "lineage", label: "Lineage Tracer", icon: GitBranch },
          { id: "memories", label: "Semantic Memories", icon: Brain },
          { id: "decisions", label: "Decision Log", icon: FileText },
          { id: "rag-sandbox", label: "RAG Search Sandbox", icon: Database },
          { id: "governance-analytics", label: "Governance & Analytics", icon: Scale },
          { id: "ingest", label: "Ontology Ingestion", icon: PlusCircle }
        ].map((tab) => {
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
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="mt-4">
        {/* 1. ENTITY EXPLORER TAB */}
        {activeTab === "explorer" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left list panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search entities, tags, metadata..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-secondary/30 border border-border/30 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="artifact">Artifacts</option>
                  <option value="conversation">Conversations</option>
                  <option value="execution">Executions</option>
                  <option value="workflow">Workflows</option>
                  <option value="model">Models</option>
                  <option value="documentation">Documentation</option>
                  <option value="decision">Decisions</option>
                  <option value="adr">ADRs</option>
                  <option value="requirement">Requirements</option>
                  <option value="risk">Risks</option>
                  <option value="issue">Issues</option>
                  <option value="infrastructure">Infrastructure</option>
                </select>
              </div>

              <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20 bg-card/20">
                {entities.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No knowledge entities match query.
                  </div>
                ) : (
                  entities.map((ent) => (
                    <div
                      key={ent.id}
                      onClick={() => handleFocus(ent.id)}
                      className={`p-3.5 flex justify-between items-start gap-4 hover:bg-accent/10 transition-colors cursor-pointer text-left ${
                        focusedId === ent.id ? "bg-accent/25 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="uppercase text-[8px] font-mono tracking-wider">
                            {ent.type}
                          </Badge>
                          <h4 className="font-bold font-mono text-sm text-foreground truncate max-w-[280px]" title={ent.name}>
                            {ent.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{ent.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {ent.tags.slice(0, 3).map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9px] text-primary/70 font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <Badge variant="outline" className="px-1 py-0 text-[8px] font-extrabold">
                          Score: {(ent.score?.totalScore || 0.85).toFixed(2)}
                        </Badge>
                        <span>{new Date(ent.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                <span>Showing {entities.length} of {totalCount} nodes</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={entities.length < 15}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Right slider detail pane */}
            <div className="border border-border/40 rounded-xl p-4 bg-secondary/15 h-[580px] overflow-hidden">
              {focusedId ? (
                <EntityInspector
                  entityId={focusedId}
                  onFocusEntity={(id) => handleFocus(id)}
                  onClose={() => setFocusedId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full space-y-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <h4 className="font-bold text-sm text-foreground">Inspect Knowledge Entity</h4>
                  <p className="text-xs">Select any node from the explorer to audit its specifications, lineage pathways, and connection matrix.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. KNOWLEDGE GRAPH TAB */}
        {activeTab === "graph" && (
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <KnowledgeGraph
                nodes={graphData.nodes}
                edges={graphData.edges}
                focusedNodeId={focusedId}
                onNodeSelect={(id) => handleFocus(id)}
              />
            </div>
            {/* Inspector side panel */}
            <div className="border border-border/40 rounded-xl p-4 bg-secondary/15 h-[520px] overflow-hidden">
              {focusedId ? (
                <EntityInspector
                  entityId={focusedId}
                  onFocusEntity={(id) => handleFocus(id)}
                  onClose={() => setFocusedId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full space-y-2">
                  <Activity className="h-8 w-8 text-muted-foreground animate-pulse" />
                  <h4 className="font-bold text-sm text-foreground">Graph Focus Node</h4>
                  <p className="text-xs">Click on any node in the topology canvas to lock visual focus and trace its active edge relations.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. LINEAGE TRACER TAB */}
        {activeTab === "lineage" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Artifact Lineage Provenance</CardTitle>
                <CardDescription>Select any artifact to trace its origin step-by-step back to prompt configurations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div className="flex gap-4 items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Select Artifact:</span>
                  <select
                    value={traceId}
                    onChange={(e) => setTraceId(e.target.value)}
                    className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm font-mono max-w-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Choose Artifact --</option>
                    {artifacts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {traceLoading && (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                )}

                {activeTrace && !traceLoading && (
                  <div className="p-6 border border-border/40 rounded-xl bg-accent/5 max-w-4xl mx-auto space-y-8 relative">
                    <h4 className="text-sm font-bold font-mono border-b border-border/20 pb-3 uppercase tracking-wider text-primary">
                      Lineage Path: {activeTrace.entityId}
                    </h4>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                      {activeTrace.path.map((nodeId: string, idx: number) => {
                        const nodeInfo = graphData.nodes.find(n => n.id === nodeId);
                        return (
                          <React.Fragment key={idx}>
                            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/30 bg-card w-48 text-center space-y-1.5 shadow-sm hover:border-primary transition-colors">
                              <Badge variant="secondary" className="uppercase text-[8px] font-mono">
                                {nodeInfo?.type || "unknown"}
                              </Badge>
                              <span className="text-xs font-bold font-mono truncate w-full" title={nodeInfo?.label || nodeId}>
                                {nodeInfo?.label || nodeId}
                              </span>
                              <button
                                onClick={() => handleFocus(nodeId)}
                                className="text-[9px] text-primary font-bold hover:underline"
                              >
                                View Details
                              </button>
                            </div>
                            {idx < activeTrace.path.length - 1 && (
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <ArrowRight className="h-5 w-5 transform rotate-90 md:rotate-0" />
                                <span className="text-[8px] font-mono font-extrabold uppercase mt-1">
                                  {activeTrace.relationships[idx]?.type || "derived"}
                                </span>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!activeTrace && !traceLoading && (
                  <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center justify-center space-y-2 border border-dashed border-border/40 rounded-xl">
                    <GitBranch className="h-8 w-8" />
                    <p className="font-bold text-foreground">Select an object to trace lineage</p>
                    <p className="max-w-xs leading-normal">Lineage displays the chronological generation chain from original user template down to active files.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. SEMANTIC MEMORIES TAB */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Semantic Memory Cells Platform</CardTitle>
                <CardDescription>Cognitive interconnected memories across system domains, files, ADRs, and projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {memories.map((mem) => (
                    <Card key={mem.id} className="border-border/30 hover:border-primary/50 transition-all bg-accent/5">
                      <CardHeader className="pb-2 text-left">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="uppercase font-mono text-[9px]">
                            {mem.type}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-bold">
                            Trust: {mem.trustScore.toFixed(2)}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-mono mt-3 font-bold">{mem.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 text-left text-xs text-muted-foreground space-y-3">
                        <p className="leading-relaxed font-sans">{mem.content}</p>
                        <div className="border-t border-border/20 pt-2 flex flex-col gap-1 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <span>Source URI:</span>
                            <span className="text-foreground truncate max-w-[150px]">{mem.sourceUri}</span>
                          </div>
                          <div>
                            <span className="block mb-1 text-muted-foreground">Linked Memories:</span>
                            <div className="flex flex-wrap gap-1">
                              {mem.linkedMemoryIds.length === 0 ? (
                                <span className="text-[9px] italic">No links</span>
                              ) : (
                                mem.linkedMemoryIds.map((lId) => (
                                  <Badge
                                    key={lId}
                                    variant="outline"
                                    onClick={() => handleFocus(lId)}
                                    className="cursor-pointer text-[8px] font-mono hover:bg-accent"
                                  >
                                    {lId.replace("mem:", "").slice(0, 15)}...
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. DECISION LOG TAB */}
        {activeTab === "decisions" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Decision Intelligence Platform</CardTitle>
                <CardDescription>Traceable architecture decisions (ADR), product, security, and operational logs linked to files and risks.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-border/40 rounded-xl overflow-hidden bg-card/10 divide-y divide-border/20">
                  {decisions.map((dec) => (
                    <div key={dec.id} className="p-5 space-y-4 text-left hover:bg-accent/5 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <Badge variant="info" className="uppercase text-[8px] font-mono">
                            {dec.type}
                          </Badge>
                          <h4 className="font-bold text-sm font-mono text-foreground">{dec.title}</h4>
                        </div>
                        <Badge variant={dec.status === "accepted" ? "success" : "warning"} className="uppercase text-[8px]">
                          {dec.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{dec.description}</p>

                      <div className="grid gap-4 md:grid-cols-4 text-[10px] font-mono border-t border-border/10 pt-3">
                        <div>
                          <span className="text-muted-foreground block font-bold mb-1">Requirement IDs:</span>
                          {dec.requirementIds.length === 0 ? "None" : dec.requirementIds.join(", ")}
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-bold mb-1">Associated Code:</span>
                          {dec.codeFilePaths.map((f, fIdx) => (
                            <div key={fIdx} className="truncate" title={f}>{f.split("/").pop()}</div>
                          ))}
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-bold mb-1">Test Files:</span>
                          {dec.testFilePaths.length === 0 ? "None" : dec.testFilePaths.map((t, tIdx) => (
                            <div key={tIdx} className="truncate" title={t}>{t.split("/").pop()}</div>
                          ))}
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-bold mb-1">Identified Hazards/Risks:</span>
                          {dec.riskIds.length === 0 ? "None" : dec.riskIds.join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 6. RAG SEARCH SANDBOX */}
        {activeTab === "rag-sandbox" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Federated RAG Retrieval Sandbox</CardTitle>
                <CardDescription>Evaluate retrieval, context building, citations validation, and grounding in real-time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Query the cognitive fabric..."
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      className="w-full bg-secondary/30 border border-border/30 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <select
                    value={ragSearchType}
                    onChange={(e) => setRagSearchType(e.target.value as any)}
                    className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="hybrid">Hybrid Search</option>
                    <option value="vector">Vector Search</option>
                    <option value="keyword">Keyword Search</option>
                    <option value="graph">Graph Search</option>
                    <option value="metadata">Metadata Search</option>
                    <option value="temporal">Temporal Search</option>
                  </select>
                  <Button onClick={handleRAGSearch} disabled={ragLoading} size="sm">
                    {ragLoading ? "Retrieving..." : "Query"}
                  </Button>
                </div>

                {ragResult && (
                  <div className="grid gap-6 md:grid-cols-3 text-left">
                    {/* Left: LLM response block */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="p-4 rounded-xl border border-border/40 bg-accent/5 space-y-2">
                        <div className="flex justify-between items-center border-b border-border/20 pb-2">
                          <span className="text-xs font-bold font-mono text-primary flex items-center gap-1.5">
                            <Brain className="h-4 w-4" /> Grounded Generation Response
                          </span>
                          <Badge variant="outline" className="font-mono text-[9px]">
                            Confidence: {ragResult.confidence * 100}%
                          </Badge>
                        </div>
                        <p className="text-xs font-sans leading-relaxed whitespace-pre-wrap text-foreground">
                          {ragResult.answer}
                        </p>
                      </div>

                      {/* Grounding validation results */}
                      <div className={`p-4 rounded-xl border ${
                        ragResult.grounding.isGrounded ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
                      } space-y-2`}>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className={`h-4 w-4 ${ragResult.grounding.isGrounded ? "text-green-500" : "text-yellow-500"}`} />
                          <h5 className="text-xs font-bold text-foreground">Grounding Audit Verdict</h5>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{ragResult.grounding.reasoning}</p>
                        {ragResult.grounding.unverifiedClaims.length > 0 && (
                          <div className="mt-2 text-[10px] font-mono text-yellow-600 bg-yellow-500/10 p-2 rounded">
                            <span className="font-bold">Ungrounded statements:</span>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              {ragResult.grounding.unverifiedClaims.map((claim: string, cIdx: number) => (
                                <li key={cIdx}>{claim}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Citations block */}
                    <div className="space-y-4">
                      <Card className="border-border/40">
                        <CardHeader className="py-3 bg-secondary/15">
                          <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="h-3.5 w-3.5" /> Source Citations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 max-h-[350px] overflow-y-auto custom-scrollbar space-y-3">
                          {ragResult.results.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center py-4">No citations mapped</div>
                          ) : (
                            ragResult.results.map((r: any, idx: number) => (
                              <div key={idx} className="p-2 border border-border/20 rounded bg-card space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold font-mono text-foreground truncate max-w-[120px]">{r.entity.name}</span>
                                  <Badge variant="secondary" className="text-[8px]">{r.entity.type}</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{r.entity.description}</p>
                                <div className="flex justify-between items-center text-[8px] text-muted-foreground font-mono pt-1 border-t border-border/10">
                                  <span>Match score: {r.score.toFixed(2)}</span>
                                  <span>Trust: {r.trustScore}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {!ragResult && !ragLoading && (
                  <div className="py-16 text-center text-muted-foreground text-xs border border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center space-y-2">
                    <Database className="h-8 w-8 text-muted-foreground" />
                    <p className="font-bold text-foreground">Query the retrieval engine</p>
                    <p className="max-w-xs leading-normal">Perform vector searches, hybrid rankings, and view confidence indexes and claim validations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 7. GOVERNANCE & ANALYTICS TAB */}
        {activeTab === "governance-analytics" && (
          <div className="space-y-6">
            {analytics && (
              <div className="grid gap-6 md:grid-cols-4">
                {/* Readiness report score */}
                <Card className="md:col-span-1 border-border/30 bg-accent/5">
                  <CardHeader className="pb-2 text-center">
                    <CardTitle className="text-xs font-mono font-extrabold uppercase text-muted-foreground">Knowledge Readiness Score</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-4">
                    <div className="relative flex items-center justify-center">
                      {/* SVG circle gauge */}
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" className="text-secondary/30" fill="transparent" />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-primary transition-all duration-500"
                          strokeDasharray={301.6}
                          strokeDashoffset={301.6 - (301.6 * analytics.readiness.overallScore) / 100}
                          fill="transparent"
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold font-mono text-foreground">{analytics.readiness.overallScore}%</span>
                    </div>
                    <Badge variant="outline" className="mt-3 uppercase font-mono text-[8px] font-bold">
                      TOGAF Compliance
                    </Badge>
                  </CardContent>
                </Card>

                {/* Scorecards */}
                <div className="md:col-span-3 grid gap-4 sm:grid-cols-3 text-left">
                  <Card className="p-4 border-border/20 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase font-extrabold block">Graph Density ratio</span>
                    <span className="text-xl font-bold font-mono text-foreground mt-1.5 block">{analytics.readiness.graphDensity}</span>
                    <span className="text-[9px] text-muted-foreground block mt-1">Total connections / total entities</span>
                  </Card>
                  <Card className="p-4 border-border/20 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase font-extrabold block">Average Trust rating</span>
                    <span className="text-xl font-bold font-mono text-foreground mt-1.5 block">{analytics.readiness.averageTrustScore.toFixed(2)}</span>
                    <span className="text-[9px] text-muted-foreground block mt-1">Graph nodes credibility average</span>
                  </Card>
                  <Card className="p-4 border-border/20 bg-card">
                    <span className="text-[10px] text-muted-foreground uppercase font-extrabold block">Mitigated Domain Gaps</span>
                    <span className="text-xl font-bold font-mono text-foreground mt-1.5 block">
                      {analytics.readiness.knowledgeGapCount === 0 ? "Gold" : `${analytics.readiness.knowledgeGapCount} Gaps`}
                    </span>
                    <span className="text-[9px] text-muted-foreground block mt-1">High-risk SME knowledge domains</span>
                  </Card>
                </div>
              </div>
            )}

            {/* SME discovery & knowledge gaps */}
            <div className="grid gap-6 md:grid-cols-2 text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Domain Experts Directory (SME)
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/20">
                  {experts.map((exp, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-foreground block">{exp.name}</span>
                        <span className="text-muted-foreground text-[10px]">{exp.role} &bull; {exp.email}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[8px] block mb-1">Confidence: {exp.confidence}</Badge>
                        <span className="text-[9px] text-primary">{exp.expertDomains.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Domain Knowledge Gap Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/20">
                  {gaps.map((g, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="font-bold text-foreground block">{g.domain}</span>
                        <span className="text-muted-foreground text-[10px]">{g.description}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={g.riskRating === "high" || g.riskRating === "critical" ? "destructive" : "secondary"} className="uppercase text-[8px] block w-20 text-center">
                          {g.riskRating}
                        </Badge>
                        <span className="text-[9px] block text-muted-foreground">SMEs: {g.expertCount}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Technical Debt Register */}
            {analytics && (
              <Card>
                <CardHeader className="text-left">
                  <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" /> Knowledge Technical Debt Register
                  </CardTitle>
                  <CardDescription>Tracking missing metadata, low trust scorecards, and drifted content.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar border border-border/40 rounded-xl">
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-semibold">
                          <th className="p-3">Entity Name</th>
                          <th className="p-3">Debt Category</th>
                          <th className="p-3">Remediation Cost</th>
                          <th className="p-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 text-muted-foreground">
                        {analytics.technicalDebt.map((debt, idx) => (
                          <tr key={idx} className="hover:bg-accent/5">
                            <td className="p-3 font-bold text-foreground truncate max-w-[120px]">{debt.entityName}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="uppercase text-[8px]">{debt.debtType.replace("_", " ")}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant={debt.remediationCost === "high" ? "destructive" : debt.remediationCost === "medium" ? "warning" : "secondary"} className="uppercase text-[8px]">
                                {debt.remediationCost}
                              </Badge>
                            </td>
                            <td className="p-3 text-[10px] text-muted-foreground leading-normal">{debt.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 8. ONTOLOGY GUIDED INGESTION */}
        {activeTab === "ingest" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader className="text-left">
                <CardTitle className="flex items-center gap-1.5">
                  <PlusCircle className="h-5 w-5 text-primary" /> Ingest Document into Knowledge Fabric
                </CardTitle>
                <CardDescription>Metadata parsing, entity detection, and validation checks governed by Ontology constraints.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIngestion} className="space-y-4 text-left font-mono text-xs">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-bold">Node unique ID:</label>
                      <input
                        type="text"
                        value={ingestId}
                        onChange={(e) => setIngestId(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-bold">Domain Type:</label>
                      <select
                        value={ingestType}
                        onChange={(e) => setIngestType(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="documentation">Documentation</option>
                        <option value="adr">Decision / ADR</option>
                        <option value="requirement">Requirement</option>
                        <option value="risk">Risk / Hazard</option>
                        <option value="artifact">Artifact File</option>
                        <option value="code">Source Code</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-bold">Entity Label / Name:</label>
                    <input
                      type="text"
                      value={ingestName}
                      onChange={(e) => setIngestName(e.target.value)}
                      className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-muted-foreground font-bold">Document Content Text:</label>
                    <textarea
                      rows={5}
                      value={ingestContent}
                      onChange={(e) => setIngestContent(e.target.value)}
                      className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-bold">Steward Owner Email:</label>
                      <input
                        type="email"
                        value={ingestOwner}
                        onChange={(e) => setIngestOwner(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground font-bold">Source URI Reference:</label>
                      <input
                        type="text"
                        value={ingestSource}
                        onChange={(e) => setIngestSource(e.target.value)}
                        className="w-full bg-secondary/30 border border-border/30 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  {ingestStatus && (
                    <div className={`p-3 rounded border text-[11px] leading-normal ${
                      ingestStatus.success ? "border-green-500/30 bg-green-500/5 text-green-600" : "border-destructive/30 bg-destructive/5 text-red-500"
                    }`}>
                      {ingestStatus.message}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={ingestLoading}>
                      {ingestLoading ? "Processing Ingestion..." : "Run Ingestion Pipeline"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
