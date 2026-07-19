"use client";

import React, { useState } from "react";
import { Users, Activity, Settings } from "lucide-react";
import { BatchActionBar } from "@/components/widgets/BatchActionBar";

const MOCK_PARTICIPANTS = [
  { id: "UAF-Agent-101", type: "Autonomous Agent", status: "IDLE", capabilities: 3 },
  { id: "UAF-Agent-202", type: "Autonomous Agent", status: "RUNNING", capabilities: 5 },
  { id: "UAF-Agent-303", type: "Human Operator", status: "IDLE", capabilities: 2 },
  { id: "UAF-Tool-404", type: "Tool Executor", status: "IDLE", capabilities: 1 },
  { id: "UAF-Agent-505", type: "Autonomous Agent", status: "SUSPENDED", capabilities: 4 },
];

export default function ParticipantsHub() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === MOCK_PARTICIPANTS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(MOCK_PARTICIPANTS.map((p) => p.id)));
    }
  };

  const handleBatchAction = (action: string) => {
    // In production this would dispatch to the platform control plane
    console.log(`[ParticipantsHub] Batch ${action} on:`, Array.from(selected));
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground mt-1">Universal Agent Framework and actor configuration.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm">
          + Provision Participant
        </button>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-0 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent/40 text-muted-foreground border-b border-border/40">
            <tr>
              <th className="px-6 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.size === MOCK_PARTICIPANTS.length}
                  onChange={toggleAll}
                  className="rounded border-border"
                  aria-label="Select all participants"
                />
              </th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Participant ID</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Type</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Status</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Capabilities</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {MOCK_PARTICIPANTS.map((p) => {
              const statusColor =
                p.status === "RUNNING" ? "bg-blue-500/10 text-blue-500" :
                p.status === "SUSPENDED" ? "bg-yellow-500/10 text-yellow-500" :
                "bg-green-500/10 text-green-500";
              const dotColor =
                p.status === "RUNNING" ? "bg-blue-500" :
                p.status === "SUSPENDED" ? "bg-yellow-500" :
                "bg-green-500";

              return (
                <tr key={p.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="rounded border-border"
                      aria-label={`Select ${p.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium flex items-center">
                    <div className={`w-2 h-2 rounded-full ${dotColor} mr-3`}></div>
                    {p.id}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{p.type}</td>
                  <td className="px-6 py-4">
                    <span className={`${statusColor} px-2 py-1 rounded-full text-xs font-bold`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{p.capabilities} assigned</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground px-2" aria-label={`View telemetry for ${p.id}`}><Activity className="w-4 h-4"/></button>
                    <button className="text-muted-foreground hover:text-foreground px-2" aria-label={`Configure ${p.id}`}><Settings className="w-4 h-4"/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Batch Operations floating action bar */}
      <BatchActionBar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        onAction={handleBatchAction}
      />
    </div>
  );
}
