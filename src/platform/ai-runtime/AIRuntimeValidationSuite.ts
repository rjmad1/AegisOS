import { ModelRuntime } from "./ModelRuntime";
import { PromptRuntime } from "./PromptRuntime";
import { MemoryPlatform } from "./MemoryPlatform";
import { ToolRuntime } from "./ToolRuntime";
import { WorkflowRuntime } from "./WorkflowRuntime";
import { AgentRuntime } from "./AgentRuntime";

export class AIRuntimeValidationSuite {
  private static instance: AIRuntimeValidationSuite | null = null;

  private constructor() {}

  public static getInstance(): AIRuntimeValidationSuite {
    if (!AIRuntimeValidationSuite.instance) {
      AIRuntimeValidationSuite.instance = new AIRuntimeValidationSuite();
    }
    return AIRuntimeValidationSuite.instance;
  }

  /**
   * Runs validation checks across all subsystems and outputs a scorecard.
   */
  public async runValidation(): Promise<{ clean: boolean; scorecard: { name: string; status: "pass" | "fail"; details?: string }[] }> {
    const scorecard: { name: string; status: "pass" | "fail"; details?: string }[] = [];
    let clean = true;

    // 1. Model Routing Verification
    try {
      const modelRuntime = ModelRuntime.getInstance();
      const routed = await modelRuntime.route("Hello world", "policy:latency-optimized");
      if (routed && routed.id === "ollama:llama3.1:8b") {
        scorecard.push({ name: "Model Routing Strategies (Latency Optimized)", status: "pass" });
      } else {
        throw new Error("Model Routing resolved incorrect target model");
      }
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Model Routing Strategies (Latency Optimized)", status: "fail", details: err.message });
    }

    // 2. Prompt Platform Variable Injection
    try {
      const promptRuntime = PromptRuntime.getInstance();
      const composed = promptRuntime.compose("prompt:system:base", { date: "2026-07-13" });
      if (composed.includes("2026-07-13")) {
        scorecard.push({ name: "Prompt Variable Compilation & Composition", status: "pass" });
      } else {
        throw new Error("Prompt composition failed to inject date variable");
      }
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Prompt Variable Compilation & Composition", status: "fail", details: err.message });
    }

    // 3. Memory Platform Storage and Retrieval
    try {
      const memoryPlatform = MemoryPlatform.getInstance();
      const testId = `mem:test:${Date.now()}`;
      await memoryPlatform.store({
        id: testId,
        domain: "working",
        ownerId: "usr-admin-01",
        content: "Validation test variable value is ABC.",
        confidence: 1.0,
        timestamp: Date.now(),
        importance: 10,
        ttlMs: 5000,
      });

      const retrieved = await memoryPlatform.retrieve("working", "ABC", "usr-admin-01");
      if (retrieved.length > 0 && retrieved[0].id === testId) {
        scorecard.push({ name: "Memory Registry & Retrieve Scoring", status: "pass" });
      } else {
        throw new Error("Failed to retrieve stored memory node");
      }
      memoryPlatform.deleteEntry(testId); // cleanup
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Memory Registry & Retrieve Scoring", status: "fail", details: err.message });
    }

    // 4. Tool Execution RBAC Enforcement
    try {
      const toolRuntime = ToolRuntime.getInstance();
      
      // Admin should pass
      await toolRuntime.executeTool("tool:filesystem:read", { path: "/test" }, { correlationId: "c1", traceId: "t1", userId: "usr-admin-01", role: "administrator", timestamp: Date.now() });

      // Non-admin should be blocked on filesystem write
      let blocked = false;
      try {
        await toolRuntime.executeTool(
          "tool:filesystem:write",
          { path: "/test", content: "ABC" },
          { correlationId: "c1", traceId: "t1", userId: "usr-viewer-01", role: "reviewer", timestamp: Date.now() }
        );
      } catch {
        blocked = true; // Expected behavior
      }

      if (blocked) {
        scorecard.push({ name: "Tool Sandbox Security & RBAC Guardrails", status: "pass" });
      } else {
        throw new Error("Tool platform failed to block unauthorized user role on write operation");
      }
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Tool Sandbox Security & RBAC Guardrails", status: "fail", details: err.message });
    }

    // 5. Workflow Saga Compensation Execution
    try {
      const workflowRuntime = WorkflowRuntime.getInstance();
      const exec = await workflowRuntime.startExecution("wf:workspace-audit", { failOnStep: "step-2-validate" });
      const finalState = await workflowRuntime.runWorkflow(exec.id);

      if (finalState.status === "compensated" && finalState.stepResults["step-2-rollback"]?.compensated === true) {
        scorecard.push({ name: "Workflow State Engine & Saga Compensation", status: "pass" });
      } else {
        throw new Error("Workflow execution did not run expected rollback compensation step");
      }
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Workflow State Engine & Saga Compensation", status: "fail", details: err.message });
    }

    // 6. Agent Isolation & Supervisor Routing
    try {
      const agentRuntime = AgentRuntime.getInstance();
      await agentRuntime.startAgent("agent:research", "Scan security guides");
      
      scorecard.push({ name: "Agent Sandbox Task routing", status: "pass" });
    } catch (err: any) {
      clean = false;
      scorecard.push({ name: "Agent Sandbox Task routing", status: "fail", details: err.message });
    }

    console.log(`[AIRuntimeValidationSuite] Completed validation run. Clean: ${clean}`);
    return { clean, scorecard };
  }
}
export default AIRuntimeValidationSuite;
