import React from 'react';
import { Activity, ShieldCheck, Award, Network, Server, AlertTriangle, CheckCircle, Cpu } from 'lucide-react';
import { QualificationWidget } from '@/components/widgets/QualificationWidget';
import { CertificationWidget } from '@/components/widgets/CertificationWidget';
import { PialRecommendationsWidget } from '@/components/widgets/PialRecommendationsWidget';

export default function PlatformDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1">Executive operations center and platform health.</p>
        </div>
        <div className="flex space-x-2">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" /> System Healthy
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground uppercase">Platform Health Index</div>
          <div className="text-4xl font-bold mt-2">98.5%</div>
        </div>
        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground uppercase">Active Participants</div>
          <div className="text-4xl font-bold mt-2">124</div>
        </div>
        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground uppercase">Running Workflows</div>
          <div className="text-4xl font-bold mt-2">18</div>
        </div>
        <div className="p-5 bg-card border border-border/60 rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground uppercase">Capability Utilization</div>
          <div className="text-4xl font-bold mt-2">67%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold flex items-center mb-4"><Network className="w-5 h-5 mr-2"/> Architecture Fitness</h3>
            <div className="h-48 flex items-center justify-center border border-dashed border-border/40 rounded bg-background/50 text-muted-foreground">
              [Live Digital Twin Heatmap Visualization]
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <QualificationWidget />
            <CertificationWidget />
          </div>
        </div>

        <div className="space-y-4">
          <PialRecommendationsWidget />
        </div>
      </div>
    </div>
  );
}
