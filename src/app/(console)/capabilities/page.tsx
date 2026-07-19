import React from 'react';
import { Cpu, Link, Code } from 'lucide-react';

export default function CapabilitiesHub() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Capabilities</h1>
          <p className="text-muted-foreground mt-1">Universal Execution Profiles, tools, and extensions.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm">
          Register Capability
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="p-5 bg-card border border-border/60 rounded-xl shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg mr-3">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">File Operations API</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Core filesystem read/write capability mapped via UEP.</p>
            <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
              <span>v1.2.4</span>
              <span className="flex items-center text-green-500"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div> Verified</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
