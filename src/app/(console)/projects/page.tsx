"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  FileText,
  Database,
  Box,
  Puzzle,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
  Shield,
  Zap,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";

interface TreeNode {
  id: string;
  name: string;
  type: "category" | "repo" | "doc" | "source" | "pack" | "extension";
  icon: any;
  children?: TreeNode[];
  metadata?: Record<string, any>;
}

export default function ProjectExplorerPage() {
  const {
    projects,
    knowledgeDocs,
    importRepository,
    importDocument,
    workspaces,
    activeWorkspaceId,
  } = useWorkspaceStore();

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    cat_repos: true,
    cat_docs: true,
    cat_sources: true,
    cat_packs: true,
    cat_exts: true,
  });

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Forms
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build tree structure
  const treeData: TreeNode[] = [
    {
      id: "cat_repos",
      name: "Repositories",
      type: "category",
      icon: FolderGit2,
      children: projects.map((p) => ({
        id: p.id,
        name: p.name,
        type: "repo",
        icon: FolderGit2,
        metadata: {
          url: p.repositoryUrl || "https://github.com/rjmad1/AegisOS",
          branch: p.branch || "main",
          commits: p.commitCount || 342,
          status: p.status,
          description: p.description,
          goals: p.goals,
        },
      })),
    },
    {
      id: "cat_docs",
      name: "Documents",
      type: "category",
      icon: FileText,
      children: knowledgeDocs.map((d) => ({
        id: d.id,
        name: d.name,
        type: "doc",
        icon: FileText,
        metadata: {
          fileType: d.type,
          chunkCount: d.chunkCount,
          vectorCount: d.vectorCount,
          status: d.embeddingStatus,
          uri: d.sourceUri,
        },
      })),
    },
    {
      id: "cat_sources",
      name: "Knowledge Sources",
      type: "category",
      icon: Database,
      children: [
        {
          id: "ks-01",
          name: "CodeGraph AST Parser",
          type: "source",
          icon: Database,
          metadata: { type: "AST Graph", status: "online", nodeCount: 14200, edgeCount: 48900 },
        },
        {
          id: "ks-02",
          name: "Ollama Vector Memory Store",
          type: "source",
          icon: Database,
          metadata: { type: "Chroma / SQLite", status: "online", dimension: 768, indexType: "HNSW" },
        },
      ],
    },
    {
      id: "cat_packs",
      name: "Mission Packs",
      type: "category",
      icon: Box,
      children: [
        {
          id: "mp-01",
          name: "Security Audit Pack",
          type: "pack",
          icon: Box,
          metadata: { version: "v1.4.0", scope: "Zero Trust", permissions: "Read-only REST" },
        },
        {
          id: "mp-02",
          name: "Knowledge Indexer Pack",
          type: "pack",
          icon: Box,
          metadata: { version: "v2.1.0", scope: "Semantic Graph", vectorEngine: "gemma2:9b" },
        },
      ],
    },
    {
      id: "cat_exts",
      name: "Extensions",
      type: "category",
      icon: Puzzle,
      children: [
        {
          id: "ext-01",
          name: "LiteLLM Proxy Bridge",
          type: "extension",
          icon: Puzzle,
          metadata: { status: "active", endpoint: "http://127.0.0.1:4000", auth: "Bearer" },
        },
        {
          id: "ext-02",
          name: "Ollama Loopback Tunnel",
          type: "extension",
          icon: Puzzle,
          metadata: { status: "active", endpoint: "http://127.0.0.1:11434", models: ["gemma2:9b", "llama3.2"] },
        },
      ],
    },
  ];

  const handleImportRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName.trim() || !repoUrl.trim()) return;
    await importRepository({ name: repoName, repositoryUrl: repoUrl });
    setRepoName("");
    setRepoUrl("");
    setShowRepoModal(false);
  };

  const handleImportDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    await importDocument({
      name: docName,
      type: "markdown",
      content: docContent || "Sample doc content",
    });
    setDocName("");
    setDocContent("");
    setShowDocModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <FolderGit2 className="h-6 w-6 text-blue-400" />
            <span>Project Explorer</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Structured workspace content tree for Repositories, Documents, Knowledge Sources, Mission Packs, and Extensions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRepoModal(true)}
            className="text-xs flex items-center space-x-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Repository</span>
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

      {/* TREE & INSPECTOR SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TREE VIEW PANEL */}
        <div className="lg:col-span-1 rounded-xl border border-border/40 bg-card p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tree nodes..."
              className="w-full rounded-lg border border-border/40 bg-background/50 pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1 font-mono text-xs select-none">
            {treeData.map((category) => {
              const isCatExpanded = expandedNodes[category.id];
              const CatIcon = category.icon;

              const filteredChildren = category.children?.filter((child) =>
                child.name.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (searchTerm && filteredChildren?.length === 0) return null;

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleNode(category.id)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-accent/40 cursor-pointer text-foreground font-semibold"
                  >
                    {isCatExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <CatIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs">{category.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto bg-muted/40 px-1.5 py-0.2 rounded">
                      {category.children?.length || 0}
                    </span>
                  </div>

                  {/* Category Children */}
                  {isCatExpanded && (
                    <div className="pl-6 space-y-0.5 border-l border-border/20 ml-4">
                      {filteredChildren?.map((child) => {
                        const ChildIcon = child.icon;
                        const isSelected = selectedNode?.id === child.id;

                        return (
                          <div
                            key={child.id}
                            onClick={() => setSelectedNode(child)}
                            className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            }`}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{child.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* INSPECTOR DETAILS PANEL */}
        <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card p-6 space-y-4">
          {selectedNode ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/20 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <selectedNode.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedNode.name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                      Type: {selectedNode.type}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Active in Workspace
                </span>
              </div>

              {/* METADATA PROPERTIES */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Node Metadata & Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {Object.entries(selectedNode.metadata || {}).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase">{key}</span>
                      <p className="text-foreground font-semibold truncate">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Layers className="h-12 w-12 text-muted-foreground/30 stroke-1" />
              <div>
                <h4 className="font-semibold text-foreground text-sm">Select a Tree Node</h4>
                <p className="text-xs max-w-sm">
                  Click on any Repository, Document, Knowledge Source, Mission Pack, or Extension in the tree view to inspect its metadata and configuration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IMPORT REPO MODAL */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Repository</h3>
            <form onSubmit={handleImportRepoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="e.g. AegisOS Core Engine"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo.git"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" type="button" onClick={() => setShowRepoModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Import Repository
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT DOC MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Import Document</h3>
            <form onSubmit={handleImportDocSubmit} className="space-y-4">
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
