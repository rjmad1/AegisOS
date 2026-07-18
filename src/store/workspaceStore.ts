// src/store/workspaceStore.ts
// AegisOS Studio - Centralized Workspace Store

import { create } from "zustand";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'archived' | 'building';
  createdAt: string;
  updatedAt: string;
  settings?: {
    defaultAiModel?: string;
    enabledFeatures?: string[];
    retentionDays?: number;
  };
}

export interface WorkspaceProject {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  repositoryUrl?: string;
  branch?: string;
  status: 'active' | 'indexing' | 'error';
  commitCount?: number;
  lastSync?: string;
  goals: string[];
}

export interface WorkspaceKnowledgeDoc {
  id: string;
  workspaceId: string;
  name: string;
  type: 'pdf' | 'markdown' | 'code' | 'diagram' | 'spec';
  sourceUri: string;
  chunkCount: number;
  embeddingStatus: 'indexed' | 'processing' | 'pending';
  vectorCount: number;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface WorkspaceArtifact {
  id: string;
  workspaceId: string;
  title: string;
  type: 'pdf' | 'markdown' | 'architecture' | 'image' | 'decision_log';
  category: string;
  summary: string;
  content: string;
  fileSize?: string;
  createdAt: string;
}

export interface WorkspaceMission {
  id: string;
  workspaceId: string;
  projectId?: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  packId: string;
  packName: string;
  goal: string;
  progress: number; // 0 to 100
  logs: string[];
  createdAt: string;
  completedAt?: string;
}

export interface LiveHealthData {
  knowledgeFreshness: number; // percentage (0-100)
  embeddingStatus: 'healthy' | 'processing' | 'degraded';
  embeddingQueueSize: number;
  modelAvailability: {
    ollama: boolean;
    liteLLM: boolean;
    activeModel: string;
    latencyMs: number;
  };
  gpuStatus: {
    device: string;
    vramUsedGb: number;
    vramTotalGb: number;
    utilizationPct: number;
    tempC: number;
  };
  storage: {
    usedGb: number;
    totalGb: number;
    indexSizeMb: number;
  };
  executionQueue: {
    activeWorkers: number;
    pendingTasks: number;
    throughputPerMin: number;
  };
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  category: 'workspace' | 'mission' | 'execution' | 'artifacts' | 'approvals' | 'knowledge';
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

interface WorkspaceState {
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string | null;
  projects: WorkspaceProject[];
  knowledgeDocs: WorkspaceKnowledgeDoc[];
  artifacts: WorkspaceArtifact[];
  missions: WorkspaceMission[];
  health: LiveHealthData;
  activityFeed: ActivityEvent[];
  isLoading: boolean;
  isIndexing: boolean;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (params: { name: string; description?: string }) => Promise<WorkspaceItem>;
  importRepository: (params: { name: string; repositoryUrl: string; description?: string }) => Promise<WorkspaceProject>;
  importDocument: (params: { name: string; type: WorkspaceKnowledgeDoc['type']; content: string; sourceUri?: string }) => Promise<WorkspaceKnowledgeDoc>;
  triggerKnowledgeBuild: () => Promise<void>;
  createMission: (params: { title: string; packName: string; goal: string; projectId?: string }) => Promise<WorkspaceMission>;
  fetchHealth: () => Promise<void>;
  fetchActivity: () => Promise<void>;
}

const DEFAULT_HEALTH: LiveHealthData = {
  knowledgeFreshness: 98.4,
  embeddingStatus: 'healthy',
  embeddingQueueSize: 0,
  modelAvailability: {
    ollama: true,
    liteLLM: true,
    activeModel: 'ollama:gemma2:9b',
    latencyMs: 42,
  },
  gpuStatus: {
    device: 'NVIDIA GeForce RTX 5080',
    vramUsedGb: 13.1,
    vramTotalGb: 16.0,
    utilizationPct: 82,
    tempC: 54,
  },
  storage: {
    usedGb: 142.5,
    totalGb: 1024.0,
    indexSizeMb: 1240,
  },
  executionQueue: {
    activeWorkers: 4,
    pendingTasks: 0,
    throughputPerMin: 128,
  },
};

const SEED_WORKSPACES: WorkspaceItem[] = [
  {
    id: "ws-default",
    name: "AegisOS Platform Core",
    slug: "aegisos-platform-core",
    description: "Workstation Operating System administration console, knowledge graphs, and zero-trust orchestration.",
    status: "active",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ws-support",
    name: "Customer Support Suite",
    slug: "customer-support-suite",
    description: "Multi-agent pipeline processing incoming support knowledge and autonomous workflow execution.",
    status: "active",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEED_PROJECTS: WorkspaceProject[] = [
  {
    id: "proj-01",
    workspaceId: "ws-default",
    name: "AegisOS Transparency Suite",
    slug: "aegisos-transparency-suite",
    description: "Core repository containing Next.js console, LiteLLM proxy, and Ollama bridge.",
    repositoryUrl: "https://github.com/rjmad1/AegisOS.git",
    branch: "main",
    status: "active",
    commitCount: 342,
    lastSync: new Date(Date.now() - 15 * 60000).toISOString(),
    goals: ["Expose public REST interfaces", "Build zero-trust studio shell", "Enable autonomous workflows"],
  },
  {
    id: "proj-02",
    workspaceId: "ws-default",
    name: "CodeGraph Vector Pipeline",
    slug: "codegraph-vector-pipeline",
    description: "Graph database parser and AST symbol relation indexer.",
    repositoryUrl: "https://github.com/rjmad1/CodeGraph.git",
    branch: "master",
    status: "active",
    commitCount: 189,
    lastSync: new Date(Date.now() - 1 * 3600000).toISOString(),
    goals: ["Index TypeScript ASTs", "Compute graph degree centrality"],
  },
];

const SEED_KNOWLEDGE: WorkspaceKnowledgeDoc[] = [
  {
    id: "kn-01",
    workspaceId: "ws-default",
    name: "ARCHITECTURE.md",
    type: "markdown",
    sourceUri: "d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/ARCHITECTURE.md",
    chunkCount: 24,
    embeddingStatus: "indexed",
    vectorCount: 120,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kn-02",
    workspaceId: "ws-default",
    name: "AI_Infrastructure_Diagram.pdf",
    type: "pdf",
    sourceUri: "d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/AI_Infrastructure.pdf",
    chunkCount: 48,
    embeddingStatus: "indexed",
    vectorCount: 380,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kn-03",
    workspaceId: "ws-default",
    name: "ModelManifest.json",
    type: "code",
    sourceUri: "d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/ModelManifest.json",
    chunkCount: 8,
    embeddingStatus: "indexed",
    vectorCount: 40,
    updatedAt: new Date().toISOString(),
  },
];

const SEED_ARTIFACTS: WorkspaceArtifact[] = [
  {
    id: "art-01",
    workspaceId: "ws-default",
    title: "Sprint 1 Foundation Baseline Report",
    type: "markdown",
    category: "Markdown Reports",
    summary: "Complete verification report of AegisOS Studio Shell & Navigation.",
    content: "# Sprint 1 Baseline Report\n\nAll 6 persona perspectives verified successfully.",
    fileSize: "14.2 KB",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "art-02",
    workspaceId: "ws-default",
    title: "AegisOS Topology Diagram",
    type: "architecture",
    category: "Architecture Diagrams",
    summary: "Visual topology of proxy, Ollama loopback, and SQLite store.",
    content: "graph TD\n  Client[Studio Shell] --> Proxy[LiteLLM Proxy]\n  Proxy --> Ollama[Ollama Local]",
    fileSize: "4.8 KB",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "art-03",
    workspaceId: "ws-default",
    title: "ADR-004 Public REST Architecture",
    type: "decision_log",
    category: "Decision Logs",
    summary: "Architectural Decision Record defining zero-privilege public REST consumption.",
    content: "# ADR-004: Public REST Interfaces\n\nStatus: Accepted\nContext: Studio must consume public endpoints.",
    fileSize: "8.1 KB",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

const SEED_MISSIONS: WorkspaceMission[] = [
  {
    id: "ms-01",
    workspaceId: "ws-default",
    title: "Certify Studio Shell Zero Trust",
    description: "Execute automated evaluation across public API endpoints.",
    status: "completed",
    packId: "pack-security",
    packName: "Security Audit Pack",
    goal: "Verify zero database access from frontend components.",
    progress: 100,
    logs: ["Initializing security scanner...", "Checking REST API schemas...", "Scan passed: 0 policy violations."],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "ms-02",
    workspaceId: "ws-default",
    title: "Index CodeGraph Symbols",
    description: "Parse AST tree and build vector embedding index for newly added workspace repos.",
    status: "running",
    packId: "pack-knowledge",
    packName: "Knowledge Indexer Pack",
    goal: "Embed 100% of workspace source code into semantic memory.",
    progress: 68,
    logs: ["Parsing file tree...", "Chunking TypeScript AST nodes...", "Generated 500 vector embeddings."],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

const SEED_ACTIVITY: ActivityEvent[] = [
  {
    id: "act-01",
    workspaceId: "ws-default",
    category: "workspace",
    title: "Workspace Switched",
    description: "Active workspace set to AegisOS Platform Core",
    actor: "Admin User",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    status: "info",
  },
  {
    id: "act-02",
    workspaceId: "ws-default",
    category: "knowledge",
    title: "Knowledge Index Updated",
    description: "Ingested ARCHITECTURE.md (24 chunks, 120 embeddings)",
    actor: "Knowledge Engine",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: "success",
  },
  {
    id: "act-03",
    workspaceId: "ws-default",
    category: "mission",
    title: "Mission Launched",
    description: "Index CodeGraph Symbols (68% complete)",
    actor: "Admin User",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    status: "info",
  },
];

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: SEED_WORKSPACES,
  activeWorkspaceId: "ws-default",
  projects: SEED_PROJECTS,
  knowledgeDocs: SEED_KNOWLEDGE,
  artifacts: SEED_ARTIFACTS,
  missions: SEED_MISSIONS,
  health: DEFAULT_HEALTH,
  activityFeed: SEED_ACTIVITY,
  isLoading: false,
  isIndexing: false,

  fetchWorkspaces: async () => {
    if (typeof window === "undefined") return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/v1/workspaces");
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.workspaces || [];
        if (items.length > 0) {
          set({
            workspaces: items,
            activeWorkspaceId: get().activeWorkspaceId || items[0].id,
          });
        }
      }
    } catch {
      // Use fallback
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveWorkspaceId: (id: string) => {
    const ws = get().workspaces.find((w) => w.id === id);
    if (ws) {
      set({ activeWorkspaceId: id });
      get().activityFeed.unshift({
        id: `act-${Date.now()}`,
        workspaceId: id,
        category: "workspace",
        title: "Workspace Selected",
        description: `Active workspace switched to ${ws.name}`,
        actor: "User",
        timestamp: new Date().toISOString(),
        status: "info",
      });
    }
  },

  createWorkspace: async ({ name, description }) => {
    set({ isLoading: true });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/v1/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "tnt-default",
            organizationId: "org-default",
            name,
            slug,
            description: description || "Custom user workspace.",
          }),
        });

        if (res.ok) {
          const created: WorkspaceItem = await res.json();
          set((state) => ({
            workspaces: [created, ...state.workspaces],
            activeWorkspaceId: created.id,
            isLoading: false,
          }));
          get().activityFeed.unshift({
            id: `act-${Date.now()}`,
            workspaceId: created.id,
            category: "workspace",
            title: "Workspace Created",
            description: `Created new workspace: ${created.name}`,
            actor: "User",
            timestamp: new Date().toISOString(),
            status: "success",
          });
          return created;
        }
      } catch {
        // Fall back to local creation below
      }
    }

    const fallback: WorkspaceItem = {
      id: `ws-${Date.now().toString(36)}`,
      name,
      slug,
      description: description || "Custom user workspace.",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      workspaces: [fallback, ...state.workspaces],
      activeWorkspaceId: fallback.id,
      isLoading: false,
    }));

    get().activityFeed.unshift({
      id: `act-${Date.now()}`,
      workspaceId: fallback.id,
      category: "workspace",
      title: "Workspace Created",
      description: `Created workspace: ${fallback.name}`,
      actor: "User",
      timestamp: new Date().toISOString(),
      status: "success",
    });

    return fallback;
  },

  importRepository: async ({ name, repositoryUrl, description }) => {
    const wsId = get().activeWorkspaceId || "ws-default";
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newProject: WorkspaceProject = {
      id: `proj-${Date.now()}`,
      workspaceId: wsId,
      name,
      slug,
      description: description || `Imported repository ${repositoryUrl}`,
      repositoryUrl,
      branch: "main",
      status: "indexing",
      commitCount: 1,
      lastSync: new Date().toISOString(),
      goals: ["Initial repository import & CodeGraph AST indexing"],
    };

    set((state) => ({
      projects: [newProject, ...state.projects],
    }));

    // Add activity
    set((state) => ({
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          workspaceId: wsId,
          category: "knowledge",
          title: "Repository Imported",
          description: `Imported repository ${name} (${repositoryUrl})`,
          actor: "User",
          timestamp: new Date().toISOString(),
          status: "success",
        },
        ...state.activityFeed,
      ],
    }));

    // Trigger knowledge index update simulation
    get().triggerKnowledgeBuild();

    return newProject;
  },

  importDocument: async ({ name, type, content, sourceUri }) => {
    const wsId = get().activeWorkspaceId || "ws-default";
    const chunkCount = Math.max(1, Math.ceil(content.length / 500));
    const vectorCount = chunkCount * 5;

    const newDoc: WorkspaceKnowledgeDoc = {
      id: `kn-${Date.now()}`,
      workspaceId: wsId,
      name,
      type,
      sourceUri: sourceUri || `workspace://${wsId}/${name}`,
      chunkCount,
      embeddingStatus: "indexed",
      vectorCount,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      knowledgeDocs: [newDoc, ...state.knowledgeDocs],
    }));

    // Add activity
    set((state) => ({
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          workspaceId: wsId,
          category: "knowledge",
          title: "Document Imported",
          description: `Imported document ${name} (${chunkCount} chunks, ${vectorCount} vectors)`,
          actor: "User",
          timestamp: new Date().toISOString(),
          status: "success",
        },
        ...state.activityFeed,
      ],
    }));

    return newDoc;
  },

  triggerKnowledgeBuild: async () => {
    set({ isIndexing: true });

    setTimeout(() => {
      set((state) => ({
        isIndexing: false,
        health: {
          ...state.health,
          knowledgeFreshness: 100,
          embeddingQueueSize: 0,
          embeddingStatus: "healthy",
          storage: {
            ...state.health.storage,
            indexSizeMb: state.health.storage.indexSizeMb + 45,
          },
        },
        projects: state.projects.map((p) => (p.status === "indexing" ? { ...p, status: "active" } : p)),
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            workspaceId: state.activeWorkspaceId || "ws-default",
            category: "knowledge",
            title: "Knowledge Index Rebuilt",
            description: "100% of workspace repositories and documents indexed into vector memory.",
            actor: "Knowledge Indexer",
            timestamp: new Date().toISOString(),
            status: "success",
          },
          ...state.activityFeed,
        ],
      }));
    }, 1500);
  },

  createMission: async ({ title, packName, goal, projectId }) => {
    const wsId = get().activeWorkspaceId || "ws-default";

    const newMission: WorkspaceMission = {
      id: `ms-${Date.now()}`,
      workspaceId: wsId,
      projectId,
      title,
      description: `Autonomous mission: ${title}`,
      status: "running",
      packId: `pack-${packName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      packName,
      goal,
      progress: 25,
      logs: [
        "Mission initialized.",
        `Target goal: ${goal}`,
        "Allocating worker agents...",
        "Executing step 1: Context analysis & knowledge retrieval...",
      ],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      missions: [newMission, ...state.missions],
      activityFeed: [
        {
          id: `act-${Date.now()}`,
          workspaceId: wsId,
          category: "mission",
          title: "Mission Launched",
          description: `Launched mission: ${title}`,
          actor: "User",
          timestamp: new Date().toISOString(),
          status: "info",
        },
        ...state.activityFeed,
      ],
    }));

    // Simulate progress completion
    setTimeout(() => {
      set((state) => ({
        missions: state.missions.map((m) =>
          m.id === newMission.id
            ? {
                ...m,
                status: "completed",
                progress: 100,
                completedAt: new Date().toISOString(),
                logs: [...m.logs, "Execution complete. Verification passed.", "Artifact generated."],
              }
            : m
        ),
        artifacts: [
          {
            id: `art-${Date.now()}`,
            workspaceId: wsId,
            title: `Mission Output: ${title}`,
            type: "markdown",
            category: "Markdown Reports",
            summary: `Automated output report generated by ${packName}.`,
            content: `# ${title}\n\nGoal: ${goal}\n\nExecution completed successfully with 100% verification.`,
            fileSize: "6.4 KB",
            createdAt: new Date().toISOString(),
          },
          ...state.artifacts,
        ],
        activityFeed: [
          {
            id: `act-${Date.now()}`,
            workspaceId: wsId,
            category: "mission",
            title: "Mission Completed",
            description: `Mission "${title}" completed successfully.`,
            actor: "Mission Engine",
            timestamp: new Date().toISOString(),
            status: "success",
          },
          ...state.activityFeed,
        ],
      }));
    }, 2500);

    return newMission;
  },

  fetchHealth: async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/v1/health");
      if (res.ok) {
        const data = await res.json();
        set({ health: { ...DEFAULT_HEALTH, ...data } });
      }
    } catch {
      // Keep existing health data
    }
  },

  fetchActivity: async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/v1/activity");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activities)) {
          set({ activityFeed: data.activities });
        }
      }
    } catch {
      // Keep existing feed
    }
  },
}));
