"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Eye } from "lucide-react";
import { ErrorBoundary } from "../ui/ErrorBoundary";

const mockTraces = [
  { id: "trc-982", name: "Workflow Engine", start: 0, duration: 1200, status: "ok" },
  { id: "trc-104", name: "Inference Gateway", start: 200, duration: 4500, status: "warning" },
  { id: "trc-105", name: "Participant-12A", start: 300, duration: 800, status: "ok" },
  { id: "trc-106", name: "Tool Capability (Search)", start: 1100, duration: 250, status: "ok" },
];

export function ExecutionTimelineWidget() {
  const maxDuration = Math.max(...mockTraces.map((t) => t.start + t.duration));

  return (
    <ErrorBoundary>
      <Card className="p-5 shadow-sm space-y-4 w-full overflow-x-auto">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Eye className="w-5 h-5 mr-2" /> Execution Timelines (Gantt)
        </h3>
        
        <div className="relative min-w-[600px] border-l border-border/40 py-2">
          {mockTraces.map((trace, i) => {
            const leftPct = (trace.start / maxDuration) * 100;
            const widthPct = (trace.duration / maxDuration) * 100;
            
            const colorClass = trace.status === "warning" ? "bg-yellow-500" : "bg-green-500";
            
            return (
              <div key={trace.id} className="mb-4 relative h-8">
                <div className="absolute left-2 text-xs font-mono text-muted-foreground w-32 truncate" style={{ top: "4px" }}>
                  {trace.name}
                </div>
                <div 
                  className="absolute h-5 rounded-md shadow-sm transition-all duration-300 group hover:opacity-80"
                  style={{ left: `calc(140px + ${leftPct}%)`, width: `${widthPct}%`, top: "6px" }}
                >
                  <div className={`w-full h-full rounded-md ${colorClass} opacity-80`} />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded hidden group-hover:block z-10 whitespace-nowrap border border-border shadow-lg">
                    {trace.id}: {trace.duration}ms
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </ErrorBoundary>
  );
}
