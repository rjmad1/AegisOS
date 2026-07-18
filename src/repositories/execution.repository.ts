// src/repositories/execution.repository.ts
// Relational persistence for Universal Execution Contract using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import { UniversalExecution } from "../services/execution-runtime.service";
import * as fs from "fs";
import * as path from "path";

export interface ExecutionRepository {
  save(execution: UniversalExecution): Promise<void>;
  get(executionId: string): Promise<UniversalExecution | null>;
  list(): Promise<UniversalExecution[]>;
  delete(executionId: string): Promise<void>;
}

// Helper functions for serializing/deserializing UniversalExecution
export function serializeExecution(execution: UniversalExecution): any {
  return {
    id: execution.executionId,
    executionId: execution.executionId,
    correlationId: execution.correlationId,
    parentExecutionId: execution.parentExecutionId || null,
    childExecutions: JSON.stringify(execution.childExecutions || []),
    status: execution.status,
    userContext: JSON.stringify(execution.userContext || {}),
    workspaceContext: execution.workspaceContext ? JSON.stringify(execution.workspaceContext) : null,
    projectContext: execution.projectContext ? JSON.stringify(execution.projectContext) : null,
    intent: JSON.stringify(execution.intent || {}),
    capability: JSON.stringify(execution.capability || {}),
    executionPlan: execution.executionPlan ? JSON.stringify(execution.executionPlan) : null,
    workflowReference: execution.workflowReference ? JSON.stringify(execution.workflowReference) : null,
    priority: execution.priority,
    createdAt: execution.createdAt,
    startedAt: execution.startedAt || null,
    endedAt: execution.endedAt || null,
    durationMs: execution.durationMs || null,
    error: execution.error || null,
    steps: JSON.stringify(execution.steps || []),
    artifacts: JSON.stringify(execution.artifacts || []),
    toolsUsed: JSON.stringify(execution.toolsUsed || []),
    retryCount: execution.retryCount,
    maxRetries: execution.maxRetries,
    metadata: JSON.stringify(execution.metadata || {}),
    telemetry: JSON.stringify(execution.telemetry || {}),
    costMetrics: JSON.stringify(execution.costMetrics || {}),
    timeline: JSON.stringify((execution as any).timeline || []),
  };
}

export function deserializeExecution(dbRecord: any): UniversalExecution {
  return {
    id: dbRecord.id,
    executionId: dbRecord.executionId,
    correlationId: dbRecord.correlationId,
    parentExecutionId: dbRecord.parentExecutionId || null,
    childExecutions: dbRecord.childExecutions ? JSON.parse(dbRecord.childExecutions) : [],
    status: dbRecord.status as any,
    userContext: dbRecord.userContext ? JSON.parse(dbRecord.userContext) : {},
    workspaceContext: dbRecord.workspaceContext ? JSON.parse(dbRecord.workspaceContext) : undefined,
    projectContext: dbRecord.projectContext ? JSON.parse(dbRecord.projectContext) : undefined,
    intent: dbRecord.intent ? JSON.parse(dbRecord.intent) : {},
    capability: dbRecord.capability ? JSON.parse(dbRecord.capability) : {},
    executionPlan: dbRecord.executionPlan ? JSON.parse(dbRecord.executionPlan) : null,
    workflowReference: dbRecord.workflowReference ? JSON.parse(dbRecord.workflowReference) : null,
    priority: dbRecord.priority as any,
    createdAt: dbRecord.createdAt,
    startedAt: dbRecord.startedAt || null,
    endedAt: dbRecord.endedAt || null,
    durationMs: dbRecord.durationMs || null,
    error: dbRecord.error || null,
    steps: dbRecord.steps ? JSON.parse(dbRecord.steps) : [],
    artifacts: dbRecord.artifacts ? JSON.parse(dbRecord.artifacts) : [],
    toolsUsed: dbRecord.toolsUsed ? JSON.parse(dbRecord.toolsUsed) : [],
    retryCount: dbRecord.retryCount,
    maxRetries: dbRecord.maxRetries,
    metadata: dbRecord.metadata ? JSON.parse(dbRecord.metadata) : {},
    telemetry: dbRecord.telemetry ? JSON.parse(dbRecord.telemetry) : {},
    costMetrics: dbRecord.costMetrics ? JSON.parse(dbRecord.costMetrics) : {},
    timeline: dbRecord.timeline ? JSON.parse(dbRecord.timeline) : [],
  } as any;
}

// 1. SQLite Target Implementation
export class SQLiteExecutionRepository implements ExecutionRepository {
  public async save(execution: UniversalExecution): Promise<void> {
    const data = serializeExecution(execution);
    await prisma.universalExecution.upsert({
      where: { executionId: execution.executionId },
      update: data,
      create: data,
    });
  }

  public async get(executionId: string): Promise<UniversalExecution | null> {
    const record = await prisma.universalExecution.findUnique({
      where: { executionId },
    });
    if (!record) return null;
    return deserializeExecution(record);
  }

  public async list(): Promise<UniversalExecution[]> {
    const records = await prisma.universalExecution.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeExecution);
  }

  public async delete(executionId: string): Promise<void> {
    await prisma.universalExecution.deleteMany({
      where: { executionId },
    });
  }
}

// 2. PostgreSQL Target Implementation
export class PostgresExecutionRepository implements ExecutionRepository {
  public async save(execution: UniversalExecution): Promise<void> {
    const data = serializeExecution(execution);
    await prisma.universalExecution.upsert({
      where: { executionId: execution.executionId },
      update: data,
      create: data,
    });
  }

  public async get(executionId: string): Promise<UniversalExecution | null> {
    const record = await prisma.universalExecution.findUnique({
      where: { executionId },
    });
    if (!record) return null;
    return deserializeExecution(record);
  }

  public async list(): Promise<UniversalExecution[]> {
    const records = await prisma.universalExecution.findMany({
      orderBy: { createdAt: "desc" },
    });
    return records.map(deserializeExecution);
  }

  public async delete(executionId: string): Promise<void> {
    await prisma.universalExecution.deleteMany({
      where: { executionId },
    });
  }
}

// 3. Memory Target Implementation (for tests)
export class MemoryExecutionRepository implements ExecutionRepository {
  private store = new Map<string, string>();

  public async save(execution: UniversalExecution): Promise<void> {
    // Clone to isolate references
    this.store.set(execution.executionId, JSON.stringify(execution));
  }

  public async get(executionId: string): Promise<UniversalExecution | null> {
    const data = this.store.get(executionId);
    if (!data) return null;
    return JSON.parse(data);
  }

  public async list(): Promise<UniversalExecution[]> {
    const list: UniversalExecution[] = [];
    for (const data of this.store.values()) {
      list.push(JSON.parse(data));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async delete(executionId: string): Promise<void> {
    this.store.delete(executionId);
  }
}

// 4. JSON Migration Adapter
export class JsonMigrationAdapter {
  public static async migrate(repo: ExecutionRepository): Promise<void> {
    const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
    const jsonPath = path.resolve(dbDir, "executions.json");

    if (fs.existsSync(jsonPath)) {
      try {
        console.log(`[JsonMigrationAdapter] Legacy executions file found. Migrating data to active repository...`);
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const list = JSON.parse(raw) as UniversalExecution[];
        let count = 0;
        for (const item of list) {
          await repo.save(item);
          count++;
        }
        console.log(`[JsonMigrationAdapter] Successfully migrated ${count} execution records.`);
        
        // Backup / Rename JSON file
        const backupPath = jsonPath + ".bak";
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
        fs.renameSync(jsonPath, backupPath);
        console.log(`[JsonMigrationAdapter] Renamed legacy executions.json to .bak.`);
      } catch (err: any) {
        console.error(`[JsonMigrationAdapter] Migration failed:`, err.message);
      }
    }
  }
}
