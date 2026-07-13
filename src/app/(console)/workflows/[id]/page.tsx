"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, GitBranch, Play, CheckCircle2, XCircle, Clock, Database, RefreshCw,
  Folder, User, ShieldAlert, Cpu, Layers, MessageSquare, Plus, FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

export default function WorkflowViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workflow, setWorkflow] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("nodes");

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

  React.useEffect(() => {
    fetchWorkflow();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading workflow details...</div>;
  }

  if (!workflow) {
    return (
      <div className="text-center py-12 space-y-4 text-left">
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
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Workflows Registry</span>
          <h2 className="text-xl font-bold tracking-tight">{workflow.name}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details and Tabbed Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="text-left">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold">Pipeline Architecture</CardTitle>
                <Badge variant="outline">Version {workflow.version}</Badge>
              </div>
              <CardDescription>{workflow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="nodes" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="nodes">Graph Steps</TabsTrigger>
                  <TabsTrigger value="runs">Execution Runs</TabsTrigger>
                  <TabsTrigger value="relations">Scope & Relationships</TabsTrigger>
                </TabsList>

                {/* Nodes List */}
                <TabsContent value="nodes" className="mt-4 space-y-3">
                  {workflow.nodes?.map((node: any, index: number) => (
                    <div key={node.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-accent/5 text-left">
                      <div className="p-2 rounded bg-background border text-xs font-mono font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold block">{node.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{node.type} | ID: {node.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {node.next && <Badge variant="secondary" className="text-[9px] font-mono">Next: {node.next}</Badge>}
                        {node.nextTrue && <Badge variant="success" className="text-[9px] font-mono">True: {node.nextTrue}</Badge>}
                        {node.nextFalse && <Badge variant="destructive" className="text-[9px] font-mono">False: {node.nextFalse}</Badge>}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Execution History */}
                <TabsContent value="runs" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 bg-accent/10 text-xs font-bold text-muted-foreground uppercase font-mono">
                          <th className="p-3">Run ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Trigger Date</th>
                          <th className="p-3 text-right">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workflow.executionHistory?.map((run: any) => (
                          <tr key={run.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                            <td className="p-3 font-mono text-xs font-bold">
                              <Link href={`/executions/${run.id}`} className="hover:text-primary transition-colors">
                                {run.id.substring(0, 8)}...
                              </Link>
                            </td>
                            <td className="p-3">
                              <Badge variant={run.status === "succeeded" ? "success" : run.status === "failed" ? "destructive" : "secondary"} className="text-[9px] font-mono capitalize">
                                {run.status}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : "0.00s"}
                            </td>
                            <td className="p-3 text-xs text-muted-foreground font-mono">
                              {new Date(run.date).toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <Link href={`/executions/${run.id}`}>
                                <Button variant="outline" size="sm">Timeline</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {(!workflow.executionHistory || workflow.executionHistory.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No execution runs recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* Relationships Panel */}
                <TabsContent value="relations" className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 text-left">
                    <Card className="bg-accent/5">
                      <CardHeader className="py-2.5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Associated Artifacts</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {workflow.relationships?.filter((r: any) => r.type === "artifact").map((rel: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono">{rel.targetId}</span>
                            <span className="text-muted-foreground">({rel.description})</span>
                          </div>
                        )) || <p className="text-muted-foreground">None linked</p>}
                      </CardContent>
                    </Card>

                    <Card className="bg-accent/5">
                      <CardHeader className="py-2.5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Providers</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {workflow.relationships?.filter((r: any) => r.type === "provider").map((rel: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono">{rel.targetId}</span>
                            <span className="text-muted-foreground">({rel.description})</span>
                          </div>
                        )) || <p className="text-muted-foreground">None linked</p>}
                      </CardContent>
                    </Card>

                    <Card className="bg-accent/5">
                      <CardHeader className="py-2.5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Models</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {workflow.relationships?.filter((r: any) => r.type === "model").map((rel: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono">{rel.targetId}</span>
                            <span className="text-muted-foreground">({rel.description})</span>
                          </div>
                        )) || <p className="text-muted-foreground">None linked</p>}
                      </CardContent>
                    </Card>

                    <Card className="bg-accent/5">
                      <CardHeader className="py-2.5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversations & Knowledge</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1.5 pt-0">
                        {workflow.relationships?.filter((r: any) => r.type === "conversation" || r.type === "knowledge").map((rel: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono">{rel.targetId}</span>
                            <span className="text-muted-foreground">({rel.description})</span>
                          </div>
                        )) || <p className="text-muted-foreground">None linked</p>}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-left">
              <CardTitle className="text-sm font-bold">Metadata Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Target Work Folder</span>
                <span className="text-xs font-mono break-all text-muted-foreground block mt-1">
                  {workflow.metadata?.folder || "Default Environment"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Status State</span>
                <Badge variant="success" className="capitalize text-[10px] mt-1.5">
                  {workflow.status}
                </Badge>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Agent Capabilities</span>
                <div className="flex flex-wrap gap-1">
                  {workflow.capabilities?.map((cap: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-[9px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Dependencies</span>
                <div className="flex flex-wrap gap-1">
                  {workflow.dependencies?.map((dep: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="font-mono text-[9px] capitalize">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
