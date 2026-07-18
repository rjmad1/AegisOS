"use client";

import * as React from "react";
import { 
  Briefcase, Cpu, Users, Database, FileText, GitBranch, Activity, 
  Clock, BarChart2, ListTodo, Plus, Search, CheckSquare, Layers, 
  Wifi, AlertTriangle, Play, Pause, RefreshCw, CheckCircle2, ChevronRight,
  TrendingUp, Trash2, Globe, Send, ShieldAlert, Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface TaskItem {
  id: string;
  text: string;
  status: "todo" | "in-progress" | "done";
}

export default function ProjectsWorkspacePage() {
  // Lists
  const [workspaces, setWorkspaces] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [missions, setMissions] = React.useState<any[]>([]);
  const [executions, setExecutions] = React.useState<any[]>([]);
  const [artifacts, setArtifacts] = React.useState<any[]>([]);
  const [agents, setAgents] = React.useState<any[]>([]);
  const [approvals, setApprovals] = React.useState<any[]>([]);

  // Selection
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");

  // Loading States
  const [loading, setLoading] = React.useState(true);
  const [runningMission, setRunningMission] = React.useState(false);

  // Forms
  const [showWorkspaceForm, setShowWorkspaceForm] = React.useState(false);
  const [wsName, setWsName] = React.useState("");
  const [wsDesc, setWsDesc] = React.useState("");

  const [showProjectForm, setShowProjectForm] = React.useState(false);
  const [projName, setProjName] = React.useState("");
  const [projDesc, setProjDesc] = React.useState("");
  const [projGoals, setProjGoals] = React.useState("");

  const [newMissionPrompt, setNewMissionPrompt] = React.useState("");
  const [newTaskText, setNewTaskText] = React.useState("");

  // Explorers Search
  const [artifactFilter, setArtifactFilter] = React.useState("");
  const [knowledgeQuery, setKnowledgeQuery] = React.useState("");
  const [knowledgeResults, setKnowledgeResults] = React.useState<any[]>([]);
  const [searchingKnowledge, setSearchingKnowledge] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<string>("overview");

  // Fetch Workspaces on mount
  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/v1/workspaces");
      const data = await res.json();
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    }
  };

  // Fetch Projects when selected Workspace changes
  const fetchProjects = async (wsId: string) => {
    try {
      const res = await fetch(`/api/v1/projects?workspaceId=${wsId}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProjectId(data[0].id);
      } else {
        setSelectedProjectId("");
        setMissions([]);
        setExecutions([]);
        setArtifacts([]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch project scoped items (missions, executions, artifacts, agents)
  const fetchProjectDetails = async (projId: string) => {
    if (!projId) return;
    try {
      // Missions
      const resMissions = await fetch(`/api/v1/missions?projectId=${projId}`);
      const dataMissions = await resMissions.json();
      setMissions(dataMissions);

      // Executions
      const resExecutions = await fetch(`/api/v1/mobile/executions?projectId=${projId}`);
      const dataExecutions = await resExecutions.json();
      setExecutions(dataExecutions);

      // Artifacts
      const resArtifacts = await fetch(`/api/v1/mobile/artifacts?projectId=${projId}`);
      const dataArtifacts = await resArtifacts.json();
      setArtifacts(dataArtifacts);

      // Approvals
      const resApprovals = await fetch(`/api/v1/mobile/approvals`);
      const dataApprovals = await resApprovals.json();
      setApprovals(dataApprovals);
    } catch (err) {
      console.error("Failed to load project details:", err);
    }
  };

  // Fetch Agents
  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/v1/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  };

  React.useEffect(() => {
    fetchWorkspaces();
    fetchAgents();
  }, []);

  React.useEffect(() => {
    if (selectedWorkspaceId) {
      setLoading(true);
      fetchProjects(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  React.useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
      // Setup polling for dynamic validation updates
      const interval = setInterval(() => {
        fetchProjectDetails(selectedProjectId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedProjectId]);

  // Action handlers
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "tnt-default",
          organizationId: "org-default",
          name: wsName,
          slug: wsName.toLowerCase().replace(/\s+/g, "-"),
          description: wsDesc,
        }),
      });
      const newWs = await res.json();
      setWorkspaces(prev => [...prev, newWs]);
      setSelectedWorkspaceId(newWs.id);
      setWsName("");
      setWsDesc("");
      setShowWorkspaceForm(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !selectedWorkspaceId) return;
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "tnt-default",
          organizationId: "org-default",
          workspaceId: selectedWorkspaceId,
          name: projName,
          slug: projName.toLowerCase().replace(/\s+/g, "-"),
          description: projDesc,
          goals: projGoals.split("\n").filter(g => g.trim()),
        }),
      });
      const newProj = await res.json();
      setProjects(prev => [...prev, newProj]);
      setSelectedProjectId(newProj.id);
      setProjName("");
      setProjDesc("");
      setProjGoals("");
      setShowProjectForm(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionPrompt.trim() || !selectedProjectId) return;
    setRunningMission(true);
    try {
      const res = await fetch("/api/v1/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newMissionPrompt,
          constraints: ["Max cost: $2.00 USD", "Max executions: 5"],
          workspaceId: selectedWorkspaceId,
          projectId: selectedProjectId,
        }),
      });
      const mission = await res.json();
      setMissions(prev => [mission, ...prev]);
      setNewMissionPrompt("");
      fetchProjectDetails(selectedProjectId);
    } catch (err) {
      console.error("Failed to launch mission:", err);
    } finally {
      setRunningMission(false);
    }
  };

  const handleApproveApproval = async (approvalId: string, action: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/v1/mobile/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action }),
      });
      if (res.ok) {
        fetchProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error("Failed to action approval:", err);
    }
  };

  const handleSearchKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeQuery.trim()) return;
    setSearchingKnowledge(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(knowledgeQuery)}`);
      const data = await res.json();
      setKnowledgeResults(data);
    } catch (err) {
      console.error("Failed to search knowledge:", err);
    } finally {
      setSearchingKnowledge(false);
    }
  };

  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const currentProject = projects.find(p => p.id === selectedProjectId);

  if (loading && workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Orchestrating Workspace Environment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title & Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-zinc-900/60 border border-border/40 rounded-xl backdrop-blur-md">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span>Workspace Operating Environment</span>
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Isolate knowledge, run missions, and track timelines inside persistent workspaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-muted-foreground uppercase font-bold">Workspace:</span>
            <select
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs font-mono text-white rounded-lg px-3 py-2 font-bold cursor-pointer outline-none focus:border-primary"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-zinc-900 text-white font-mono">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-muted-foreground uppercase font-bold">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs font-mono text-white rounded-lg px-3 py-2 font-bold cursor-pointer outline-none focus:border-primary"
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? (
                <option>No projects</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900 text-white font-mono">
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setShowWorkspaceForm(!showWorkspaceForm)}>
              <Plus className="h-3 w-3 mr-1" /> WS
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowProjectForm(!showProjectForm)} disabled={!selectedWorkspaceId}>
              <Plus className="h-3 w-3 mr-1" /> Proj
            </Button>
          </div>
        </div>
      </div>

      {/* Creation Forms */}
      {showWorkspaceForm && (
        <Card className="border border-primary/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle className="text-sm">Create Persistent Workspace</CardTitle>
            <CardDescription className="text-xs">Setup a top-level workspace to isolate documents, policy settings, and agents.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateWorkspace}>
            <CardContent className="space-y-3">
              <Input placeholder="Workspace Name (e.g. Finance Intelligence)" value={wsName} onChange={e => setWsName(e.target.value)} required />
              <Input placeholder="Description" value={wsDesc} onChange={e => setWsDesc(e.target.value)} />
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowWorkspaceForm(false)}>Cancel</Button>
              <Button size="sm" type="submit">Create Workspace</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {showProjectForm && (
        <Card className="border border-primary/20 bg-zinc-950/80">
          <CardHeader>
            <CardTitle className="text-sm">Add Scoped Project</CardTitle>
            <CardDescription className="text-xs">Create a project within the active workspace to compile goals, memory logs, and custom missions.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateProject}>
            <CardContent className="space-y-3">
              <Input placeholder="Project Name (e.g. Audit Automation)" value={projName} onChange={e => setProjName(e.target.value)} required />
              <Input placeholder="Description" value={projDesc} onChange={e => setProjDesc(e.target.value)} />
              <textarea 
                placeholder="Project Goals (one per line)" 
                value={projGoals} 
                onChange={e => setProjGoals(e.target.value)}
                className="w-full min-h-[80px] bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button size="sm" variant="ghost" type="button" onClick={() => setShowProjectForm(false)}>Cancel</Button>
              <Button size="sm" type="submit">Create Project</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-9 h-auto gap-1 bg-zinc-950 border border-border/20 p-1.5 rounded-xl">
          <TabsTrigger value="overview" className="text-xs font-semibold py-2">Overview</TabsTrigger>
          <TabsTrigger value="missions" className="text-xs font-semibold py-2">Missions</TabsTrigger>
          <TabsTrigger value="executions" className="text-xs font-semibold py-2">Workflows</TabsTrigger>
          <TabsTrigger value="artifacts" className="text-xs font-semibold py-2">Artifacts</TabsTrigger>
          <TabsTrigger value="agents" className="text-xs font-semibold py-2">Agents</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs font-semibold py-2">Knowledge</TabsTrigger>
          <TabsTrigger value="infrastructure" className="text-xs font-semibold py-2">Infrastructure</TabsTrigger>
          <TabsTrigger value="models" className="text-xs font-semibold py-2">Models</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-semibold py-2">Timeline</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Project Profile: {currentProject?.name || "No Project Selected"}</CardTitle>
                  <CardDescription>{currentProject?.description || "Select or add a project from the selector bar."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Goals */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">Project Scoped Goals</span>
                    <div className="space-y-2 font-mono text-xs">
                      {currentProject?.goals && currentProject.goals.map((goal: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2.5 p-3 rounded-lg border border-border/20 bg-accent/5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-zinc-200">{goal}</span>
                        </div>
                      ))}
                      {(!currentProject?.goals || currentProject.goals.length === 0) && (
                        <p className="text-muted-foreground italic">No goals defined for this project.</p>
                      )}
                    </div>
                  </div>

                  {/* Settings overview */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-muted-foreground block">Data Classification</span>
                      <strong className="text-indigo-400 capitalize">{currentProject?.settings?.dataClassification || "internal"}</strong>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-muted-foreground block">Model Core Engine</span>
                      <strong className="text-white">{currentProject?.settings?.defaultAiModel || "ollama:gemma2:9b"}</strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick stats / overview sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-indigo-400" /> Resource Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Missions:</span>
                      <span className="text-white font-bold">{missions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Executions Run:</span>
                      <span className="text-white font-bold">{executions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cataloged Artifacts:</span>
                      <span className="text-white font-bold">{artifacts.length}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* HITL Approvals Queue */}
                {approvals.length > 0 && (
                  <Card className="border-amber-900/40 bg-amber-950/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-400">
                        <ShieldAlert className="h-4 w-4" /> HITL Action Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 font-mono text-xs">
                      {approvals.map((app) => (
                        <div key={app.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                          <p className="text-zinc-200 font-sans font-semibold">Workflow: {app.workflowName}</p>
                          <p className="text-zinc-400 text-[10px]">Node: {app.nodeId}</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-2.5" onClick={() => handleApproveApproval(app.id, "approved")}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-rose-500 border-rose-900/40 hover:bg-rose-950/20 text-[10px] h-7 px-2.5" onClick={() => handleApproveApproval(app.id, "rejected")}>
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: MISSIONS */}
          <TabsContent value="missions">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Mission Launch Form */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Launch Autonomous Mission</CardTitle>
                  <CardDescription className="text-xs">Describe an objective. AegisOS will classification plan and run loop execution graphs.</CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateMission}>
                  <CardContent className="space-y-3">
                    <textarea 
                      placeholder="Prompt (e.g. Conduct research on local network security guidelines)" 
                      value={newMissionPrompt} 
                      onChange={e => setNewMissionPrompt(e.target.value)}
                      required
                      className="w-full min-h-[100px] bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                      disabled={!selectedProjectId}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={runningMission || !selectedProjectId}>
                      {runningMission ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                      Launch Mission
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Missions list */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Project Missions List</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {missions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic font-mono text-center py-6">No active missions for this project.</p>
                  ) : (
                    missions.map((mission) => (
                      <div key={mission.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center">
                          <strong className="text-white font-sans text-sm">{mission.name}</strong>
                          <Badge variant={mission.status === "COMPLETED" ? "success" : mission.status === "FAILED" ? "destructive" : "secondary"}>
                            {mission.status}
                          </Badge>
                        </div>
                        <div className="text-zinc-400">
                          <strong>Goals:</strong> {mission.goals.join("; ")}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Updated: {new Date(mission.updatedAt).toLocaleTimeString()}</span>
                          <span className="text-indigo-400">Confidence: {mission.confidence}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: WORKFLOWS & EXECUTIONS */}
          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Execution History</CardTitle>
                <CardDescription>Execution runs generated from planned workflow graphs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {executions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic font-mono text-center py-6">No execution logs for this project.</p>
                ) : (
                  executions.map((exec) => (
                    <div key={exec.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-cyan-400" />
                          <strong className="text-zinc-200">Execution: {exec.executionId.slice(0, 12)}...</strong>
                        </div>
                        <Badge variant={exec.status === "COMPLETED" ? "success" : exec.status === "FAILED" ? "destructive" : "secondary"}>
                          {exec.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <span>Created: {new Date(exec.createdAt).toLocaleString()}</span>
                        {exec.durationMs && <span className="ml-4">Duration: {exec.durationMs}ms</span>}
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-border/10">
                        {exec.timeline.slice(-3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[10px] text-zinc-400">
                            <span>- {item.event}</span>
                            <span className="text-zinc-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ARTIFACTS */}
          <TabsContent value="artifacts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Project Scoped Artifact Catalog</CardTitle>
                  <CardDescription>Generated documents, spreadsheets, diagrams, and files isolated for this project.</CardDescription>
                </div>
                <div className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg w-full max-w-xs">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    placeholder="Filter files..."
                    value={artifactFilter}
                    onChange={(e) => setArtifactFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-zinc-200 w-full"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {artifacts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic font-mono text-center py-6">No artifacts found in project scope.</p>
                  ) : (
                    artifacts
                      .filter(f => f.name.toLowerCase().includes(artifactFilter.toLowerCase()))
                      .map((file, idx) => (
                        <div key={idx} className="p-3 bg-accent/5 border border-border/20 rounded-xl flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-white block">{file.name}</span>
                              <span className="text-[10px] text-muted-foreground">Version: {file.version} • Created: {new Date(file.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="uppercase text-[9px]">
                            {file.type}
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: AGENTS */}
          <TabsContent value="agents">
            <div className="grid gap-6 md:grid-cols-3">
              {agents.map((ag) => (
                <Card key={ag.id} className="border border-border/30 bg-zinc-900/40">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold text-white">{ag.name}</CardTitle>
                      <CardDescription className="text-xs uppercase font-mono text-muted-foreground tracking-wider mt-0.5">
                        Model: {ag.model}
                      </CardDescription>
                    </div>
                    <Badge variant={ag.healthStatus === "healthy" ? "success" : "warning"}>
                      {ag.healthStatus}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 font-mono text-xs text-zinc-300">
                    <p className="font-sans text-zinc-400 text-xs leading-relaxed">{ag.role}</p>
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {ag.capabilities.map((cap: string, cIdx: number) => (
                        <Badge key={cIdx} variant="outline" className="text-[9px]">{cap}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 6: KNOWLEDGE */}
          <TabsContent value="knowledge">
            <div className="grid gap-6 md:grid-cols-3">
              {/* RAG Search Card */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">RAG Knowledge Search</CardTitle>
                  <CardDescription className="text-xs">Search documents, guidelines, and embeddings across workspace contexts.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSearchKnowledge}>
                  <CardContent className="space-y-3">
                    <Input placeholder="Enter search term..." value={knowledgeQuery} onChange={e => setKnowledgeQuery(e.target.value)} required />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={searchingKnowledge}>
                      {searchingKnowledge ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                      Search Knowledge
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* RAG Results List */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Semantic Search Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {knowledgeResults.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic font-mono text-center py-6">Enter a query to retrieve RAG documentation.</p>
                  ) : (
                    knowledgeResults.map((res, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2 font-mono text-xs">
                        <div className="flex justify-between items-center">
                          <strong className="text-indigo-300 font-sans">{res.title || res.name}</strong>
                          <Badge variant="outline" className="text-[9px]">Score: {res.score?.toFixed(2) || res.score?.semanticScore?.toFixed(2) || "0.9"}</Badge>
                        </div>
                        <p className="text-zinc-400 text-xs">{res.description}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 7: INFRASTRUCTURE */}
          <TabsContent value="infrastructure">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Scoped Adaptors & Bindings</CardTitle>
                <CardDescription>Logical socket engines active for this project's execution loop.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-border/20 text-muted-foreground uppercase font-bold">
                        <th className="pb-3">Service Adapter</th>
                        <th className="pb-3">Endpoint Bound</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      <tr className="hover:bg-accent/5">
                        <td className="py-3 font-semibold text-white font-sans">LiteLLM Proxy</td>
                        <td className="py-3 text-cyan-400">localhost:14000</td>
                        <td className="py-3"><Badge variant="success">healthy</Badge></td>
                      </tr>
                      <tr className="hover:bg-accent/5">
                        <td className="py-3 font-semibold text-white font-sans">Ollama Local Engine</td>
                        <td className="py-3 text-cyan-400">localhost:21434</td>
                        <td className="py-3"><Badge variant="success">healthy</Badge></td>
                      </tr>
                      <tr className="hover:bg-accent/5">
                        <td className="py-3 font-semibold text-white font-sans">SQLite Transaction DB</td>
                        <td className="py-3 text-cyan-400">localhost:19789</td>
                        <td className="py-3"><Badge variant="success">healthy</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 8: MODELS */}
          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Bound Inference Router</CardTitle>
                <CardDescription>VRAM metrics and active routing latency summaries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-accent/5 border border-border/20 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white block">ollama:gemma2:9b</span>
                    <span className="text-muted-foreground">VRAM allocation: <strong className="text-indigo-400">5.4 GB</strong></span>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="success">active</Badge>
                    <span className="text-muted-foreground block text-[10px]">Latency: 24ms</span>
                  </div>
                </div>

                <div className="p-4 bg-accent/5 border border-border/20 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-white block">litellm:gpt-4o</span>
                    <span className="text-muted-foreground">VRAM allocation: <strong className="text-indigo-400">Cloud (0 GB)</strong></span>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="secondary">standby</Badge>
                    <span className="text-muted-foreground block text-[10px]">Latency: 180ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 9: TIMELINE */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Event Timeline</CardTitle>
                <CardDescription>Chronological log of events aggregated from child executions and missions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 font-mono text-xs border-l border-zinc-800 pl-4 ml-2 relative">
                  {executions.flatMap(e => e.timeline || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6 pl-0">No timeline events compiled yet.</p>
                  ) : (
                    executions.flatMap(e => e.timeline || [])
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((tle: any) => (
                        <div key={tle.id} className="relative space-y-1">
                          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 border border-zinc-950" />
                          <div className="flex justify-between text-[10px]">
                            <span className="text-indigo-400 font-bold uppercase">{tle.event}</span>
                            <span className="text-muted-foreground">{new Date(tle.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc-300 text-xs font-sans leading-relaxed">{tle.metadata?.message || `Execution run event triggered by ${tle.actor}`}</p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
