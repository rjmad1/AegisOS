"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, ChevronRight, RefreshCw, Box, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/workflows");
      if (!res.ok) throw new Error("Failed to load workflows");
      const data = await res.json();
      setWorkflows(data.workflows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflow Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage, discover, and inspect multi-agent workspace pipelines.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchWorkflows}
            disabled={loading}
          >
            Refresh Workflows
          </Button>
        </div>
      </div>

      {/* Grid of Workflows */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && workflows.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading workflows registry...</div>
        ) : workflows.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No workflows registered.</div>
        ) : (
          workflows.map((wf) => (
            <Card key={wf.id} className="hover:border-primary/40 transition-colors flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <Badge variant="success" className="capitalize text-[9px] font-mono">{wf.status}</Badge>
                </div>
                <CardTitle className="text-base font-bold mt-3 text-left">{wf.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1 text-left">{wf.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-0 text-left">
                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-1">
                  {wf.capabilities?.map((cap: string, cIdx: number) => (
                    <Badge key={cIdx} variant="secondary" className="text-[9px] px-1.5 py-0 border border-border/40 font-mono">
                      {cap}
                    </Badge>
                  ))}
                </div>

                <div className="border-t border-border/20 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">v{wf.version}</span>
                  <span className="font-mono">{wf.executionHistory?.length || 0} runs recorded</span>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border/20 bg-accent/5 rounded-b-xl flex items-center justify-end">
                <Link href={`/workflows/${wf.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
                    Details & Audit
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
