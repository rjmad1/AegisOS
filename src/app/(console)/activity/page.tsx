// src/app/(console)/activity/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock, Search, Filter, CheckCircle2, AlertTriangle, Info,
  Layers, Rocket, Zap, FileCode, ShieldCheck, BookOpen, PlayCircle,
  HelpCircle, Server, Database, ShieldAlert, ArrowRight, CornerDownRight, RefreshCw
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/Button";

export default function ActivityFeedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters for deep links
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialGroup = searchParams.get("group") || "none";

  const { activityFeed } = useWorkspaceStore();
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [groupBy, setGroupBy] = useState<string>(initialGroup);
  const [loading, setLoading] = useState(true);

  // Sync state with url query parameters to support deep links
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchTerm) params.set("search", searchTerm);
    if (groupBy !== "none") params.set("group", groupBy);
    
    const queryStr = params.toString();
    router.replace(`/activity${queryStr ? "?" + queryStr : ""}`, { scroll: false });
  }, [selectedCategory, searchTerm, groupBy, router]);

  // Fetch timeline from PlatformOILService API + Local Store
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // 1. Fetch from OIL timeline API (returns Prisma + Cache events)
      const res = await fetch("/api/v1/oil/timeline?category=all");
      const data = await res.json();
      
      let aggregated: any[] = [];
      if (data.success && data.events) {
        aggregated = [...data.events];
      }

      // 2. Fallback to aggregate from local store activities if API returns empty
      if (aggregated.length === 0) {
        activityFeed.forEach(act => {
          aggregated.push({
            id: act.id,
            timestamp: new Date(act.timestamp).getTime(),
            category: act.category,
            title: act.title,
            message: act.description,
            severity: act.status === "error" ? "critical" : act.status === "warning" ? "warning" : "info",
            meta: { actor: act.actor }
          });
        });
      }

      setTimelineEvents(aggregated.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error("[Timeline] Failed to load timeline telemetry", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const categories = [
    { id: "all", name: "All Events" },
    { id: "mission", name: "Missions" },
    { id: "execution", name: "Executions" },
    { id: "knowledge", name: "Knowledge" },
    { id: "approvals", name: "Approvals" },
    { id: "security", name: "Security" },
    { id: "recovery", name: "Recovery" },
    { id: "backup", name: "Backups" }
  ];

  // Filters timeline events
  const filteredEvents = timelineEvents.filter((evt) => {
    const matchesCat = selectedCategory === "all" || evt.category === selectedCategory;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workspace":
        return <Layers className="h-4 w-4 text-primary" />;
      case "mission":
        return <Rocket className="h-4 w-4 text-indigo-400" />;
      case "execution":
      case "workflow":
        return <Zap className="h-4 w-4 text-amber-400" />;
      case "knowledge":
        return <BookOpen className="h-4 w-4 text-emerald-400" />;
      case "approvals":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "security":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      case "recovery":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "backup":
        return <Database className="h-4 w-4 text-sky-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-rose-500/30 bg-rose-500/5 text-rose-200";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5 text-amber-200";
      case "success":
        return "border-emerald-500/30 bg-emerald-500/5 text-emerald-200";
      default:
        return "border-border/40 bg-card/60 text-zinc-300";
    }
  };

  // Group events helper
  const renderGroupedTimeline = () => {
    if (groupBy === "none" || filteredEvents.length === 0) {
      return (
        <div className="relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/20 space-y-5">
          {filteredEvents.map((evt) => renderTimelineNode(evt))}
        </div>
      );
    }

    let groups: Record<string, any[]> = {};

    if (groupBy === "category") {
      filteredEvents.forEach(evt => {
        const cat = evt.category || "general";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(evt);
      });
    } else if (groupBy === "day") {
      filteredEvents.forEach(evt => {
        const day = new Date(evt.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[day]) groups[day] = [];
        groups[day].push(evt);
      });
    } else if (groupBy === "mission") {
      filteredEvents.forEach(evt => {
        // Group by mission correlation if metadata contains it, otherwise put in "General System"
        let groupKey = "General System Logs";
        if (evt.meta?.missionName) {
          groupKey = `Mission: ${evt.meta.missionName}`;
        } else if (evt.title.includes("Mission") || evt.message.includes("Mission")) {
          // Attempt string parsing match
          const match = evt.message.match(/mission\s+"([^"]+)"/i) || evt.message.match(/mission\s+([^\s]+)/i);
          if (match && match[1]) {
            groupKey = `Mission: ${match[1]}`;
          } else {
            groupKey = "Autonomous Missions";
          }
        }
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(evt);
      });
    }

    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([groupTitle, events]) => (
          <div key={groupTitle} className="space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest border-b border-border/20 pb-1.5 flex items-center justify-between">
              <span>{groupTitle}</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">{events.length} events</span>
            </h3>
            <div className="relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/20 space-y-4 pl-1">
              {events.map((evt) => renderTimelineNode(evt))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTimelineNode = (evt: any) => {
    // Check if event can support Mission Replay
    let replayMissionId = "";
    if (evt.category === "mission" || evt.category === "workflow") {
      // Find missionId reference
      replayMissionId = evt.meta?.missionId || evt.meta?.payload?.missionId || "";
      if (!replayMissionId && evt.id.startsWith("ms-")) {
        replayMissionId = evt.id;
      }
    }

    return (
      <div key={evt.id} className="relative pl-12 space-y-1 group">
        {/* Node Icon */}
        <span className="absolute left-3 top-1.5 -translate-x-1/2 p-1.5 rounded-full bg-card border-2 border-border/60 shadow-sm z-10">
          {getCategoryIcon(evt.category)}
        </span>

        {/* Node Box */}
        <div className={`p-4 rounded-xl border transition-all hover:border-border/80 ${getSeverityStyle(evt.severity)}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center space-x-2.5">
              <h4 className="font-bold text-foreground text-sm">{evt.title}</h4>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {evt.category}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {new Date(evt.timestamp).toLocaleString()}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-mono whitespace-pre-wrap select-text">{evt.message}</p>
          
          {/* Metadata information details */}
          {evt.meta && Object.keys(evt.meta).length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-zinc-900 text-[10px] font-mono text-zinc-500 space-y-0.5 select-text">
              {Object.entries(evt.meta).map(([k, v]: any) => (
                <div key={k} className="flex gap-1.5">
                  <span className="text-zinc-600 capitalize">{k}:</span>
                  <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {replayMissionId && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/mission-replay?missionId=${replayMissionId}`)}
                className="text-[10px] h-7 px-3.5 flex items-center space-x-1 border-indigo-500/20 text-indigo-400 font-mono hover:bg-indigo-500/10"
              >
                <PlayCircle className="h-3 w-3" />
                <span>Replay Mission</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-2">
            <Clock className="h-6 w-6 text-amber-400" />
            <span>Chronological Operational Timeline</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Audit trace stream documenting mission planners, executions, human-approvals, tool invocations, and self-healing.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTimeline}
          disabled={loading}
          className="text-xs h-9 flex items-center space-x-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh Timeline</span>
        </Button>
      </div>

      {/* FILTER & GROUPING CONTROLS */}
      <div className="grid gap-4 md:grid-cols-4 items-center bg-card p-4 rounded-xl border border-border/40">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search timeline messages, events..."
            className="w-full rounded-lg border border-border/40 bg-background pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Group By */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground shrink-0 font-mono">Group By:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full bg-background border border-border/50 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
          >
            <option value="none">Flat Timeline</option>
            <option value="category">Category</option>
            <option value="day">Day / Date</option>
            <option value="mission">Mission Scope</option>
          </select>
        </div>

        {/* Categories Scroller */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground shrink-0 font-mono">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-background border border-border/50 text-xs rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-xs">Loading unified operational records...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs">No operational events found matching search criteria.</p>
          </div>
        ) : (
          renderGroupedTimeline()
        )}
      </div>
    </div>
  );
}
