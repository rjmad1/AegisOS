"use client";

import React, { useEffect, useState } from "react";
import { DEP, ExecutionInstance } from "@/platform/console/DurableExecutionPlatform";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader2, Activity, Play, XCircle, CheckCircle2, PauseCircle } from "lucide-react";

export function ExecutionExplorer() {
  const [executions, setExecutions] = useState<ExecutionInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExecutions = async () => {
    try {
      const data = await DEP.listExecutions();
      setExecutions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await DEP.approve(id, "TKN_" + Math.random().toString(36).substring(7));
      fetchExecutions();
    } catch (e) {
      console.error("Approval failed", e);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await DEP.cancel(id);
      fetchExecutions();
    } catch (e) {
      console.error("Cancel failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center border border-border/40 rounded-xl bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border/60 shadow-sm text-left font-sans">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Activity className="h-4 w-4 text-primary" />
            Durable Execution Explorer
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px]">
            {executions.length} Instances
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {executions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No active executions found in the Durable Execution Platform.
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {executions.map((exec) => (
              <div key={exec.id} className="p-4 flex items-start justify-between gap-4 hover:bg-accent/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {exec.commandId}
                    </span>
                    <StatusBadge state={exec.state} />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono space-x-2">
                    <span>ID: {exec.id}</span>
                    <span>•</span>
                    <span>TXN: {exec.transactionId}</span>
                  </div>
                  
                  {/* Checkpoints timeline */}
                  <div className="pt-2 flex items-center gap-1 overflow-x-auto custom-scrollbar">
                    {exec.checkpoints.map((cp, idx) => (
                      <React.Fragment key={cp.id}>
                        {idx > 0 && <div className="h-[1px] w-4 bg-border" />}
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" title={cp.reason} />
                      </React.Fragment>
                    ))}
                    {exec.state === 'Executing' && (
                      <>
                        <div className="h-[1px] w-4 bg-border" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-ping" />
                      </>
                    )}
                  </div>
                </div>

                {exec.state === 'WaitingForApproval' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCancel(exec.id)}
                      className="h-7 text-[10px] font-mono text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(exec.id)}
                      className="h-7 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ state }: { state: string }) {
  switch (state) {
    case 'Executing':
      return <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono"><Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" /> {state}</Badge>;
    case 'WaitingForApproval':
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-mono"><PauseCircle className="h-2.5 w-2.5 mr-1" /> {state}</Badge>;
    case 'Completed':
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-mono"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> {state}</Badge>;
    case 'Failed':
    case 'Cancelled':
      return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-mono"><XCircle className="h-2.5 w-2.5 mr-1" /> {state}</Badge>;
    default:
      return <Badge variant="outline" className="text-[9px] font-mono">{state}</Badge>;
  }
}
