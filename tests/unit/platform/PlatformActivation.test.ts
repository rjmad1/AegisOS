import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import { workflowService } from "@/services/workflow.service";
import { engineeringIntelligenceService } from "@/services/engineering-intelligence.service";
import { POST as reliabilityPost } from "@/app/api/v1/reliability/route";
import { POST as optimizationPost } from "@/app/api/v1/optimization/route";
import { POST as diagnosticsPost } from "@/app/api/v1/diagnostics/route";
import { POST as penetrationPost } from "@/app/api/v1/security/penetration/route";
import { MemoryExecutionRepository } from "@/repositories/execution.repository";
import { workflowRepository } from "@/repositories/workflow.repository";
import { skillOptService } from "@/infrastructure/optimization/skillopt-service";

describe("Universal Execution Platform Activation & Unification Tests", () => {
  const testUser = { id: "test-user-id", role: "admin" };

  beforeEach(() => {
    executionRuntimeService.setRepository(new MemoryExecutionRepository());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Workflow trigger wrapping
  it("should intercept workflow trigger and route it through ExecutionRuntimeService", async () => {
    // Mock getWorkflow
    vi.spyOn(workflowRepository, "getWorkflow").mockResolvedValue({
      id: "wf-test-id",
      name: "Test Workflow",
      status: "active",
      version: "1.0",
      nodes: [{ id: "start", type: "trigger" }]
    } as any);

    // Mock the actual triggerWorkflow to prevent real background worker enqueuing
    const mockWfExec = { id: "wf-exec-123", status: "succeeded", logs: [], steps: [] };
    vi.spyOn(workflowRepository, "getExecution").mockResolvedValue(mockWfExec as any);
    const originalTrigger = workflowService.triggerWorkflow;
    
    vi.spyOn(workflowService, "triggerWorkflow").mockImplementation(async (id, vars, src) => {
      if (src === "execution-runtime") {
        return mockWfExec as any;
      }
      return originalTrigger.call(workflowService, id, vars, src);
    });

    // We trigger the workflow with source !== "execution-runtime"
    const res = await workflowService.triggerWorkflow("wf-test-id", {}, "external-trigger");
    expect(res).toBeDefined();
    expect(res.id).toBe("wf-exec-123");

    // The execution should be logged in the Universal Execution Runtime
    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].capability.capabilityId).toBe("cap-workflow-exec");
    expect(history[0].workflowReference?.workflowId).toBe("wf-test-id");
    expect(history[0].workflowReference?.runId).toBe("wf-exec-123");
  });

  // 2. Engineering Intelligence wrapping
  it("should wrap engineering intelligence run in Universal Execution context", async () => {
    const summary = await engineeringIntelligenceService.runIntelligenceAnalysis();
    expect(summary).toBeDefined();

    // Verify it created a Universal Execution
    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].intent.rawPrompt).toContain("Engineering Intelligence Platform Analysis");
    expect(history[0].status).toBe("COMPLETED");
  });

  // 3. SRE Actions wrapping
  it("should route SRE reliability actions through ExecutionRuntimeService", async () => {
    const req = new NextRequest("http://localhost/api/v1/reliability", {
      method: "POST",
      body: JSON.stringify({ action: "failover_drill" })
    });

    const res = await reliabilityPost(req);
    expect(res.status).toBe(200);

    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].intent.rawPrompt).toContain("SRE Action: failover_drill");
    expect(history[0].status).toBe("COMPLETED");
  });

  // 4. Prompt Optimization wrapping
  it("should route prompt optimization actions through ExecutionRuntimeService", async () => {
    // Mock skillOptService.optimizePrompt
    vi.spyOn(skillOptService, "optimizePrompt").mockResolvedValue({
      id: "draft-123",
      name: "system:assistant",
      optimizedContent: "optimized content",
      status: "pending"
    } as any);

    const req = new NextRequest("http://localhost/api/v1/optimization", {
      method: "POST",
      body: JSON.stringify({ action: "optimize", name: "system:assistant" })
    });

    const res = await optimizationPost(req);
    expect(res.status).toBe(201);

    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].intent.rawPrompt).toContain("Optimization Action: optimize");
    expect(history[0].status).toBe("COMPLETED");
  });

  // 5. Self-Healing Diagnostics wrapping
  it("should route self-healing diagnostics through ExecutionRuntimeService", async () => {
    const req = new NextRequest("http://localhost/api/v1/diagnostics", {
      method: "POST"
    });

    const res = await diagnosticsPost();
    expect(res.status).toBe(200);

    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].intent.rawPrompt).toContain("diagnostics and self-healing cycle");
    expect(history[0].status).toBe("COMPLETED");
  });

  // 6. Security Penetration validation wrapping
  it("should route security penetration runs through ExecutionRuntimeService", async () => {
    const res = await penetrationPost();
    expect(res.status).toBe(200);

    const history = await executionRuntimeService.listHistory();
    expect(history.length).toBe(1);
    expect(history[0].intent.rawPrompt).toContain("Security Penetration Scan Suite");
    expect(history[0].status).toBe("COMPLETED");
  });
});
