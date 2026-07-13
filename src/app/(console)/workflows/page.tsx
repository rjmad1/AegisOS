"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GitBranch, ChevronRight, RefreshCw, Plus, Save, Play, Trash2, CheckCircle2,
  AlertTriangle, Settings, ArrowRight, Zap, Hourglass, HelpCircle, UserCheck, Bell, Terminal, ExternalLink
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { WorkflowNode } from "@/types/workflow";

export default function WorkflowsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryAction = searchParams.get("action");
  const queryTemplate = searchParams.get("template");

  // State
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Designer Mode State
  const [isDesignerOpen, setIsDesignerOpen] = React.useState(false);
  const [designerWf, setDesignerWf] = React.useState<any>({
    id: "",
    name: "",
    description: "",
    version: "1.0.0",
    nodes: [],
    capabilities: [],
    dependencies: [],
    relationships: [],
    metadata: {}
  });
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [designerActionTypes, setDesignerActionTypes] = React.useState<any[]>([]);
  const [designerTriggerTypes, setDesignerTriggerTypes] = React.useState<any[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Execution Dialog State
  const [isExecDialogOpen, setIsExecDialogOpen] = React.useState(false);
  const [selectedWf, setSelectedWf] = React.useState<any>(null);
  const [execVariables, setExecVariables] = React.useState<string>("{\n  \n}");

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workflows?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load workflows");
      const data = await res.json();
      setWorkflows(data.workflows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/v1/workflows/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDesignerMetadata = async () => {
    try {
      const resTrig = await fetch("/api/v1/workflows/triggers");
      const resAct = await fetch("/api/v1/workflows/actions");
      if (resTrig.ok) setDesignerTriggerTypes(await resTrig.json());
      if (resAct.ok) setDesignerActionTypes(await resAct.json());
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchWorkflows();
    fetchTemplates();
    fetchDesignerMetadata();
  }, [searchQuery]);

  React.useEffect(() => {
    if (queryAction === "create") {
      handleCreateNew();
    }
    if (queryTemplate) {
      handleInstantiateTemplate(queryTemplate);
    }
  }, [queryAction, queryTemplate, templates]);

  // Validation Engine
  const validateGraph = (wf: any) => {
    const errors: string[] = [];
    if (!wf.id.trim()) errors.push("Workflow ID is required.");
    if (!wf.name.trim()) errors.push("Workflow Name is required.");
    if (wf.nodes.length === 0) {
      errors.push("Workflow must contain at least one node.");
      setValidationErrors(errors);
      return;
    }

    const startNode = wf.nodes.find((n: any) => n.type === "trigger" || n.id === "start" || !wf.nodes.some((p: any) => p.next === n.id));
    if (!startNode) {
      errors.push("No start node or trigger node detected.");
    }

    // Detect loops / cycles
    const visited = new Set<string>();
    const stack = new Set<string>();
    let hasCycle = false;

    const dfs = (nodeId: string) => {
      if (stack.has(nodeId)) {
        hasCycle = true;
        return;
      }
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      stack.add(nodeId);

      const node = wf.nodes.find((n: any) => n.id === nodeId);
      if (node) {
        if (node.next) dfs(node.next);
        if (node.nextTrue) dfs(node.nextTrue);
        if (node.nextFalse) dfs(node.nextFalse);
        if (node.branches) {
          for (const b of node.branches) dfs(b);
        }
      }
      stack.delete(nodeId);
    };

    if (startNode) dfs(startNode.id);
    if (hasCycle) {
      errors.push("Cyclic dependency / infinite loop detected in the execution path.");
    }

    // Check for dangling nodes
    wf.nodes.forEach((n: any) => {
      if (n.type !== "end" && !n.next && !n.nextTrue && !n.nextFalse && (!n.branches || n.branches.length === 0)) {
        errors.push(`Node [${n.name}] is a dead-end but is not marked as 'End'.`);
      }
    });

    setValidationErrors(errors);
  };

  const handleCreateNew = () => {
    setDesignerWf({
      id: `wf-${Math.random().toString(36).substring(2, 8)}`,
      name: "New Custom Workflow",
      description: "Custom pipeline created via designer",
      version: "1.0.0",
      nodes: [
        { id: "node-1", name: "Manual Trigger", type: "trigger", config: { triggerType: "manual" }, next: "node-2" },
        { id: "node-2", name: "End Point", type: "end", config: {} }
      ],
      capabilities: ["custom-pipeline"],
      dependencies: [],
      relationships: [],
      metadata: {}
    });
    setSelectedNodeId("node-1");
    setValidationErrors([]);
    setIsDesignerOpen(true);
  };

  const handleInstantiateTemplate = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    setDesignerWf({
      id: `wf-${tpl.id}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${tpl.name} Instance`,
      description: tpl.description,
      version: tpl.version,
      nodes: JSON.parse(JSON.stringify(tpl.nodes)),
      capabilities: tpl.metadata?.capabilities || ["templated-pipeline"],
      dependencies: [],
      relationships: [],
      metadata: { ...tpl.metadata }
    });
    setSelectedNodeId(tpl.nodes[0]?.id || null);
    setValidationErrors([]);
    setIsDesignerOpen(true);
  };

  const handleSaveWorkflow = async () => {
    validateGraph(designerWf);
    if (validationErrors.length > 0) return;

    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(designerWf)
      });
      if (res.ok) {
        setIsDesignerOpen(false);
        router.push("/workflows");
        fetchWorkflows();
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerExec = async () => {
    try {
      let vars = {};
      try {
        vars = JSON.parse(execVariables);
      } catch {
        alert("Invalid variables JSON object");
        return;
      }

      const res = await fetch("/api/v1/workflows/executions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          workflowId: selectedWf.id,
          variables: vars
        })
      });
      if (res.ok) {
        setIsExecDialogOpen(false);
        router.push("/executions");
      } else {
        const err = await res.json();
        alert(`Execution fail: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Node editing actions in designer
  const handleUpdateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    const updatedNodes = designerWf.nodes.map((n: any) => {
      if (n.id === nodeId) {
        const nextNode = { ...n, ...updates };
        if (updates.config) {
          nextNode.config = { ...n.config, ...updates.config };
        }
        return nextNode;
      }
      return n;
    });
    const updated = { ...designerWf, nodes: updatedNodes };
    setDesignerWf(updated);
    validateGraph(updated);
  };

  const handleAddNode = () => {
    const newId = `node-${Math.random().toString(36).substring(2, 6)}`;
    const newNode: WorkflowNode = {
      id: newId,
      name: "New Task Step",
      type: "provider_call",
      config: { providerId: "filesystem-provider", method: "checkHealth" }
    };
    const updated = { ...designerWf, nodes: [...designerWf.nodes, newNode] };
    setDesignerWf(updated);
    setSelectedNodeId(newId);
    validateGraph(updated);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = designerWf.nodes.filter((n: any) => n.id !== nodeId).map((n: any) => {
      if (n.next === nodeId) delete n.next;
      if (n.nextTrue === nodeId) delete n.nextTrue;
      if (n.nextFalse === nodeId) delete n.nextFalse;
      return n;
    });
    const updated = { ...designerWf, nodes: updatedNodes };
    setDesignerWf(updated);
    setSelectedNodeId(null);
    validateGraph(updated);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "trigger": return <Zap className="h-4 w-4" />;
      case "condition":
      case "decision": return <HelpCircle className="h-4 w-4" />;
      case "delay": return <Hourglass className="h-4 w-4" />;
      case "approval": return <UserCheck className="h-4 w-4" />;
      case "notification": return <Bell className="h-4 w-4" />;
      case "script": return <Terminal className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Explorer Mode Dashboard */}
      {!isDesignerOpen ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workflow Registry</h1>
              <p className="text-sm text-muted-foreground">
                Orchestrate, schedule, and configure cross-provider automation pipelines.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search pipelines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleCreateNew}
              >
                Create Workflow
              </Button>
            </div>
          </div>

          {/* Templates Quick Start */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quickstart Templates</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <Card key={tpl.id} className="hover:border-primary/30 transition-all bg-accent/5">
                  <CardHeader className="pb-3 text-left">
                    <CardTitle className="text-sm font-bold">{tpl.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{tpl.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center pt-0">
                    <span className="text-[10px] font-mono text-muted-foreground">v{tpl.version}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ChevronRight className="h-3 w-3" />}
                      onClick={() => handleInstantiateTemplate(tpl.id)}
                    >
                      Instantiate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Registry Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Registered Workflows</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">Loading registry...</div>
              ) : workflows.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">No workflows registered matching filter.</div>
              ) : (
                workflows.map((wf) => (
                  <Card key={wf.id} className="hover:border-primary/40 transition-colors flex flex-col justify-between group">
                    <CardHeader className="pb-3 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                          <GitBranch className="h-5 w-5" />
                        </div>
                        <div className="flex gap-1.5">
                          <Badge variant="success" className="capitalize text-[9px] font-mono">{wf.status}</Badge>
                          <Badge variant="outline" className="text-[9px] font-mono">v{wf.version}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base font-bold mt-3">{wf.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 mt-1">{wf.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 pt-0 text-left">
                      <div className="flex flex-wrap gap-1">
                        {wf.capabilities?.map((cap: string, cIdx: number) => (
                          <Badge key={cIdx} variant="secondary" className="text-[9px] px-1.5 py-0 border border-border/40 font-mono">
                            {cap}
                          </Badge>
                        ))}
                      </div>

                      <div className="border-t border-border/20 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{wf.executionHistory?.length || 0} runs</span>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Play className="h-3 w-3" />}
                            onClick={() => {
                              setSelectedWf(wf);
                              setIsExecDialogOpen(true);
                            }}
                          >
                            Trigger
                          </Button>
                          <Link href={`/workflows/${wf.id}`}>
                            <Button variant="outline" size="sm">Details</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Designer Mode */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border/60">
            <div className="text-left">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Designer: {designerWf.name}
              </h2>
              <p className="text-xs text-muted-foreground">{designerWf.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsDesignerOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSaveWorkflow}
              >
                Save Definition
              </Button>
            </div>
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg flex items-start gap-2.5 text-left text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold block mb-0.5">Validation Errors Detected:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Visual Node List Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div className="text-left">
                    <CardTitle className="text-sm font-bold">Workflow Graph Sequence</CardTitle>
                    <CardDescription className="text-xs">Chronological step sequence of actions.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={handleAddNode}>
                    Add Node
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {designerWf.nodes.map((node: any, idx: number) => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div key={node.id} className="flex flex-col items-center">
                        <div
                          className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary/10 border-primary/50 text-foreground"
                              : "bg-accent/5 border-border/40 hover:bg-accent/15"
                          }`}
                          onClick={() => setSelectedNodeId(node.id)}
                        >
                          <div className="flex items-center gap-3 text-left">
                            <div className="p-2 rounded-lg bg-background border text-primary">
                              {getIconForType(node.type)}
                            </div>
                            <div>
                              <span className="text-xs font-semibold block">{node.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">{node.type} | ID: {node.id}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {node.next && (
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                Next: {node.next}
                              </Badge>
                            )}
                            {node.nextTrue && (
                              <Badge variant="success" className="text-[10px] font-mono">
                                True: {node.nextTrue}
                              </Badge>
                            )}
                            {node.nextFalse && (
                              <Badge variant="destructive" className="text-[10px] font-mono">
                                False: {node.nextFalse}
                              </Badge>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {idx < designerWf.nodes.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground/60 rotate-90 my-1" />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Selected Node Config Pane */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Node Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-left">
                  {selectedNodeId ? (
                    (() => {
                      const node = designerWf.nodes.find((n: any) => n.id === selectedNodeId);
                      if (!node) return <p className="text-xs text-muted-foreground">Select a node to configure properties.</p>;
                      return (
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Node Name</span>
                            <Input
                              value={node.name}
                              onChange={(e) => handleUpdateNode(node.id, { name: e.target.value })}
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Node Type</span>
                            <Select
                              value={node.type}
                              onChange={(e) => handleUpdateNode(node.id, { type: e.target.value as any, config: {} })}
                              options={[
                                { label: "Trigger Node", value: "trigger" },
                                { label: "Condition Gate", value: "condition" },
                                { label: "Decision Path", value: "decision" },
                                { label: "Parallel Node", value: "parallel" },
                                { label: "Loop Node", value: "loop" },
                                { label: "Delay Step", value: "delay" },
                                { label: "Approval Gate", value: "approval" },
                                { label: "Notification", value: "notification" },
                                { label: "Provider Call", value: "provider_call" },
                                { label: "Script Execution", value: "script" },
                                { label: "Sub-workflow Run", value: "sub_workflow" },
                                { label: "End Pipeline", value: "end" }
                              ]}
                            />
                          </div>

                          {/* Conditional Configurations */}
                          {node.type === "trigger" && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Trigger Type</span>
                              <Select
                                value={node.config.triggerType || "manual"}
                                onChange={(e) => handleUpdateNode(node.id, { config: { triggerType: e.target.value } })}
                                options={[
                                  { label: "Manual Trigger", value: "manual" },
                                  { label: "Schedule (Cron)", value: "schedule" },
                                  { label: "Event Listener", value: "event" }
                                ]}
                              />
                              {node.config.triggerType === "schedule" && (
                                <div className="mt-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Cron Expression</span>
                                  <Input
                                    value={node.config.cronExpression || ""}
                                    placeholder="* * * * *"
                                    onChange={(e) => handleUpdateNode(node.id, { config: { cronExpression: e.target.value } })}
                                  />
                                </div>
                              )}
                              {node.config.triggerType === "event" && (
                                <div className="mt-2">
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Event Name</span>
                                  <Input
                                    value={node.config.eventName || ""}
                                    placeholder="ArtifactCreated"
                                    onChange={(e) => handleUpdateNode(node.id, { config: { eventName: e.target.value } })}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {(node.type === "condition" || node.type === "decision") && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Expression (JS)</span>
                              <Input
                                value={node.config.expression || ""}
                                placeholder="variables.fileCount > 0"
                                onChange={(e) => handleUpdateNode(node.id, { config: { expression: e.target.value } })}
                              />
                            </div>
                          )}

                          {node.type === "delay" && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Delay (Seconds)</span>
                              <Input
                                type="number"
                                value={node.config.delaySeconds || 10}
                                onChange={(e) => handleUpdateNode(node.id, { config: { delaySeconds: parseInt(e.target.value, 10) } })}
                              />
                            </div>
                          )}

                          {node.type === "approval" && (
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Approver Emails (CSV)</span>
                                <Input
                                  value={node.config.approvers?.join(", ") || ""}
                                  placeholder="admin@openclaw.io"
                                  onChange={(e) => handleUpdateNode(node.id, { config: { approvers: e.target.value.split(",").map(s => s.trim()) } })}
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Timeout (Seconds)</span>
                                <Input
                                  type="number"
                                  value={node.config.timeoutSeconds || 3600}
                                  onChange={(e) => handleUpdateNode(node.id, { config: { timeoutSeconds: parseInt(e.target.value, 10) } })}
                                />
                              </div>
                            </div>
                          )}

                          {node.type === "notification" && (
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Notification Title</span>
                                <Input
                                  value={node.config.title || ""}
                                  onChange={(e) => handleUpdateNode(node.id, { config: { title: e.target.value } })}
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Message</span>
                                <Input
                                  value={node.config.message || ""}
                                  onChange={(e) => handleUpdateNode(node.id, { config: { message: e.target.value } })}
                                />
                              </div>
                            </div>
                          )}

                          {node.type === "provider_call" && (
                            <div className="space-y-2">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Target Provider</span>
                                <Select
                                  value={node.config.providerId || ""}
                                  onChange={(e) => handleUpdateNode(node.id, { config: { providerId: e.target.value } })}
                                  options={designerActionTypes.filter(a => a.type === "provider_call").map(a => ({
                                    label: a.name,
                                    value: a.config.providerId
                                  }))}
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Method</span>
                                <Input
                                  value={node.config.method || ""}
                                  placeholder="checkHealth"
                                  onChange={(e) => handleUpdateNode(node.id, { config: { method: e.target.value } })}
                                />
                              </div>
                            </div>
                          )}

                          {node.type === "script" && (
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Script Block (JS)</span>
                              <textarea
                                value={node.config.script || ""}
                                placeholder="return { success: true };"
                                onChange={(e) => handleUpdateNode(node.id, { config: { script: e.target.value } })}
                                className="w-full h-32 text-xs font-mono p-2 border roundedbg-background text-foreground border-border"
                              />
                            </div>
                          )}

                          {/* Connections */}
                          <div className="border-t border-border/20 pt-4 space-y-3">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Connections</span>
                            
                            {(node.type !== "condition" && node.type !== "decision" && node.type !== "end") && (
                              <div>
                                <span className="text-[10px] text-muted-foreground block mb-1">Next Step</span>
                                <Select
                                  value={node.next || ""}
                                  onChange={(e) => handleUpdateNode(node.id, { next: e.target.value })}
                                  options={[
                                    { label: "-- None --", value: "" },
                                    ...designerWf.nodes.filter((n: any) => n.id !== node.id).map((n: any) => ({
                                      label: `${n.name} (${n.id})`,
                                      value: n.id
                                    }))
                                  ]}
                                />
                              </div>
                            )}

                            {(node.type === "condition" || node.type === "decision") && (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-[10px] text-success block mb-1">Next Node (If True)</span>
                                  <Select
                                    value={node.nextTrue || ""}
                                    onChange={(e) => handleUpdateNode(node.id, { nextTrue: e.target.value })}
                                    options={[
                                      { label: "-- None --", value: "" },
                                      ...designerWf.nodes.filter((n: any) => n.id !== node.id).map((n: any) => ({
                                        label: `${n.name} (${n.id})`,
                                        value: n.id
                                      }))
                                    ]}
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-destructive block mb-1">Next Node (If False)</span>
                                  <Select
                                    value={node.nextFalse || ""}
                                    onChange={(e) => handleUpdateNode(node.id, { nextFalse: e.target.value })}
                                    options={[
                                      { label: "-- None --", value: "" },
                                      ...designerWf.nodes.filter((n: any) => n.id !== node.id).map((n: any) => ({
                                        label: `${n.name} (${n.id})`,
                                        value: n.id
                                      }))
                                    ]}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-xs text-muted-foreground">Select a node from the graph to configure its properties.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Manual Execution Dialog */}
      <Dialog
        isOpen={isExecDialogOpen}
        onClose={() => setIsExecDialogOpen(false)}
        title="Run Workflow Execution"
        description="Specify input payload variables (JSON format) to execute."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsExecDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTriggerExec}>
              Launch Pipeline
            </Button>
          </>
        }
      >
        <div className="py-4 text-left">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1.5">Input Payload (JSON)</span>
          <textarea
            value={execVariables}
            onChange={(e) => setExecVariables(e.target.value)}
            className="w-full h-40 text-xs font-mono p-3 border rounded-lg bg-background text-foreground border-border"
          />
        </div>
      </Dialog>
    </div>
  );
}
