// src/repositories/workspace.repository.ts
// Relational SQLite Persistence for Workspaces using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import type { Workspace, WorkspaceSettings } from "../enterprise/tenant/types";

export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  get(id: string): Promise<Workspace | null>;
  list(tenantId?: string): Promise<Workspace[]>;
  delete(id: string): Promise<void>;
}

export function serializeWorkspace(workspace: Workspace): any {
  return {
    id: workspace.id,
    tenantId: workspace.tenantId,
    organizationId: workspace.organizationId,
    name: workspace.name,
    slug: workspace.slug,
    description: workspace.description,
    status: workspace.status,
    departmentId: workspace.departmentId,
    businessUnitId: workspace.businessUnitId,
    projectId: workspace.projectId,
    settings: JSON.stringify(workspace.settings || {}),
    metadata: JSON.stringify(workspace.metadata || {}),
    createdAt: new Date(workspace.createdAt),
    updatedAt: new Date(workspace.updatedAt),
    deletedAt: workspace.deletedAt ? new Date(workspace.deletedAt) : null,
  };
}

export function deserializeWorkspace(record: any): Workspace {
  return {
    id: record.id,
    tenantId: record.tenantId,
    organizationId: record.organizationId,
    name: record.name,
    slug: record.slug,
    description: record.description,
    status: record.status as any,
    departmentId: record.departmentId,
    businessUnitId: record.businessUnitId,
    projectId: record.projectId,
    settings: record.settings ? JSON.parse(record.settings) : {
      defaultAiModel: null,
      knowledgeBaseIds: [],
      enabledFeatures: [],
      dataClassification: 'internal',
      retentionDays: 365,
      notificationChannels: [],
    },
    metadata: record.metadata ? JSON.parse(record.metadata) : {},
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
    deletedAt: record.deletedAt ? (record.deletedAt instanceof Date ? record.deletedAt.toISOString() : record.deletedAt) : null,
  };
}

export class SQLiteWorkspaceRepository implements WorkspaceRepository {
  public async save(workspace: Workspace): Promise<void> {
    const data = serializeWorkspace(workspace);
    await prisma.workspace.upsert({
      where: { id: workspace.id },
      update: data,
      create: data,
    });
  }

  public async get(id: string): Promise<Workspace | null> {
    const record = await prisma.workspace.findUnique({
      where: { id },
    });
    if (!record) return null;
    return deserializeWorkspace(record);
  }

  public async list(tenantId?: string): Promise<Workspace[]> {
    const filter = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };
    const records = await prisma.workspace.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeWorkspace);
  }

  public async delete(id: string): Promise<void> {
    await prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
  }
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private store = new Map<string, string>();

  public async save(workspace: Workspace): Promise<void> {
    this.store.set(workspace.id, JSON.stringify(workspace));
  }

  public async get(id: string): Promise<Workspace | null> {
    const data = this.store.get(id);
    if (!data) return null;
    const ws = JSON.parse(data);
    if (ws.deletedAt) return null;
    return ws;
  }

  public async list(tenantId?: string): Promise<Workspace[]> {
    const list: Workspace[] = [];
    for (const data of this.store.values()) {
      const ws = JSON.parse(data);
      if (ws.deletedAt) continue;
      if (!tenantId || ws.tenantId === tenantId) {
        list.push(ws);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async delete(id: string): Promise<void> {
    const ws = await this.get(id);
    if (ws) {
      ws.deletedAt = new Date().toISOString();
      ws.status = 'deleted';
      await this.save(ws);
    }
  }
}
