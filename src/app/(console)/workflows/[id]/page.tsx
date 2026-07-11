"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, GitBranch, Play, CheckCircle2, XCircle, Clock, Calendar, Database, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function WorkflowViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workflow, setWorkflow] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchWorkflow = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/workflows/${id}`);
        if (!res.ok) throw new Error("Workflow not found");
        const data = await res.json();
        setWorkflow(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflow();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading workflow details...</div>;
  }

  if (!workflow) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Workflow "{id}" was not found.</p>
        <Button onClick={() => router.push("/workflows")} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to Explorer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={() => router.push("/workflows")}
          className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Workflows</span>
          <h2 className="text-xl font-bold tracking-tight">{workflow.name}</h2>
        </div>
      </div>

      <Alert variant="info" title="Read-Only Mode Enabled" className="glass-panel text-left">
        You are in observing mode. Manual execution, payload triggering, and pipeline state changes are locked.
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Core details & Execution history */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>All recorded executions of this workflow.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-accent/10 text-xs font-bold text-muted-foreground uppercase font-mono">
                      <th className="p-4">Execution ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Execution Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflow.executionHistory?.map((run: any) => (
                      <tr key={run.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold">
                          <Link href={`/executions/${run.id}`} className="hover:text-primary transition-colors">
                            {run.id.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="p-4">
                          <Badge variant={run.status === "succeeded" ? "success" : run.status === "failed" ? "destructive" : "secondary"} className="text-[9px] font-mono capitalize">
                            {run.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : "0.00s"}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-mono">
                          {new Date(run.date).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/executions/${run.id}`}>
                            <Button variant="outline" size="sm">View Timeline</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {(!workflow.executionHistory || workflow.executionHistory.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No recorded execution history for this workflow.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar metadata & dependencies */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Specs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Workspace Directory</span>
                <span className="text-xs font-mono break-all text-muted-foreground block mt-1">
                  {workflow.metadata.folder || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pipeline Version</span>
                <span className="text-xs font-semibold text-muted-foreground block mt-1 font-mono">
                  v{workflow.version}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Deployment Status</span>
                <Badge variant="success" className="capitalize text-[10px] mt-1.5">
                  {workflow.status}
                </Badge>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Required Subagents</span>
                <div className="flex flex-wrap gap-1">
                  {workflow.dependencies?.map((dep: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-[10px] capitalize">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relationships & Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              {workflow.relationships?.map((rel: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg border border-border/30 bg-accent/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono capitalize">{rel.targetId}</span>
                    <Badge variant="outline" className="text-[9px] font-mono uppercase">{rel.type}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{rel.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
