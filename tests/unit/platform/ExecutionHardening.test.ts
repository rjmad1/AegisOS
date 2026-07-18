import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/infrastructure/db/prisma";
import { executionRuntimeService, UniversalExecution } from "@/services/execution-runtime.service";
import {
  MemoryExecutionRepository,
  SQLiteExecutionRepository,
} from "@/repositories/execution.repository";
import { executionEventPublisher } from "@/infrastructure/events/execution-event-publisher";
import { metricsPlatform } from "@/infrastructure/observability/metrics-platform";
import { workflowService } from "@/services/workflow.service";

describe("Execution Runtime Infrastructure Hardening Tests", () => {
  const testUser = { userId: "test-user-id", role: "admin" };

  beforeEach(async () => {
    // Keep a memory repository for isolated execution runtime tests
    executionRuntimeService.setRepository(new MemoryExecutionRepository());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Repository Tests
  describe("Repository Implementations", () => {
    it("should save and retrieve executions from MemoryExecutionRepository", async () => {
      const repo = new MemoryExecutionRepository();
      const execution = await executionRuntimeService.createExecution("Test prompt", testUser);
      
      await repo.save(execution);
      const retrieved = await repo.get(execution.executionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.executionId).toBe(execution.executionId);
      expect(retrieved?.intent.rawPrompt).toBe("Test prompt");

      const list = await repo.list();
      expect(list.length).toBe(1);
    });

    it("should save and retrieve executions from SQLiteExecutionRepository", async () => {
      const repo = new SQLiteExecutionRepository();
      const execution = await executionRuntimeService.createExecution("Test prompt SQLite", testUser);

      // Clean up previous database record if any
      try {
        await repo.delete(execution.executionId);
      } catch (err) {}

      await repo.save(execution);
      const retrieved = await repo.get(execution.executionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.executionId).toBe(execution.executionId);
      expect(retrieved?.intent.rawPrompt).toBe("Test prompt SQLite");

      const list = await repo.list();
      expect(list.some(e => e.executionId === execution.executionId)).toBe(true);

      // Clean up
      await repo.delete(execution.executionId);
    });
  });

  // 2. Timeline Logging Tests
  describe("Execution Timeline", () => {
    it("should automatically log creation and planning to timeline", async () => {
      const execution = await executionRuntimeService.createExecution("Test timeline", testUser);
      
      expect(execution.timeline).toBeDefined();
      expect(execution.timeline.length).toBe(2);
      expect(execution.timeline[0].event).toBe("Created");
      expect(execution.timeline[1].event).toBe("Planned");
    });

    it("should log Validation, Started, and Completion events on execution lifecycle", async () => {
      const execution = await executionRuntimeService.createExecution("show gpu usage", testUser);
      
      const isValid = await executionRuntimeService.validateExecution(execution.executionId);
      expect(isValid).toBe(true);
      
      const runExec = await executionRuntimeService.execute(execution.executionId);
      expect(runExec.status).toBe("COMPLETED");

      const updated = await executionRuntimeService.getExecution(execution.executionId);
      const events = updated?.timeline.map(t => t.event) || [];
      expect(events).toContain("Created");
      expect(events).toContain("Planned");
      expect(events).toContain("Validated");
      expect(events).toContain("Started");
      expect(events).toContain("Completed");

      // Verify duration and actor are recorded
      const completedEvent = updated?.timeline.find(t => t.event === "Completed");
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.actor).toBe("system:executor");
      expect(completedEvent?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // 3. Telemetry and Metrics Tests
  describe("Observability & Metrics", () => {
    it("should register custom execution metrics and record points in metricsPlatform", async () => {
      const execution = await executionRuntimeService.createExecution("explain why memory usage is high", testUser);
      
      await executionRuntimeService.validateExecution(execution.executionId);
      await executionRuntimeService.execute(execution.executionId);

      const latestQueueTime = metricsPlatform.getLatestValue("execution_queue_time_ms");
      const latestPlanningTime = metricsPlatform.getLatestValue("execution_planning_time_ms");
      const latestExecutionTime = metricsPlatform.getLatestValue("execution_time_ms");

      expect(latestQueueTime).toBeGreaterThanOrEqual(0);
      expect(latestPlanningTime).toBeGreaterThan(0);
      expect(latestExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  // 4. Recovery & Crash Recovery Tests
  describe("Execution Recovery", () => {
    it("should resume executing WAITING/RUNNING tasks from checkpoints on recovery", async () => {
      const execution = await executionRuntimeService.createExecution("show gpu usage", testUser);
      
      // Simulate checkpointing
      await executionRuntimeService.checkpoint(execution.executionId, "fetch_stage", { pageIndex: 2 });
      
      const paused = await executionRuntimeService.getExecution(execution.executionId);
      expect(paused?.status).toBe("WAITING");
      expect(paused?.metadata.checkpointStage).toBe("fetch_stage");
      expect(paused?.metadata.checkpointState.pageIndex).toBe(2);

      // Trigger recovery
      await executionRuntimeService.recoverActiveExecutions();
      
      // The recovery should run the execution to completion
      const completed = await executionRuntimeService.getExecution(execution.executionId);
      expect(completed?.status).toBe("COMPLETED");
      expect(completed?.timeline.map(t => t.event)).toContain("Recovered");
    });
  });

  // 5. Retries and Compensations
  describe("Retries & Saga Compensations", () => {
    it("should retry executions on transient failures and fail after max retries", async () => {
      const execution = await executionRuntimeService.createExecution("Show overnight timeline", testUser, { workflowId: "some-workflow" });
      execution.maxRetries = 2; // Test fast
      if (execution.metadata?.executionGraph) {
        for (const node of execution.metadata.executionGraph.nodes) {
          node.maxRetries = 2;
        }
      }
      await (executionRuntimeService as any).repository.save(execution);

      // Mock workflowService.triggerWorkflow to simulate failure
      vi.spyOn(workflowService, "triggerWorkflow").mockRejectedValue(new Error("Local model connection refused"));

      await executionRuntimeService.execute(execution.executionId);

      const failed = await executionRuntimeService.getExecution(execution.executionId);
      expect(failed?.status).toBe("FAILED");
      expect(failed?.retryCount).toBe(2);
      expect(failed?.timeline.map(t => t.event)).toContain("Retry");
    }, 15000);

    it("should cancel execution and trigger compensations", async () => {
      const execution = await executionRuntimeService.createExecution("show gpu usage", testUser);
      
      const cancelled = await executionRuntimeService.cancelExecution(execution.executionId, "User clicked cancel button");
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.timeline.map(t => t.event)).toContain("Cancelled");
    });
  });

  // 6. Concurrency Tests
  describe("Concurrency Safety", () => {
    it("should handle multiple concurrent execution requests without collisions", async () => {
      const repo = new SQLiteExecutionRepository();
      executionRuntimeService.setRepository(repo);

      const prompts = ["Show GPU usage", "explain why memory usage is high", "optimize VRAM"];
      const runs = prompts.map(prompt => 
        executionRuntimeService.createExecution(prompt, testUser)
          .then(e => executionRuntimeService.validateExecution(e.executionId).then(() => e))
          .then(e => executionRuntimeService.execute(e.executionId))
      );

      const results = await Promise.all(runs);
      expect(results.length).toBe(3);
      for (const res of results) {
        expect(res.status).toBe("COMPLETED");
        // Clean up database
        await repo.delete(res.executionId);
      }
    });
  });
});
