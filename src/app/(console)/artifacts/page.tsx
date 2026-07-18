"use client";

import React, { useState } from "react";
import {
  FileCode,
  FileText,
  FileCheck,
  Workflow,
  Image as ImageIcon,
  BookOpen,
  Search,
  Download,
  Eye,
  X,
} from "lucide-react";
import { useWorkspaceStore, WorkspaceArtifact } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";

export default function ArtifactLibraryPage() {
  const { artifacts } = useWorkspaceStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeArtifact, setActiveArtifact] = useState<WorkspaceArtifact | null>(null);

  const categories = [
    { id: "all", name: "All Artifacts" },
    { id: "pdf", name: "PDF Reports" },
    { id: "markdown", name: "Markdown Documents" },
    { id: "architecture", name: "Architecture Diagrams" },
    { id: "image", name: "Generated Images" },
    { id: "decision_log", name: "Decision Logs (ADR)" },
  ];

  const filteredArtifacts = artifacts.filter((art) => {
    const matchesCat = selectedCategory === "all" || art.type === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <FileCode className="h-6 w-6 text-purple-400" />
            <span>Artifact Library</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse and view system artifacts: PDF reports, Markdown documents, Architecture diagrams, Images, and Decision Logs.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-1 border-b sm:border-b-0 border-border/30 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search artifacts..."
            className="w-full rounded-lg border border-border/40 bg-card pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ARTIFACT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtifacts.map((art) => (
          <div
            key={art.id}
            className="rounded-xl border border-border/40 bg-card p-5 space-y-4 hover:border-border/80 transition-all flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {art.type === "markdown" ? (
                    <FileText className="h-5 w-5" />
                  ) : art.type === "architecture" ? (
                    <Workflow className="h-5 w-5" />
                  ) : (
                    <FileCheck className="h-5 w-5" />
                  )}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted/40 text-muted-foreground">
                  {art.category}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-foreground text-sm line-clamp-1">{art.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{art.summary}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/20 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>{art.fileSize || "8.4 KB"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveArtifact(art)}
                className="text-xs h-7 px-2.5 flex items-center space-x-1"
              >
                <Eye className="h-3 w-3" />
                <span>View</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ARTIFACT VIEWER MODAL */}
      {activeArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{activeArtifact.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{activeArtifact.category} • {activeArtifact.fileSize}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveArtifact(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
              <div className="rounded-lg border border-border/30 bg-background/70 p-4 space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Summary</span>
                <p className="text-foreground">{activeArtifact.summary}</p>
              </div>

              <div className="rounded-lg border border-border/30 bg-background/90 p-4 space-y-2 text-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {activeArtifact.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/20 flex justify-end space-x-2 bg-card">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(activeArtifact.content);
                }}
                className="text-xs"
              >
                Copy Content
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveArtifact(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
