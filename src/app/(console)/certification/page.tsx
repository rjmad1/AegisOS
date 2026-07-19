import React from 'react';
import { Award, FileText } from 'lucide-react';
import { CertificationWidget } from '@/components/widgets/CertificationWidget';

export default function CertificationCenter() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certification Center</h1>
          <p className="text-muted-foreground mt-1">End-to-End Representative Workload Certification (ERWC).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CertificationWidget />
        </div>
        <div className="p-6 bg-card border border-border/60 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold flex items-center mb-4"><FileText className="w-5 h-5 mr-2"/> Evidence Explorer</h3>
          <div className="h-32 flex items-center justify-center border border-dashed border-border/40 rounded bg-background/50 text-muted-foreground text-sm">
            Select a workload to view execution timeline and verification evidence.
          </div>
        </div>
      </div>
    </div>
  );
}
