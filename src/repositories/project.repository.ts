// src/repositories/project.repository.ts
// Relational SQLite Persistence for Projects using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import type { Project } from "../types/project";

export interface ProjectRepository {
  save(project: Project): Promise<void>;
  get(id: string): Promise<Project | null>;
  list(workspaceId?: string): Promise<Project[]>;
  delete(id: string): Promise<void>;
}

export function serializeProject(project: Project): any {
  return {
    id: project.id,
    tenantId: project.tenantId,
    organizationId: project.organizationId,
    workspaceId: project.workspaceId,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    settings: JSON.stringify(project.settings || {}),
    goals: JSON.stringify(project.goals || []),
    metadata: JSON.stringify(project.metadata || {}),
    createdAt: new Date(project.createdAt),
    updatedAt: new Date(project.updatedAt),
    deletedAt: project.deletedAt ? new Date(project.deletedAt) : null,
  };
}

export function deserializeProject(record: any): Project {
  return {
    id: record.id,
    tenantId: record.tenantId,
    organizationId: record.organizationId,
    workspaceId: record.workspaceId,
    name: record.name,
    slug: record.slug,
    description: record.description,
    status: record.status as any,
    settings: record.settings ? JSON.parse(record.settings) : {
      defaultAiModel: null,
      knowledgeBaseIds: [],
      enabledFeatures: [],
      dataClassification: 'internal',
    },
    goals: record.goals ? JSON.parse(record.goals) : [],
    metadata: record.metadata ? JSON.parse(record.metadata) : {},
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
    deletedAt: record.deletedAt ? (record.deletedAt instanceof Date ? record.deletedAt.toISOString() : record.deletedAt) : null,
  };
}

export class SQLiteProjectRepository implements ProjectRepository {
  public async save(project: Project): Promise<void> {
    const data = serializeProject(project);
    await prisma.project.upsert({
      where: { id: project.id },
      update: data,
      create: data,
    });
  }

  public async get(id: string): Promise<Project | null> {
    const record = await prisma.project.findUnique({
      where: { id },
    });
    if (!record) return null;
    return deserializeProject(record);
  }

  public async list(workspaceId?: string): Promise<Project[]> {
    const filter = workspaceId ? { workspaceId, deletedAt: null } : { deletedAt: null };
    const records = await prisma.project.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeProject);
  }

  public async delete(id: string): Promise<void> {
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
  }
}

export class MemoryProjectRepository implements ProjectRepository {
  private store = new Map<string, string>();

  public async save(project: Project): Promise<void> {
    this.store.set(project.id, JSON.stringify(project));
  }

  public async get(id: string): Promise<Project | null> {
    const data = this.store.get(id);
    if (!data) return null;
    const proj = JSON.parse(data);
    if (proj.deletedAt) return null;
    return proj;
  }

  public async list(workspaceId?: string): Promise<Project[]> {
    const list: Project[] = [];
    for (const data of this.store.values()) {
      const proj = JSON.parse(data);
      if (proj.deletedAt) continue;
      if (!workspaceId || proj.workspaceId === workspaceId) {
        list.push(proj);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async delete(id: string): Promise<void> {
    const proj = await this.get(id);
    if (proj) {
      proj.deletedAt = new Date().toISOString();
      proj.status = 'deleted';
      await this.save(proj);
    }
  }
}
