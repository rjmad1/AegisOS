import React from 'react';
import { Network, Database, Cpu, Search } from 'lucide-react';
import { TopologyGraph } from './components/TopologyGraph';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ArchitectureExplorer() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Architecture Explorer</h1>
          <p className="text-muted-foreground mt-1">Live Digital Twin and Dependency Graph.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input type="text" placeholder="Filter nodes..." className="pl-9 pr-4 py-2 bg-card border border-border/60 rounded-lg text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      <div className="flex-1 bg-card border border-border/60 rounded-xl p-0 relative overflow-hidden shadow-sm min-h-[500px]">
        <ErrorBoundary>
          <TopologyGraph />
        </ErrorBoundary>
        
        {/* Floating Controls */}
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md border border-border/40 p-2 rounded-lg flex space-x-2 shadow-lg z-10">
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground"><Cpu className="w-4 h-4"/></button>
          <button className="p-2 hover:bg-accent rounded text-muted-foreground hover:text-foreground"><Database className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
}
