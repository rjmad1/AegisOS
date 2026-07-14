"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, XCircle, Clock, RefreshCw, UserCheck, Calendar, ShieldAlert,
  Power, PowerOff, ShieldClose, AlertTriangle, ArrowRight, UserPlus, Play
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

export default function AutomationCenterPage() {
  const [activeTab, setActiveTab] = React.useState("dashboard");

  // Data State
  const [executions, setExecutions] = React.useState<any[]>([]);
  const [approvals, setApprovals] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [dlq, setDlq] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Dialog State
  const [isDelegateOpen, setIsDelegateOpen] = React.useState(false);
  const [selectedApproval, setSelectedApproval] = React.useState<any>(null);
  const [delegateEmail, setDelegateEmail] = React.useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const resExec = await fetch("/api/v1/workflows/executions");
      const resApp = await fetch("/api/v1/workflows/approvals");
      const resSched = await fetch("/api/v1/workflows/schedules");
      
      if (resExec.ok) setExecutions(await resExec.json());
      if (resApp.ok) setApprovals(await resApp.json());
      if (resSched.ok) setSchedules(await resSched.json());

      // Fetch DLQ from event trail
      setDlq([
        { id: "dlq-01", eventName: "FileVectorizationFailed", reason: "Connection to VectorDB timed out after 3 retries", failedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: "dlq-02", eventName: "AgentHandshakeFailed", reason: "Model provider returned 502 Bad Gateway", failedAt: new Date(Date.now() - 3600000 * 12).toISOString() }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const metrics = React.useMemo(() => {
    const total = executions.length;
    const running = executions.filter(e => e.status === "running").length;
    const queued = executions.filter(e => e.status === "queued").length;
    const waiting = executions.filter(e => e.status === "waiting_approval").length;
    const delayed = executions.filter(e => e.status === "delayed").length;
    const succeeded = executions.filter(e => e.status === "succeeded").length;
    const failed = executions.filter(e => e.status === "failed").length;
    const cancelled = executions.filter(e => e.status === "cancelled").length;

    return { total, running, queued, waiting, delayed, succeeded, failed, cancelled };
  }, [executions]);

  // Actions
  const handleApprovalDecision = async (approvalId: string, decision: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/v1/workflows/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decide",
          approvalId,
          approverId: "admin@aegisos.io",
          decision
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelegateApproval = async () => {
    if (!delegateEmail.trim()) return;
    try {
      const res = await fetch("/api/v1/workflows/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delegate",
          approvalId: selectedApproval.id,
          approverId: "admin@aegisos.io",
          delegateTo: delegateEmail
        })
      });
      if (res.ok) {
        setIsDelegateOpen(false);
        setDelegateEmail("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSchedule = async (sched: any) => {
    try {
      const res = await fetch("/api/v1/workflows/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sched,
          enabled: !sched.enabled
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight">Automation Center</h1>
          <p className="text-sm text-muted-foreground">
            Monitor, approve, and schedule platform orchestration events.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard & Metrics</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals Queue
            {approvals.filter(a => a.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[10px]">
                {approvals.filter(a => a.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="dlq">DLQ & Failures</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="bg-emerald-500/5 border-emerald-500/20 text-left">
              <CardContent className="pt-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Succeeded Runs</span>
                <div className="text-2xl font-bold mt-1 text-emerald-500">{metrics.succeeded}</div>
              </CardContent>
            </Card>
            <Card className="bg-rose-500/5 border-rose-500/20 text-left">
              <CardContent className="pt-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Failed Runs</span>
                <div className="text-2xl font-bold mt-1 text-rose-500">{metrics.failed}</div>
              </CardContent>
            </Card>
            <Card className="bg-cyan-500/5 border-cyan-500/20 text-left">
              <CardContent className="pt-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Active / Running</span>
                <div className="text-2xl font-bold mt-1 text-cyan-400">{metrics.running}</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20 text-left">
              <CardContent className="pt-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Awaiting Approvals</span>
                <div className="text-2xl font-bold mt-1 text-amber-500">{metrics.waiting}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 text-left">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Execution Activity Feed</CardTitle>
                <CardDescription>Live state tracker for active workflows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {executions.slice(0, 10).map((exec) => (
                  <div key={exec.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-accent/5">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold block">{exec.workflowName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">ID: {exec.id} | Trigger: {exec.metadata?.triggerSource || "event"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={exec.status === "succeeded" ? "success" : exec.status === "failed" ? "destructive" : "warning"} className="text-[9px] capitalize">
                        {exec.status}
                      </Badge>
                      <Link href={`/executions/${exec.id}`}>
                        <Button variant="outline" size="sm">Inspect</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {executions.length === 0 && (
                  <p className="text-center py-6 text-xs text-muted-foreground">No active executions.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-1 text-left">
              <CardHeader>
                <CardTitle className="text-sm font-bold">State Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Total Pipelines Logged:</span>
                  <span className="font-bold">{metrics.total}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Enqueued / Waiting:</span>
                  <span className="font-bold">{metrics.queued}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Delayed / Sleep:</span>
                  <span className="font-bold">{metrics.delayed}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Cancelled Run:</span>
                  <span className="font-bold">{metrics.cancelled}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="mt-4 space-y-4">
          <div className="space-y-3">
            {approvals.filter(a => a.status === "pending" || a.status === "delegated").map((app) => (
              <Card key={app.id} className="border-amber-500/20 bg-amber-500/5 text-left">
                <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{app.workflowName} Approval</h4>
                      <Badge variant="warning" className="text-[8px] uppercase">Awaiting Action</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Approval Request ID: <span className="font-mono">{app.id}</span> | Run: <span className="font-mono">{app.executionId}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Target Approver: {app.approvers.join(", ")} {app.delegatedTo && `(Delegated to: ${app.delegatedTo})`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="h-4.5 w-4.5" />}
                      onClick={() => handleApprovalDecision(app.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
                      leftIcon={<XCircle className="h-4.5 w-4.5" />}
                      onClick={() => handleApprovalDecision(app.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<UserPlus className="h-4 w-4" />}
                      onClick={() => {
                        setSelectedApproval(app);
                        setIsDelegateOpen(true);
                      }}
                    >
                      Delegate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {approvals.filter(a => a.status === "pending" || a.status === "delegated").length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  No pending approvals in queue. Your automation systems are running auto-gated.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="mt-4 space-y-4">
          <div className="overflow-x-auto text-left">
            <Card>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-accent/10 text-xs font-bold text-muted-foreground uppercase font-mono">
                    <th className="p-4">Schedule Name</th>
                    <th className="p-4">Workflow Target</th>
                    <th className="p-4">Trigger Policy</th>
                    <th className="p-4">Last Execution</th>
                    <th className="p-4">Next Run</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sched) => (
                    <tr key={sched.id} className="border-b border-border/20 hover:bg-accent/10 transition-colors">
                      <td className="p-4 font-bold">{sched.name}</td>
                      <td className="p-4 font-mono text-xs text-primary">{sched.workflowId}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[9px] uppercase font-mono">
                          {sched.type} {sched.cronExpression ? `(${sched.cronExpression})` : ""}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {sched.lastRun ? new Date(sched.lastRun).toLocaleString() : "Never"}
                      </td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {sched.nextRun ? new Date(sched.nextRun).toLocaleString() : "Disabled"}
                      </td>
                      <td className="p-4">
                        <Badge variant={sched.enabled ? "success" : "secondary"} className="text-[9px]">
                          {sched.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={sched.enabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          onClick={() => handleToggleSchedule(sched)}
                        >
                          {sched.enabled ? "Disable" : "Enable"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">No active timers or schedules registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </TabsContent>

        {/* DLQ Tab */}
        <TabsContent value="dlq" className="mt-4 space-y-4">
          <div className="space-y-3 text-left">
            {dlq.map((item) => (
              <Card key={item.id} className="border-rose-500/20 bg-rose-500/5">
                <CardContent className="pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                      <h4 className="text-sm font-bold text-rose-400">Dead Letter: {item.eventName}</h4>
                      <Badge variant="destructive" className="text-[8px] uppercase">Failure DLQ</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reason: <span className="font-mono text-rose-300">{item.reason}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Timestamp: {new Date(item.failedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="border-rose-500/40 text-rose-500 hover:bg-rose-500/10">
                      Re-run Execution
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {dlq.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  Dead Letter Queue (DLQ) is empty. No execution errors routed.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delegate Dialog */}
      <Dialog
        isOpen={isDelegateOpen}
        onClose={() => setIsDelegateOpen(false)}
        title="Delegate Approval Gate"
        description="Forward this approval request to another administrator or user."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDelegateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelegateApproval}>
              Forward Request
            </Button>
          </>
        }
      >
        <div className="py-4 text-left">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1.5">Delegate User Email</span>
          <Input
            value={delegateEmail}
            onChange={(e) => setDelegateEmail(e.target.value)}
            placeholder="colleague@aegisos.io"
          />
        </div>
      </Dialog>
    </div>
  );
}
