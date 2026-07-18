// src/services/workspace.service.ts
// Workspace Operating Environment (WOE) Core Workspace Service

import { SQLiteWorkspaceRepository, WorkspaceRepository, MemoryWorkspaceRepository } from "../repositories/workspace.repository";
import type { Workspace, WorkspaceSettings } from "../enterprise/tenant/types";
import prisma from "../infrastructure/db/prisma";
import { artifactRegistry } from "../infrastructure/registry/artifact-registry";
import { knowledgeService } from "./knowledge.service";
import { runtimeService } from "./runtime.service";
import * as crypto from "crypto";

export class WorkspaceService {
  private static instance: WorkspaceService | null = null;
  private repository: WorkspaceRepository;

  private constructor() {
    const provider = process.env.DATABASE_PROVIDER || "sqlite";
    if (process.env.NODE_ENV === "test") {
      this.repository = new MemoryWorkspaceRepository();
    } else {
      this.repository = new SQLiteWorkspaceRepository();
    }
  }

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  public setRepository(repo: WorkspaceRepository) {
    this.repository = repo;
  }

  // --- Workspace Lifecycle ---

  public async createWorkspace(params: {
    tenantId: string;
    organizationId: string;
    name: string;
    slug: string;
    description: string;
    settings?: Partial<WorkspaceSettings>;
  }): Promise<Workspace> {
    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: `ws-${crypto.randomUUID().slice(0, 8)}`,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      name: params.name,
      slug: params.slug,
      description: params.description,
      status: 'active',
      departmentId: null,
      businessUnitId: null,
      projectId: null,
      settings: {
        defaultAiModel: params.settings?.defaultAiModel || "ollama:gemma2:9b",
        knowledgeBaseIds: params.settings?.knowledgeBaseIds || [],
        enabledFeatures: params.settings?.enabledFeatures || ["chat", "missions", "workflows"],
        dataClassification: params.settings?.dataClassification || 'internal',
        retentionDays: params.settings?.retentionDays || 365,
        notificationChannels: params.settings?.notificationChannels || ["ui"],
      },
      metadata: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await this.repository.save(workspace);
    return workspace;
  }

  public async getWorkspace(id: string): Promise<Workspace | null> {
    return this.repository.get(id);
  }

  public async listWorkspaces(tenantId?: string): Promise<Workspace[]> {
    let list = await this.repository.list(tenantId);
    if (list.length === 0) {
      console.log("[WorkspaceService] Database empty. Seeding default workspaces and projects...");
      // Seed Workspace 1
      const ws1 = await this.createWorkspace({
        tenantId: tenantId || "tnt-default",
        organizationId: "org-default",
        name: "AegisOS Platform Core",
        slug: "aegisos-platform-core",
        description: "Workstation Operating System administration console and Zero Trust gateways.",
      });

      // Seed Project 1 under Workspace 1
      const { projectService } = require("./project.service");
      await projectService.createProject({
        tenantId: tenantId || "tnt-default",
        organizationId: "org-default",
        workspaceId: ws1.id,
        name: "Core Infrastructure",
        slug: "core-infrastructure",
        description: "Service orchestrations, cache sync configurations, and proxy routines.",
        goals: [
          "Map Docker virtual bridge socket endpoint binds to proxy",
          "Remediate SQL injection vulnerability in user session token checker",
          "Configure PostgreSQL hot-standby replication in Docker config",
        ],
      });

      // Seed Workspace 2
      const ws2 = await this.createWorkspace({
        tenantId: tenantId || "tnt-default",
        organizationId: "org-default",
        name: "Customer Support Agentic Suite",
        slug: "customer-support-agentic-suite",
        description: "Multi-agent pipeline processing incoming CRM support tickets autonomously.",
      });

      // Seed Project 2 under Workspace 2
      await projectService.createProject({
        tenantId: tenantId || "tnt-default",
        organizationId: "org-default",
        workspaceId: ws2.id,
        name: "Salesforce Webhook Sync",
        slug: "salesforce-webhook-sync",
        description: "Embed CRM handbooks, classification workflows, and auto-reply templates.",
        goals: [
          "Embed customer onboarding playbook documents",
          "Map Salesforce ticket payload webhook schema",
        ],
      });

      // Re-list
      list = await this.repository.list(tenantId);
    }
    return list;
  }

  public async updateWorkspace(id: string, updates: Partial<Omit<Workspace, "id" | "createdAt">>): Promise<Workspace> {
    const workspace = await this.getWorkspace(id);
    if (!workspace) throw new Error(`Workspace ${id} not found.`);

    if (updates.name !== undefined) workspace.name = updates.name;
    if (updates.description !== undefined) workspace.description = updates.description;
    if (updates.status !== undefined) workspace.status = updates.status;
    if (updates.settings !== undefined) workspace.settings = { ...workspace.settings, ...updates.settings };
    if (updates.metadata !== undefined) workspace.metadata = { ...workspace.metadata, ...updates.metadata };
    
    workspace.updatedAt = new Date().toISOString();
    await this.repository.save(workspace);
    return workspace;
  }

  public async deleteWorkspace(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // --- Associated Resource Catalogs ---

  public async getMissions(workspaceId: string): Promise<any[]> {
    // In dev environment or sqlite, we query using prisma.
    // Ensure we handle memory/test database mock.
    if (process.env.NODE_ENV === "test") {
      return [];
    }
    const records = await prisma.mission.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    // Deserialize
    return records.map(r => ({
      ...r,
      goals: r.goals ? JSON.parse(r.goals) : [],
      constraints: r.constraints ? JSON.parse(r.constraints) : [],
      history: r.history ? JSON.parse(r.history) : [],
      decisions: r.decisions ? JSON.parse(r.decisions) : [],
      artifacts: r.artifacts ? JSON.parse(r.artifacts) : [],
      evaluations: r.evaluations ? JSON.parse(r.evaluations) : [],
      lessons: r.lessons ? JSON.parse(r.lessons) : [],
      metrics: r.metrics ? JSON.parse(r.metrics) : {},
    }));
  }

  public async getExecutions(workspaceId: string): Promise<any[]> {
    if (process.env.NODE_ENV === "test") {
      return [];
    }
    const records = await prisma.universalExecution.findMany({
      orderBy: { createdAt: "desc" },
    });
    // Filter executions where workspaceContext contains workspaceId
    return records
      .map(r => {
        const workspaceContext = r.workspaceContext ? JSON.parse(r.workspaceContext) : {};
        return {
          ...r,
          workspaceContext,
          projectContext: r.projectContext ? JSON.parse(r.projectContext) : {},
          intent: r.intent ? JSON.parse(r.intent) : {},
          capability: r.capability ? JSON.parse(r.capability) : {},
          steps: r.steps ? JSON.parse(r.steps) : [],
          artifacts: r.artifacts ? JSON.parse(r.artifacts) : [],
          toolsUsed: r.toolsUsed ? JSON.parse(r.toolsUsed) : [],
          metadata: r.metadata ? JSON.parse(r.metadata) : {},
          telemetry: r.telemetry ? JSON.parse(r.telemetry) : {},
          costMetrics: r.costMetrics ? JSON.parse(r.costMetrics) : {},
          timeline: r.timeline ? JSON.parse(r.timeline) : [],
        };
      })
      .filter(e => e.workspaceContext?.workspaceId === workspaceId || e.workspaceContext?.workspacePath === workspaceId);
  }

  public async getArtifacts(workspaceId: string): Promise<any[]> {
    const result = await artifactRegistry.query({ limit: 1000 });
    // Filter by tag `workspace:<id>` or metadata workspaceId
    return result.items.filter(art => 
      art.tags.includes(`workspace:${workspaceId}`) || 
      art.metadata?.workspaceId === workspaceId ||
      art.relationships.some(r => r.type === "parent" && r.targetId === workspaceId)
    );
  }

  public async getAgents(workspaceId: string): Promise<any[]> {
    const allAgents = await runtimeService.getAgents();
    // Default: workspaces share the main agents. We can mark them as owned by workspace
    return allAgents.map(agent => ({
      ...agent,
      workspaceId,
    }));
  }

  public async getKnowledge(workspaceId: string): Promise<any[]> {
    const entities = await knowledgeService.getEntities();
    // Filter by tag or metadata owner/workspaceId
    return entities.filter(ent => 
      ent.tags.includes(`workspace:${workspaceId}`) || 
      ent.metadata?.workspaceId === workspaceId
    );
  }
}

export const workspaceService = WorkspaceService.getInstance();
export default workspaceService;
