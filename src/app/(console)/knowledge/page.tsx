"use client";

import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  Zap,
  FolderGit2,
  BarChart3,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";

export default function KnowledgeBrowserPage() {
  const {
    knowledgeDocs,
    importDocument,
    triggerKnowledgeBuild,
    isIndexing,
    projects,
    health,
  } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<"docs" | "embeddings" | "repos" | "stats" | "coverage">("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  // Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<"markdown" | "pdf" | "code">("markdown");
  const [docContent, setDocContent] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const matches = knowledgeDocs.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(matches);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    await importDocument({
      name: docName,
      type: docType,
      content: docContent || "Sample ingested knowledge document.",
    });
    setDocName("");
    setDocContent("");
    setShowDocModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-400" />
            <span>Knowledge Browser</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Explore indexed documents, vector embeddings, CodeGraph repository status, knowledge statistics, and search coverage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerKnowledgeBuild}
            disabled={isIndexing}
            className="text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isIndexing ? "animate-spin text-primary" : ""}`} />
            <span>{isIndexing ? "Indexing..." : "Reindex Knowledge"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowDocModal(true)}
            className="text-xs flex items-center space-x-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Document</span>
          </Button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Query semantic knowledge memory index..."
          className="w-full rounded-xl border border-border/40 bg-card pl-11 pr-24 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="absolute right-2 top-1.5 text-xs h-7 px-3"
        >
          Search
        </Button>
      </form>

      {/* TABS NAVIGATION */}
      <div className="flex items-center space-x-1 border-b border-border/30 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
            activeTab === "docs"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Indexed Documents</span>
          <span className="ml-1 bg-muted/40 px-1.5 py-0.2 rounded font-mono text-[10px]">
            {knowledgeDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("embeddings")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
            activeTab === "embeddings"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Embeddings</span>
        </button>

        <button
          onClick={() => setActiveTab("repos")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
            activeTab === "repos"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          <span>Repository Status</span>
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
            activeTab === "stats"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Knowledge Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab("coverage")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors ${
            activeTab === "coverage"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Search Coverage</span>
        </button>
      </div>

      {/* TAB CONTENTS */}
      {/* 1. INDEXED DOCUMENTS */}
      {activeTab === "docs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(searchResults || knowledgeDocs).map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-border/40 bg-card p-5 space-y-3 hover:border-border/80 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                  <h4 className="font-semibold text-foreground text-sm truncate">{doc.name}</h4>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground">
                  {doc.type}
                </span>
              </div>

              <p className="text-xs text-muted-foreground font-mono truncate">{doc.sourceUri}</p>

              <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-border/20 text-muted-foreground">
                <span>{doc.chunkCount} Chunks</span>
                <span className="text-emerald-400 font-semibold">{doc.vectorCount} Vectors</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. EMBEDDINGS */}
      {activeTab === "embeddings" && (
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div>
              <h3 className="font-bold text-foreground text-base">Vector Memory & Embedding Status</h3>
              <p className="text-xs text-muted-foreground">High-dimensional vector storage powered by local Ollama embedding models.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Status: Healthy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Embedding Model</span>
              <p className="text-sm font-bold text-foreground">ollama:gemma2:9b</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Vector Dimension</span>
              <p className="text-sm font-bold text-foreground">768 Dimensions</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Total Vectors</span>
              <p className="text-sm font-bold text-emerald-400">
                {knowledgeDocs.reduce((acc, d) => acc + d.vectorCount, 0)}
              </p>
            </div>
            <div className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase">Index Memory</span>
              <p className="text-sm font-bold text-foreground">{health.storage.indexSizeMb} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. REPOSITORY STATUS */}
      {activeTab === "repos" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">{p.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    CodeGraph Indexed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="pt-2 flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border/20">
                  <span>Branch: {p.branch || "main"}</span>
                  <span>{p.commitCount || 0} commits parsed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. KNOWLEDGE STATISTICS */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
            <span className="text-xs text-muted-foreground uppercase">Total Documents</span>
            <p className="text-3xl font-bold text-foreground">{knowledgeDocs.length}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
            <span className="text-xs text-muted-foreground uppercase">Code Graph Entities</span>
            <p className="text-3xl font-bold text-foreground">14,280</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
            <span className="text-xs text-muted-foreground uppercase">Entity Relations</span>
            <p className="text-3xl font-bold text-foreground">48,920</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
            <span className="text-xs text-muted-foreground uppercase">Vector Chunks</span>
            <p className="text-3xl font-bold text-emerald-400">
              {knowledgeDocs.reduce((acc, d) => acc + d.chunkCount, 0)}
            </p>
          </div>
        </div>
      )}

      {/* 5. SEARCH COVERAGE */}
      {activeTab === "coverage" && (
        <div className="rounded-xl border border-border/40 bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div>
              <h3 className="font-bold text-foreground text-base">Semantic Search Coverage</h3>
              <p className="text-xs text-muted-foreground">Percentage of repository symbols and documentation reachable by vector retrieval.</p>
            </div>
            <span className="text-lg font-bold text-emerald-400 font-mono">100.0% Coverage</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>TypeScript / JS Symbol Graph</span>
                <span>100%</span>
              </div>
              <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Markdown & System Specifications</span>
                <span>100%</span>
              </div>
              <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT DOC MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Document</h3>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. ARCHITECTURE_SPEC.md"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e: any) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="markdown">Markdown</option>
                  <option value="pdf">PDF Document</option>
                  <option value="code">Source Code</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Content
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Paste specification content..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowDocModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Import Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
