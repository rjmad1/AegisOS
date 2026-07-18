// src/services/project.service.ts
// Workspace Operating Environment (WOE) Core Project Service

import { SQLiteProjectRepository, ProjectRepository, MemoryProjectRepository } from "../repositories/project.repository";
import type { Project, ProjectSettings } from "../types/project";
import prisma from "../infrastructure/db/prisma";
import { artifactRegistry } from "../infrastructure/registry/artifact-registry";
import { knowledgeService } from "./knowledge.service";
import * as crypto from "crypto";

export class ProjectService {
  private static instance: ProjectService | null = null;
  private repository: ProjectRepository;

  private constructor() {
    const provider = process.env.DATABASE_PROVIDER || "sqlite";
    if (process.env.NODE_ENV === "test") {
      this.repository = new MemoryProjectRepository();
    } else {
      this.repository = new SQLiteProjectRepository();
    }
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  public setRepository(repo: ProjectRepository) {
    this.repository = repo;
  }

  // --- Project Lifecycle ---

  public async createProject(params: {
    tenantId: string;
    organizationId: string;
    workspaceId: string;
    name: string;
    slug: string;
    description: string;
    goals?: string[];
    settings?: Partial<ProjectSettings>;
  }): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
      name: params.name,
      slug: params.slug,
      description: params.description,
      status: 'active',
      settings: {
        defaultAiModel: params.settings?.defaultAiModel || "ollama:gemma2:9b",
        knowledgeBaseIds: params.settings?.knowledgeBaseIds || [],
        enabledFeatures: params.settings?.enabledFeatures || ["missions", "workflows"],
        dataClassification: params.settings?.dataClassification || 'internal',
      },
      goals: params.goals || [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await this.repository.save(project);
    return project;
  }

  public async getProject(id: string): Promise<Project | null> {
    return this.repository.get(id);
  }

  public async listProjects(workspaceId?: string): Promise<Project[]> {
    return this.repository.list(workspaceId);
  }

  public async updateProject(id: string, updates: Partial<Omit<Project, "id" | "createdAt">>): Promise<Project> {
    const project = await this.getProject(id);
    if (!project) throw new Error(`Project ${id} not found.`);

    if (updates.name !== undefined) project.name = updates.name;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.status !== undefined) project.status = updates.status;
    if (updates.goals !== undefined) project.goals = updates.goals;
    if (updates.settings !== undefined) project.settings = { ...project.settings, ...updates.settings };
    if (updates.metadata !== undefined) project.metadata = { ...project.metadata, ...updates.metadata };

    project.updatedAt = new Date().toISOString();
    await this.repository.save(project);
    return project;
  }

  public async deleteProject(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // --- Associated Resource Catalogs ---

  public async getMissions(projectId: string): Promise<any[]> {
    if (process.env.NODE_ENV === "test") {
      return [];
    }
    const records = await prisma.mission.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
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

  public async getExecutions(projectId: string): Promise<any[]> {
    if (process.env.NODE_ENV === "test") {
      return [];
    }
    const records = await prisma.universalExecution.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records
      .map(r => {
        const projectContext = r.projectContext ? JSON.parse(r.projectContext) : {};
        return {
          ...r,
          workspaceContext: r.workspaceContext ? JSON.parse(r.workspaceContext) : {},
          projectContext,
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
      .filter(e => e.projectContext?.projectId === projectId);
  }

  public async getArtifacts(projectId: string): Promise<any[]> {
    const result = await artifactRegistry.query({ limit: 1000 });
    return result.items.filter(art => 
      art.tags.includes(`project:${projectId}`) || 
      art.metadata?.projectId === projectId ||
      art.relationships.some(r => r.type === "parent" && r.targetId === projectId)
    );
  }

  public async getKnowledge(projectId: string): Promise<any[]> {
    const entities = await knowledgeService.getEntities();
    return entities.filter(ent => 
      ent.tags.includes(`project:${projectId}`) || 
      ent.metadata?.projectId === projectId
    );
  }

  // --- Project Memory & Timeline ---

  public async getMemory(projectId: string): Promise<any> {
    const missions = await this.getMissions(projectId);
    // Aggregate lessons, decisions, and knowledge references from missions as long-term memory
    const decisions = missions.flatMap(m => m.decisions);
    const lessons = missions.flatMap(m => m.lessons);
    const artifacts = missions.flatMap(m => m.artifacts);

    return {
      projectId,
      decisions,
      lessons,
      artifacts,
      syncedAt: new Date().toISOString(),
    };
  }

  public async getTimeline(projectId: string): Promise<any[]> {
    const missions = await this.getMissions(projectId);
    const executions = await this.getExecutions(projectId);

    const events: any[] = [];

    // Add mission logs
    for (const mission of missions) {
      for (const log of mission.history || []) {
        // Parse time if it starts with [ISOstring]
        const match = log.match(/^\[([^\]]+)\]\s*(.*)/);
        events.push({
          time: match ? match[1] : mission.createdAt,
          event: match ? match[2] : log,
          type: "mission",
          source: mission.name,
        });
      }
    }

    // Add execution logs
    for (const exec of executions) {
      for (const entry of exec.timeline || []) {
        events.push({
          time: entry.timestamp,
          event: `${entry.event}: ${entry.metadata?.message || ""}`,
          type: "execution",
          source: exec.id,
        });
      }
    }

    // Sort events by time desc
    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }
}

export const projectService = ProjectService.getInstance();
export default projectService;
