// src/repositories/mission.repository.ts

import prisma from "../infrastructure/db/prisma";
import { Mission } from "../types/mission";

export interface MissionRepository {
  save(mission: Mission): Promise<void>;
  get(id: string): Promise<Mission | null>;
  list(): Promise<Mission[]>;
  delete(id: string): Promise<void>;
}

export function serializeMission(mission: Mission): any {
  return {
    id: mission.id,
    name: mission.name,
    goals: JSON.stringify(mission.goals || []),
    constraints: JSON.stringify(mission.constraints || []),
    status: mission.status,
    history: JSON.stringify(mission.history || []),
    decisions: JSON.stringify(mission.decisions || []),
    artifacts: JSON.stringify(mission.artifacts || []),
    evaluations: JSON.stringify(mission.evaluations || []),
    confidence: mission.confidence,
    lessons: JSON.stringify(mission.lessons || []),
    metrics: JSON.stringify(mission.metrics || {}),
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
    activeExecutionId: mission.activeExecutionId || null,
    workspaceId: (mission as any).workspaceId || null,
    projectId: (mission as any).projectId || null,
  };
}

export function deserializeMission(record: any): Mission {
  return {
    id: record.id,
    name: record.name,
    goals: record.goals ? JSON.parse(record.goals) : [],
    constraints: record.constraints ? JSON.parse(record.constraints) : [],
    status: record.status as any,
    history: record.history ? JSON.parse(record.history) : [],
    decisions: record.decisions ? JSON.parse(record.decisions) : [],
    artifacts: record.artifacts ? JSON.parse(record.artifacts) : [],
    evaluations: record.evaluations ? JSON.parse(record.evaluations) : [],
    confidence: record.confidence,
    lessons: record.lessons ? JSON.parse(record.lessons) : [],
    metrics: record.metrics ? JSON.parse(record.metrics) : {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    activeExecutionId: record.activeExecutionId || undefined,
    workspaceId: record.workspaceId || undefined,
    projectId: record.projectId || undefined,
  } as any;
}

// 1. SQLite Target Implementation
export class SQLiteMissionRepository implements MissionRepository {
  public async save(mission: Mission): Promise<void> {
    const data = serializeMission(mission);
    await prisma.mission.upsert({
      where: { id: mission.id },
      update: data,
      create: data,
    });
  }

  public async get(id: string): Promise<Mission | null> {
    const record = await prisma.mission.findUnique({
      where: { id },
    });
    if (!record) return null;
    return deserializeMission(record);
  }

  public async list(): Promise<Mission[]> {
    const records = await prisma.mission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeMission);
  }

  public async delete(id: string): Promise<void> {
    await prisma.mission.delete({
      where: { id },
    });
  }
}

// 2. PostgreSQL Target Implementation
export class PostgresMissionRepository implements MissionRepository {
  public async save(mission: Mission): Promise<void> {
    const data = serializeMission(mission);
    await prisma.mission.upsert({
      where: { id: mission.id },
      update: data,
      create: data,
    });
  }

  public async get(id: string): Promise<Mission | null> {
    const record = await prisma.mission.findUnique({
      where: { id },
    });
    if (!record) return null;
    return deserializeMission(record);
  }

  public async list(): Promise<Mission[]> {
    const records = await prisma.mission.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeMission);
  }

  public async delete(id: string): Promise<void> {
    await prisma.mission.delete({
      where: { id },
    });
  }
}

// 3. Memory Target Implementation (for tests)
export class MemoryMissionRepository implements MissionRepository {
  private store = new Map<string, string>();

  public async save(mission: Mission): Promise<void> {
    this.store.set(mission.id, JSON.stringify(mission));
  }

  public async get(id: string): Promise<Mission | null> {
    const data = this.store.get(id);
    if (!data) return null;
    return JSON.parse(data);
  }

  public async list(): Promise<Mission[]> {
    const list: Mission[] = [];
    for (const data of this.store.values()) {
      list.push(JSON.parse(data));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
