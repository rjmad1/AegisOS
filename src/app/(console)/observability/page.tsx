import React from 'react';
import { Eye, Activity, Terminal } from 'lucide-react';
import { TelemetryStream } from '@/components/widgets/TelemetryStream';
import { ExecutionTimelineWidget } from '@/components/widgets/ExecutionTimelineWidget';

export default function ObservabilityCenter() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observability</h1>
          <p className="text-muted-foreground mt-1">Telemetry, Traces, and Live Resource Usage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TelemetryStream />
          <ExecutionTimelineWidget />
        </div>

        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/40 bg-accent/20">
            <h3 className="text-sm font-semibold flex items-center"><Terminal className="w-4 h-4 mr-2"/> Structured Events</h3>
          </div>
          <div className="flex-1 p-4 bg-black text-green-500 font-mono text-[10px] overflow-y-auto space-y-2 h-96">
            <div>[INFO] Agent factory instantiated Participant-12A</div>
            <div>[WARN] Capability 'search' latency spike (200ms)</div>
            <div>[INFO] Model routing switched to fallback provider</div>
            <div>[INFO] Checkpoint saved for Workflow-DAG-99</div>
          </div>
        </div>
      </div>
    </div>
  );
}
