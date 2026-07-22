'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader2, ShieldCheck, CheckCircle2, XCircle, FileText, Activity } from 'lucide-react';

export default function ReleaseReadinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching the latest QualificationReport containing PlatformAssessment
    const timer = setTimeout(() => {
      setReport({
        oeid: `OE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        assessment: {
          releaseReadiness: {
            confidenceScore: 99.42,
            certificationStatus: 'CERTIFIED',
          }
        },
        domains: [
          { name: 'Architecture', status: 'PASS' },
          { name: 'Deployment', status: 'PASS' },
          { name: 'Qualification', status: 'PASS' },
          { name: 'Marketplace', status: 'PASS' },
          { name: 'Telemetry', status: 'PASS' },
          { name: 'Security', status: 'PASS' },
          { name: 'Performance', status: 'PASS' },
          { name: 'Reliability', status: 'PASS' },
          { name: 'SDK', status: 'PASS' },
          { name: 'Documentation', status: 'PASS' }
        ]
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const confidence = report?.assessment?.releaseReadiness?.confidenceScore || 0;
  const isReady = confidence >= 95;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Release Readiness Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Continuous certification and operational evidence for production deployment.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-4 py-2 font-mono">
          {report?.oeid}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Release Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-primary">
              {confidence.toFixed(2)}%
            </div>
            <p className="mt-4 text-sm font-medium">
              Recommendation:
            </p>
            <p className={`text-lg font-bold mt-1 ${isReady ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isReady ? 'Proceed to Production Pilot' : 'Hold for Remediation'}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Domain Validation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {report?.domains.map((domain: any) => (
                <div key={domain.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="font-medium">{domain.name}</span>
                  {domain.status === 'PASS' ? (
                    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> PASS
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> {domain.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          View Evidence Graph
        </Button>
        <Button disabled={!isReady}>
          Approve Release Candidate
        </Button>
      </div>
    </div>
  );
}
