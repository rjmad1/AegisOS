"use client";

import React, { useState } from "react";
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Rocket,
  Zap,
  FileCode,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function ActivityFeedPage() {
  const { activityFeed } = useWorkspaceStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const categories = [
    { id: "all", name: "All Activity" },
    { id: "workspace", name: "Workspace" },
    { id: "mission", name: "Mission" },
    { id: "execution", name: "Execution" },
    { id: "artifacts", name: "Artifacts" },
    { id: "approvals", name: "Approvals" },
    { id: "knowledge", name: "Knowledge Updates" },
  ];

  const filteredFeed = activityFeed.filter((act) => {
    const matchesCat = selectedCategory === "all" || act.category === selectedCategory;
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workspace":
        return <Layers className="h-4 w-4 text-primary" />;
      case "mission":
        return <Rocket className="h-4 w-4 text-sky-400" />;
      case "execution":
        return <Zap className="h-4 w-4 text-amber-400" />;
      case "artifacts":
        return <FileCode className="h-4 w-4 text-purple-400" />;
      case "approvals":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "knowledge":
        return <BookOpen className="h-4 w-4 text-emerald-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <Clock className="h-6 w-6 text-amber-400" />
            <span>Recent Activity Feed</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Unified timeline feed across Workspaces, Missions, Executions, Artifacts, Approvals, and Knowledge Updates.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
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
            placeholder="Filter timeline activity..."
            className="w-full rounded-lg border border-border/40 bg-card pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* UNIFIED TIMELINE */}
      <div className="rounded-xl border border-border/40 bg-card p-6 space-y-6">
        <div className="relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/30 space-y-6">
          {filteredFeed.map((act) => (
            <div key={act.id} className="relative pl-12 space-y-1">
              {/* Node dot icon */}
              <span className="absolute left-3 top-1 -translate-x-1/2 p-1.5 rounded-full bg-card border-2 border-border/60 shadow-sm">
                {getCategoryIcon(act.category)}
              </span>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-foreground text-sm">{act.title}</h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-muted/40 text-muted-foreground">
                    {act.category}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {new Date(act.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{act.description}</p>
              <p className="text-[11px] font-mono text-muted-foreground/80">Actor: {act.actor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
