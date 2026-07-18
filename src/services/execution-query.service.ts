// src/services/execution-query.service.ts
// Decoupled query layer service for searching, analyzing, and formatting executions metadata and graph dependencies

import { executionRuntimeService, UniversalExecution, TimelineEntry } from "./execution-runtime.service";
import { workflowRepository } from "../repositories/workflow.repository";
import prisma from "../infrastructure/db/prisma";

export interface ExecutionQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  agentId?: string;
  workflowId?: string;
}

export interface ExecutionGraphNode {
  id: string;
  label: string;
  type: string;
  status: string;
}

export interface ExecutionGraphEdge {
  from: string;
  to: string;
}

export interface ExecutionGraph {
  nodes: ExecutionGraphNode[];
  edges: ExecutionGraphEdge[];
}

export class ExecutionQueryService {
  private static instance: ExecutionQueryService | null = null;

  private constructor() {}

  public static getInstance(): ExecutionQueryService {
    if (!ExecutionQueryService.instance) {
      ExecutionQueryService.instance = new ExecutionQueryService();
    }
    return ExecutionQueryService.instance;
  }

  /**
   * Retrieves full execution history from all sources: task_runs, workflow executions, and universal executions.
   */
  public async getExecutionHistory(options: ExecutionQueryOptions = {}): Promise<{ executions: any[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 15;
    const search = options.search?.toLowerCase() || "";
    const statusFilter = options.status || "";
    const agentFilter = options.agentId || "";
    const workflowFilter = options.workflowId || "";

    const executions: any[] = [];

    // 1. Fetch from task_runs table (direct SQLite query if exists)
    try {
      const dbPath = process.env.DATABASE_URL || "";
      if (dbPath.includes("aegisos.sqlite")) {
        const { DatabaseSync } = require("node:sqlite");
        const cleanPath = dbPath.replace("file:", "");
        const db = new DatabaseSync(cleanPath);
        const rows = db.prepare("SELECT * FROM task_runs ORDER BY created_at DESC").all();
        for (const r of rows) {
          const durationMs = r.ended_at && r.started_at ? r.ended_at - r.started_at : undefined;
          executions.push({
            id: r.task_id,
            conversationId: `execution-${r.task_id}`,
            workflowId: r.runtime === "workflow" ? "audit" : undefined,
            agentId: r.agent_id,
            task: r.task || "",
            status: r.status as any,
            createdAt: new Date(r.created_at).toISOString(),
            startedAt: r.startedAt ? new Date(r.started_at).toISOString() : undefined,
            endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : undefined,
            durationMs,
            error: r.error || undefined,
            retryCount: 0,
            metadata: { runtime: r.runtime, terminal_summary: r.terminal_summary },
          });
        }
      }
    } catch (err) {
      // Fallback silently if task_runs is not initialized
    }

    // 2. Fetch from workflow executions
    try {
      const wfExecs = await workflowRepository.getExecutions();
      for (const r of wfExecs) {
        executions.push({
          id: r.id,
          conversationId: r.conversationId || `wf-exec-${r.id}`,
          workflowId: r.workflowId,
          agentId: "workflows",
          task: `Workflow Pipeline: ${r.workflowName}`,
          status: r.status === "succeeded" ? "succeeded" : r.status === "failed" ? "failed" : r.status === "running" ? "running" : r.status === "queued" ? "queued" : "running",
          createdAt: r.createdAt,
          startedAt: r.startedAt,
          endedAt: r.endedAt,
          durationMs: r.durationMs,
          error: r.error,
          retryCount: r.retryCount,
          metadata: r.metadata,
        });
      }
    } catch (err) {
      console.error("[ExecutionQueryService] Failed to load workflow executions:", err);
    }

    // 3. Fetch from Universal executions
    try {
      const universalExecs = await executionRuntimeService.listHistory();
      for (const r of universalExecs) {
        executions.push({
          id: r.executionId,
          conversationId: r.metadata.conversationId || `execution-${r.executionId}`,
          workflowId: r.workflowReference?.workflowId || undefined,
          agentId: r.workflowReference?.workflowId ? "workflows" : "assistant",
          task: r.intent.rawPrompt,
          status: r.status === "COMPLETED" ? "succeeded" : r.status === "FAILED" ? "failed" : r.status === "RUNNING" ? "running" : r.status === "QUEUED" ? "queued" : "running",
          createdAt: r.createdAt,
          startedAt: r.startedAt || undefined,
          endedAt: r.endedAt || undefined,
          durationMs: r.durationMs || undefined,
          error: r.error || undefined,
          retryCount: r.retryCount,
          metadata: r.metadata,
        });
      }
    } catch (err) {
      console.error("[ExecutionQueryService] Failed to load universal executions:", err);
    }

    // Apply Filter & Search
    let filtered = executions;
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.id.toLowerCase().includes(search) ||
          e.task.toLowerCase().includes(search) ||
          (e.error && e.error.toLowerCase().includes(search))
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }
    if (agentFilter) {
      filtered = filtered.filter((e) => e.agentId === agentFilter);
    }
    if (workflowFilter) {
      filtered = filtered.filter((e) => e.workflowId === workflowFilter);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      executions: paginated,
      total,
    };
  }

  /**
   * Search executions using a text query.
   */
  public async searchExecutions(query: string): Promise<any[]> {
    const res = await this.getExecutionHistory({ search: query, limit: 100 });
    return res.executions;
  }

  /**
   * Returns the absolute timeline for a universal execution.
   */
  public async getExecutionTimeline(executionId: string): Promise<TimelineEntry[]> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return [];
    return execution.timeline || [];
  }

  /**
   * Returns performance and cost metrics for an execution.
   */
  public async getExecutionMetrics(executionId: string): Promise<UniversalExecution["costMetrics"] | null> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return null;
    return execution.costMetrics;
  }

  /**
   * Returns the DAG representation of the execution plan nodes and dependencies.
   */
  public async getExecutionGraph(executionId: string): Promise<ExecutionGraph> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.executionPlan) {
      return { nodes: [], edges: [] };
    }

    const plan = execution.executionPlan;
    const nodes: ExecutionGraphNode[] = (plan.steps || []).map((s: any) => ({
      id: s.id || s.stepId || `node-${s.name}`,
      label: s.name,
      type: s.commandType || "task",
      status: s.status || "pending",
    }));

    const edges: ExecutionGraphEdge[] = [];
    // Generate simple sequential or dependency edges
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
      });
    }

    return { nodes, edges };
  }

  /**
   * Returns the current status of an execution.
   */
  public async getExecutionStatus(executionId: string): Promise<UniversalExecution["status"] | null> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return null;
    return execution.status;
  }

  /**
   * Returns parent and children tree for an execution.
   */
  public async getExecutionTree(executionId: string): Promise<{ executionId: string; parentId: string | null; children: string[] } | null> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return null;
    return {
      executionId: execution.executionId,
      parentId: execution.parentExecutionId,
      children: execution.childExecutions || [],
    };
  }

  /**
   * Returns the execution dependencies list.
   */
  public async getExecutionDependencies(executionId: string): Promise<string[]> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return [];
    const deps: string[] = [];
    if (execution.parentExecutionId) {
      deps.push(execution.parentExecutionId);
    }
    return deps;
  }
}

export const executionQueryService = ExecutionQueryService.getInstance();
export default executionQueryService;
