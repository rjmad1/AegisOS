import { describe, it, expect, beforeEach } from "vitest";
import prisma from "@/infrastructure/db/prisma";
import { AIRuntimeKernel } from "../AIRuntimeKernel";
import { ModelRuntime } from "../ModelRuntime";
import { PromptRuntime } from "../PromptRuntime";
import { MemoryPlatform } from "../MemoryPlatform";
import { KnowledgeRuntime } from "../KnowledgeRuntime";
import { ToolRuntime } from "../ToolRuntime";
import { WorkflowRuntime } from "../WorkflowRuntime";
import { AgentRuntime } from "../AgentRuntime";
import { MultiAgentOrchestrator } from "../MultiAgentOrchestrator";
import { ReasoningEngine } from "../ReasoningEngine";
import { PlanningEngine } from "../PlanningEngine";
import { EvaluationPlatform } from "../EvaluationPlatform";
import { HumanCollaborationLayer } from "../HumanCollaborationLayer";
import { AIMarketplace } from "../AIMarketplace";
import { AIOperationsDashboard } from "../AIOperationsDashboard";
import { RuntimeHealthFramework } from "../RuntimeHealthFramework";
import { AIRuntimeValidationSuite } from "../AIRuntimeValidationSuite";
import { AIRuntimeReadinessReport } from "../AIRuntimeReadinessReport";
import { AIRuntimeTechnicalDebtRegister } from "../AIRuntimeTechnicalDebtRegister";

describe("AI Runtime Platform Integration Suite", () => {
  let kernel: AIRuntimeKernel;

  beforeEach(async () => {
    kernel = AIRuntimeKernel.getInstance();
    AIOperationsDashboard.getInstance().resetMetrics();
    ModelRuntime.getInstance().reset();
    await prisma.evaluationScorecard.deleteMany({});
  });

  // 1. AI Runtime Kernel
  it("should process requests through the unified AI Runtime Kernel", async () => {
    const request = {
      prompt: "Explain how Platform Kernel works.",
      options: { enableRag: true },
    };
    const response = await kernel.execute(request);
    
    expect(response.content).toBeDefined();
    expect(response.model).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    expect(response.traceId).toBeDefined();
    expect(response.correlationId).toBeDefined();
  });

  // 2. Model Router & Fallbacks
  it("should route to correct model based on policies (latency, cost, direct)", async () => {
    const modelRuntime = ModelRuntime.getInstance();
    
    // Test direct policy with primary
    const directModel = await modelRuntime.route("Hello", "policy:default");
    expect(directModel.id).toBe("ollama:gemma2:9b");

    // Test latency policy
    const latencyModel = await modelRuntime.route("Hello", "policy:latency-optimized");
    expect(latencyModel.id).toBe("ollama:llama3.1:8b");

    // Test cost policy
    const costModel = await modelRuntime.route("Hello", "policy:cost-optimized");
    expect(costModel.id).toBe("ollama:gemma2:9b"); // Local free models cost 0.0
  });

  // 3. Prompt Template Composition & Versioning
  it("should compose templates with variable substitution and support rollback", () => {
    const promptRuntime = PromptRuntime.getInstance();
    
    const composed = promptRuntime.compose("prompt:system:base", { date: "2026-07-13" });
    expect(composed).toContain("2026-07-13");

    // Versioning
    promptRuntime.createVersion("prompt:system:base", "1.0.1", "Updated Base Prompt: {date}", "test");
    const updated = promptRuntime.compose("prompt:system:base", { date: "2026-07-14" });
    expect(updated).toContain("Updated Base Prompt: 2026-07-14");

    // Rollback
    promptRuntime.rollback("prompt:system:base", "1.0.0");
    const reverted = promptRuntime.compose("prompt:system:base", { date: "2026-07-13" });
    expect(reverted).toContain("You are a professional assistant operating within the Enterprise AI Platform.");
  });

  // 4. Memory Platforms & Expiration
  it("should store, retrieve, and evict expired memories", async () => {
    const memoryPlatform = MemoryPlatform.getInstance();
    const tempId = "mem:temp:test-id";

    await memoryPlatform.store({
      id: tempId,
      domain: "working",
      ownerId: "usr-admin-01",
      content: "Temp secret token",
      confidence: 1.0,
      timestamp: Date.now() - 10000, // 10s ago
      importance: 5,
      ttlMs: 5000, // 5s TTL (already expired)
    });

    const val = memoryPlatform.getEntry(tempId);
    expect(val).toBeUndefined(); // Should be evicted on access
  });

  // 5. Knowledge Hybrid Search & Graph Connections
  it("should perform hybrid search combining keywords, tags and graph context", async () => {
    const knowledge = KnowledgeRuntime.getInstance();
    
    const results = await knowledge.queryHybrid("security routing gateway");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("know:api:v1");
  });

  // 6. Tool Sandbox Guardrails
  it("should enforce RBAC permissions and simulated sandboxing on tool execution", async () => {
    const tools = ToolRuntime.getInstance();
    
    // Should fail with permission error for non-admin user
    await expect(
      tools.executeTool(
        "tool:filesystem:write",
        { path: "/tmp/out.txt", content: "test" },
        { correlationId: "c1", traceId: "t1", userId: "usr-viewer-01", role: "reviewer", timestamp: Date.now() }
      )
    ).rejects.toThrow("Access denied");
  });

  // 7. Workflow Saga Rollback & Compensations
  it("should coordinate Saga compensation steps on execution failures", async () => {
    const workflows = WorkflowRuntime.getInstance();
    
    const exec = await workflows.startExecution("wf:workspace-audit", { failOnStep: "step-2-validate" });
    const finalState = await workflows.runWorkflow(exec.id);

    expect(finalState.status).toBe("compensated");
    expect(finalState.stepResults["step-2-rollback"]?.compensated).toBe(true);
  });

  // 8. Agent Isolation & Multi-Agent Collaboration
  it("should orchestrate hierarchical agent workflows using MultiAgentOrchestrator", async () => {
    const orchestrator = MultiAgentOrchestrator.getInstance();
    const ctx = { correlationId: "c1", traceId: "t1", timestamp: Date.now() };

    const report = await orchestrator.orchestrateHierarchical("Verify workspace fitness", ctx);
    expect(report).toContain("HIERARCHICAL TASK RESOLUTION REPORT");
    expect(report).toContain("Safety & Quality Review");
  });

  // 9. Reasoning ToT and debate
  it("should execute Tree of Thought reasoning search and debates", async () => {
    const reasoning = ReasoningEngine.getInstance();
    
    const totRes = await reasoning.treeOfThought("Deploy checklist optimization");
    expect(totRes.finalThought).toBeDefined();
    expect(totRes.tree.length).toBeGreaterThan(1);

    const debateRes = await reasoning.debate("Immediate deployment");
    expect(debateRes).toContain("Consensus:");
  });

  // 10. Planning task decomposition
  it("should plan step paths and trigger recovery plans on failure", async () => {
    const planning = PlanningEngine.getInstance();
    const originalPlan = await planning.createPlan("Verify SRE compliance", ["tool:web:search"]);
    
    expect(originalPlan.steps.length).toBe(3);

    const recoveryPlan = await planning.planRecovery("plan-step-2", originalPlan);
    expect(recoveryPlan.steps.some((s) => s.id.includes("recovery"))).toBe(true);
  });

  // 11. Validation Suite Exec
  it("should run validation checks and compile successful scorecards", async () => {
    const suite = AIRuntimeValidationSuite.getInstance();
    const res = await suite.runValidation();

    expect(res.clean).toBe(true);
    expect(res.scorecard.length).toBe(6);
    expect(res.scorecard.every((s) => s.status === "pass")).toBe(true);
  });

  // 12. Readiness and Tech Debt Reports
  it("should generate readiness reports and manage technical debt logs", () => {
    const report = AIRuntimeReadinessReport.getInstance().generate();
    expect(report).toContain("EXCELLENT (96/100 Readiness Score)");

    const debt = AIRuntimeTechnicalDebtRegister.getInstance().getLedger();
    expect(debt.length).toBe(3);
  });
});
