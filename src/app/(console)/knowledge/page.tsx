// ============================================================================
// Knowledge Fabric Console Dashboard Page — Phase 8
// ============================================================================

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  RefreshCw,
  GitBranch,
  Layers,
  Activity,
  FolderOpen,
  Eye,
  Sliders,
  Cpu,
  ArrowRight,
  Database,
  Terminal,
  Clock,
  HelpCircle,
  FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataGrid } from "@/components/ui/DataGrid";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { EntityInspector } from "@/components/knowledge/EntityInspector";
import { KnowledgeEntity, KnowledgeCollection } from "@/types/knowledge";

export default function KnowledgePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "explorer";
  const urlFocusId = searchParams.get("focus") || "";

  // Data state
  const [entities, setEntities] = React.useState<KnowledgeEntity[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [graphData, setGraphData] = React.useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [collections, setCollections] = React.useState<KnowledgeCollection[]>([]);
  const [topics, setTopics] = React.useState<any[]>([]);
  const [timeline, setTimeline] = React.useState<any[]>([]);
  
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
      // 1. Fetch collections, topics, timeline, and full graph structures
      const [colRes, topRes, timeRes, graphRes] = await Promise.all([
        fetch("/api/v1/knowledge/collections").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/topics").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/timeline").then(r => r.ok ? r.json() : []),
        fetch("/api/v1/knowledge/graph").then(r => r.ok ? r.json() : { nodes: [], edges: [] })
      ]);

      setCollections(colRes);
      setTopics(topRes);
      setTimeline(timeRes);
      setGraphData(graphRes);

      // 2. Fetch paginated entities
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
    // Preserves focused node if moving to graph/explorer
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
        <p className="text-sm font-semibold text-muted-foreground">Ingesting semantic knowledge graphs...</p>
      </div>
    );
  }

  const artifacts = graphData.nodes.filter(n => n.type === "artifact");

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise knowledge fabric</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trace, discover, and inspect cross-linked relationships and provenance lineages across all system objects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing...
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
          { id: "timeline", label: "Event Timeline", icon: Clock },
          { id: "collections", label: "Collections", icon: FolderOpen },
          { id: "search-architecture", label: "RAG Architecture", icon: Sliders }
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
                  <option value="infrastructure">Infrastructure</option>
                  <option value="event">Event Logs</option>
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

        {/* 3. LINEAGE TRACER TAB (Step 5) */}
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
                        // Find node label
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
                    <p className="max-w-xs leading-normal">Lineage displays the chronological generation chain from original user template down to active PDF files.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. EVENT TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chronological Event Log</CardTitle>
                <CardDescription>Unified registry tracking creation, execution, and system transactions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar border border-border/40 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Object Name</th>
                        <th className="p-3">Domain Type</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20 text-muted-foreground font-mono">
                      {timeline.map((evt, idx) => (
                        <tr key={idx} className="hover:bg-accent/10">
                          <td className="p-3 font-semibold text-foreground truncate max-w-[150px]">{new Date(evt.timestamp).toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant={evt.action === "bus-fire" ? "secondary" : evt.action === "run" ? "info" : "success"}>
                              {evt.action.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-foreground truncate max-w-[150px]">{evt.name}</td>
                          <td className="p-3 uppercase">{evt.type}</td>
                          <td className="p-3 text-muted-foreground truncate max-w-[280px]" title={evt.description}>{evt.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5. VIRTUAL COLLECTIONS TAB */}
        {activeTab === "collections" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {collections.map((col) => (
                <Card key={col.id} className="border-border/30 hover-glow bg-accent/5">
                  <CardHeader className="pb-2 text-left">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded bg-primary/10 border border-primary/20 text-primary">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="uppercase font-mono text-[9px]">
                        {col.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-mono mt-3 font-bold">{col.name}</CardTitle>
                    <CardDescription className="text-xs">{col.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 border-t border-border/20 text-left space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>Linked Entities</span>
                      <span className="font-bold text-foreground font-mono">{col.entityIds.length} nodes</span>
                    </div>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[9px] text-muted-foreground bg-secondary/30 p-1.5 rounded space-y-1">
                      {col.entityIds.slice(0, 5).map(id => (
                        <div key={id} className="truncate select-none">&bull; {id}</div>
                      ))}
                      {col.entityIds.length > 5 && (
                        <div className="text-[8px] font-bold text-primary">&bull; And {col.entityIds.length - 5} more items...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 6. RAG ARCHITECTURE SPECIFICATION TAB */}
        {activeTab === "search-architecture" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Semantic RAG Search Architecture Specifications</CardTitle>
                <CardDescription>Logical mapping layer ready for vector database integrations (Step 6).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border/40 bg-accent/5">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-primary mb-2">1. Embedding Ingestion API</h4>
                      <p className="text-xs text-muted-foreground leading-normal mb-3">
                        Interface `IEmbeddingProvider` handles quantization and dimension weights mapping. Ready to interface with local Ollama (`all-minilm`) embedding pools.
                      </p>
                      <pre className="text-[10px] bg-secondary/40 p-2.5 rounded font-mono leading-normal select-all">
{`interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  getDimension(): number;
}`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl border border-border/40 bg-accent/5">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-primary mb-2">2. Similarity Search Store</h4>
                      <p className="text-xs text-muted-foreground leading-normal mb-3">
                        Interface `IVectorStore` handles cluster segmentation indices. Supports future Chroma/Qdrant vector database hooks.
                      </p>
                      <pre className="text-[10px] bg-secondary/40 p-2.5 rounded font-mono leading-normal select-all">
{`interface IVectorStore {
  addChunks(chunks: Chunk[], vectors: number[][]): Promise<void>;
  similaritySearch(vector: number[], k: number): Promise<Chunk[]>;
}`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-border/40 bg-accent/5">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-primary mb-2">3. Hybrid Search & Reranking</h4>
                      <p className="text-xs text-muted-foreground leading-normal mb-3">
                        Integrates Reciprocal Rank Fusion (RRF) combining keyword matches from events logs with cosine similarity vectors.
                      </p>
                      <pre className="text-[10px] bg-secondary/40 p-2.5 rounded font-mono leading-normal select-all">
{`interface IHybridSearch {
  search(query: string, limit: number): Promise<Result[]>;
}`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl border border-border/40 bg-accent/5">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-primary mb-2">4. Query Expansion & Context Builder</h4>
                      <p className="text-xs text-muted-foreground leading-normal mb-3">
                        Prepares context prompts within token windows. Generates citation markers referencing original document chunks.
                      </p>
                      <pre className="text-[10px] bg-secondary/40 p-2.5 rounded font-mono leading-normal select-all">
{`interface IContextBuilder {
  buildContext(chunks: Chunk[], tokenLimit: number): string;
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
