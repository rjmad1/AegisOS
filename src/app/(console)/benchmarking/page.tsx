import React from 'react';
import { Activity, Play, Settings } from 'lucide-react';

export default function BenchmarkingCenter() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benchmarking</h1>
          <p className="text-muted-foreground mt-1">Subsystem Benchmark Packs (SBP) and performance contracts.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm flex items-center">
          <Play className="w-4 h-4 mr-2" /> Run Suite
        </button>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-0 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent/40 text-muted-foreground border-b border-border/40">
            <tr>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Benchmark Pack</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Engine</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Status</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider">Last Score</th>
              <th className="px-6 py-3 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            <tr className="hover:bg-accent/20 transition-colors">
              <td className="px-6 py-4 font-medium">Memory Subsystem T1</td>
              <td className="px-6 py-4 text-muted-foreground">BOEE-Micro</td>
              <td className="px-6 py-4"><span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-bold">PASS</span></td>
              <td className="px-6 py-4 text-muted-foreground">99.2% (Budget: 95%)</td>
              <td className="px-6 py-4 text-right">
                <button className="text-muted-foreground hover:text-foreground px-2"><Activity className="w-4 h-4"/></button>
              </td>
            </tr>
            <tr className="hover:bg-accent/20 transition-colors">
              <td className="px-6 py-4 font-medium">Agent Capability Graph</td>
              <td className="px-6 py-4 text-muted-foreground">BOEE-Load</td>
              <td className="px-6 py-4"><span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded-full text-xs font-bold">WARN</span></td>
              <td className="px-6 py-4 text-muted-foreground">88.4% (Budget: 90%)</td>
              <td className="px-6 py-4 text-right">
                <button className="text-muted-foreground hover:text-foreground px-2"><Activity className="w-4 h-4"/></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
