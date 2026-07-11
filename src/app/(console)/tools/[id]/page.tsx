"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Wrench, Clock, ShieldCheck, Play, HelpCircle, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Editor from "@monaco-editor/react";

export default function ToolViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tool, setTool] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTool = async () => {
      setLoading(true);
      try {
        const decoded = decodeURIComponent(id);
        const res = await fetch(`/api/v1/tools/${encodeURIComponent(decoded)}`);
        if (!res.ok) throw new Error("Tool not found");
        const data = await res.json();
        setTool(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTool();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading tool schema details...</div>;
  }

  if (!tool) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Tool "{decodeURIComponent(id)}" was not found.</p>
        <Button onClick={() => router.push("/tools")} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
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
          onClick={() => router.push("/tools")}
          className="p-2 rounded-lg border border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tools</span>
          <h2 className="text-xl font-bold tracking-tight">{tool.name}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schema Viewer (Monaco) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-mono">Input Parameter Schema</CardTitle>
              </div>
            </CardHeader>
            <div className="bg-black/60">
              <Editor
                height="300px"
                language="json"
                value={JSON.stringify(tool.inputSchema || {}, null, 2)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: "Geist Mono, monospace",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-cyan-500" />
                <CardTitle className="text-sm font-mono">Output Result Schema</CardTitle>
              </div>
            </CardHeader>
            <div className="bg-black/60">
              <Editor
                height="200px"
                language="json"
                value={JSON.stringify(tool.outputSchema || {}, null, 2)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: "Geist Mono, monospace",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Description</span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.description}</p>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Category</span>
                <Badge variant="secondary" className="capitalize text-[10px] mt-1.5">{tool.category}</Badge>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Provider</span>
                <Badge variant="outline" className="capitalize text-[10px] mt-1.5 font-mono">{tool.provider}</Badge>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Execution Statistics</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Total Runs:</span>
                    <span className="font-mono font-bold">{tool.stats?.executionCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Success Rate:</span>
                    <Badge variant="success" className="font-mono text-[9px]">{tool.stats?.successRate || 100}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Average Latency:</span>
                    <span className="font-mono text-muted-foreground">{tool.stats?.avgDurationMs || 0}ms</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
