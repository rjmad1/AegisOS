"use client";

import React from "react";
import { Shield, Book, Sliders, AlertCircle, Lock, Terminal } from "lucide-react";

const POLICY_VIOLATIONS = [
  { id: "pv-1", timestamp: "2026-07-19T14:32:01Z", rule: "No Duplicate Runtimes", action: "Agent spawn blocked", severity: "critical" },
  { id: "pv-2", timestamp: "2026-07-19T13:10:44Z", rule: "Observability First", action: "Capability registered without telemetry hook", severity: "warning" },
  { id: "pv-3", timestamp: "2026-07-19T11:55:12Z", rule: "Architectural Budget: Latency", action: "Inference route exceeded 500ms p99", severity: "warning" },
];

export default function GovernanceCenter() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Governance</h1>
          <p className="text-muted-foreground mt-1">Constitutional Engine, Architectural Budgets, and Contracts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Constitutional Engine */}
        <div className="p-6 bg-card border border-border/60 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center mb-4"><Book className="w-5 h-5 mr-2 text-primary"/> Constitutional Engine</h3>
          <p className="text-sm text-muted-foreground mb-4">Enforces platform invariants and architectural principles at runtime.</p>
          <div className="space-y-3">
            <div className="p-3 border border-border/40 rounded-lg flex justify-between items-center text-sm">
              <span>No Duplicate Runtimes</span>
              <span className="text-green-500 font-bold flex items-center"><Shield className="w-3 h-3 mr-1"/> Compliant</span>
            </div>
            <div className="p-3 border border-border/40 rounded-lg flex justify-between items-center text-sm">
              <span>Observability First</span>
              <span className="text-green-500 font-bold flex items-center"><Shield className="w-3 h-3 mr-1"/> Compliant</span>
            </div>
            <div className="p-3 border border-border/40 rounded-lg flex justify-between items-center text-sm">
              <span>Security Before Exposure</span>
              <span className="text-green-500 font-bold flex items-center"><Shield className="w-3 h-3 mr-1"/> Compliant</span>
            </div>
          </div>
        </div>

        {/* Architectural Budgets */}
        <div className="p-6 bg-card border border-border/60 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center mb-4"><Sliders className="w-5 h-5 mr-2 text-primary"/> Architectural Budgets</h3>
          <p className="text-sm text-muted-foreground mb-4">Hard limits on resource consumption and operational boundaries.</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-muted-foreground uppercase">
                <span>Memory Overhead</span>
                <span>80% of Target</span>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{width: '80%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-muted-foreground uppercase">
                <span>Inference Latency Budget</span>
                <span className="text-yellow-500">95% of Target</span>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '95%'}}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-muted-foreground uppercase">
                <span>Token Usage Budget</span>
                <span>62% of Target</span>
              </div>
              <div className="w-full bg-accent rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{width: '62%'}}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Violation Event Log */}
      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-destructive"/> Policy Violation Event Log</h3>
          <span className="text-xs text-muted-foreground font-mono">{POLICY_VIOLATIONS.length} events</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-accent/40 text-muted-foreground border-b border-border/40">
            <tr>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Timestamp</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Rule Violated</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Action</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {POLICY_VIOLATIONS.map((v) => (
              <tr key={v.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{new Date(v.timestamp).toLocaleString()}</td>
                <td className="px-6 py-3 font-medium">{v.rule}</td>
                <td className="px-6 py-3 text-muted-foreground">{v.action}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    v.severity === "critical" 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {v.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Security Boundary Map */}
      <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold flex items-center mb-4"><Lock className="w-5 h-5 mr-2 text-primary"/> Security Boundary Map</h3>
        <p className="text-sm text-muted-foreground mb-4">Zero-Trust enforcement zones and PPS policy perimeters.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-green-500/30 rounded-lg bg-green-500/5">
            <div className="text-sm font-bold text-green-500 mb-1 flex items-center"><Shield className="w-4 h-4 mr-1.5"/> Internal Zone</div>
            <div className="text-xs text-muted-foreground">Platform Kernel, Event Bus, PRM</div>
            <div className="text-xs text-green-500 font-semibold mt-2">Fully Trusted</div>
          </div>
          <div className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
            <div className="text-sm font-bold text-yellow-500 mb-1 flex items-center"><Shield className="w-4 h-4 mr-1.5"/> Participant Zone</div>
            <div className="text-xs text-muted-foreground">Agents, Workflows, Capabilities</div>
            <div className="text-xs text-yellow-500 font-semibold mt-2">Sandboxed + Audited</div>
          </div>
          <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
            <div className="text-sm font-bold text-red-500 mb-1 flex items-center"><Shield className="w-4 h-4 mr-1.5"/> External Zone</div>
            <div className="text-xs text-muted-foreground">MCP Servers, External APIs, User Input</div>
            <div className="text-xs text-red-500 font-semibold mt-2">Zero-Trust</div>
          </div>
        </div>
      </div>
    </div>
  );
}
