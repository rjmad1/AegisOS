import React from 'react';
import { ShieldCheck, Cloud, Server } from 'lucide-react';
import { QualificationWidget } from '@/components/widgets/QualificationWidget';

export default function QualificationCenter() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Qualification</h1>
          <p className="text-muted-foreground mt-1">Platform Deployment Readiness (PQF) and environment validation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <QualificationWidget />
        </div>

        <div className="p-6 bg-card border border-border/60 rounded-xl shadow-sm">
           <h3 className="text-lg font-semibold mb-4">Qualification Gaps</h3>
           <ul className="text-sm space-y-3">
             <li className="flex items-start">
               <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 mr-2 shrink-0"></div>
               <span className="text-muted-foreground">Cloud Storage connector missing mandatory IAM roles in configuration.</span>
             </li>
             <li className="flex items-start">
               <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 mr-2 shrink-0"></div>
               <span className="text-muted-foreground">Database replica latency exceeds target budget threshold.</span>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
}
