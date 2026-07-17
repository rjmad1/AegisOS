// src/platform/control/ExecutiveControlPlane.ts
import * as crypto from "crypto";
import { AIRequest, AIResponse, AIRuntimeContext } from "../ai-runtime/types";
import { aiRuntimeKernel } from "../ai-runtime/AIRuntimeKernel";
import { eventPlatform } from "../event-bus/EventPlatform";
import { policyEnforcer } from "../../infrastructure/security/policy-enforcer";
import prisma from "../../infrastructure/db/prisma";
import { metricsPlatform } from "../../infrastructure/observability/metrics-platform";
import { ModelRuntime } from "../ai-runtime/ModelRuntime";
import { AgentRuntime } from "../ai-runtime/AgentRuntime";
import { EvaluationPlatform } from "../ai-runtime/EvaluationPlatform";
import { KnowledgeRuntime } from "../ai-runtime/KnowledgeRuntime";
import { MemoryPlatform } from "../ai-runtime/MemoryPlatform";
import { WorkflowRuntime } from "../ai-runtime/WorkflowRuntime";
import { RuntimeHealthFramework } from "../ai-runtime/RuntimeHealthFramework";

export class ExecutiveControlPlane {
  private static instance: ExecutiveControlPlane | null = null;
  private readonly models = ModelRuntime.getInstance();
  private readonly agents = AgentRuntime.getInstance();
  private readonly workflows = WorkflowRuntime.getInstance();
  private readonly knowledge = KnowledgeRuntime.getInstance();
  private readonly memories = MemoryPlatform.getInstance();
  private readonly evaluation = EvaluationPlatform.getInstance();
  private readonly health = RuntimeHealthFramework.getInstance();

  private constructor() {}

  public static getInstance(): ExecutiveControlPlane {
    if (!ExecutiveControlPlane.instance) {
      ExecutiveControlPlane.instance = new ExecutiveControlPlane();
    }
    return ExecutiveControlPlane.instance;
  }

  public async execute(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();
    const correlationId = request.context?.correlationId || `corr-${crypto.randomUUID().slice(0, 8)}`;
    const traceId = request.context?.traceId || `trace-${crypto.randomUUID().slice(0, 8)}`;
    const ctx: AIRuntimeContext = {
      correlationId,
      traceId,
      userId: request.context?.userId || "usr-admin-01",
      role: request.context?.role || "administrator",
      timestamp: Date.now(),
    };

    // 1. Publish Ingress Event
    await eventPlatform.publish({
      name: "RequestReceived",
      source: "executive-control-plane",
      version: "v1",
      priority: "medium",
      securityClassification: "public",
      retentionPolicy: "session",
      payload: {
        userId: ctx.userId,
        promptLength: request.prompt.length,
        intentClass: request.agentId ? "agent" : request.workflowId ? "workflow" : "model",
        correlationId,
        traceId
      }
    });

    // 2. Security and Policy Validation
    const sanitizedPrompt = policyEnforcer.maskPII(request.prompt);
    const hasInjection = policyEnforcer.containsInjection(sanitizedPrompt);
    if (hasInjection) {
      await eventPlatform.publish({
        name: "PolicyViolationDetected",
        source: "executive-control-plane",
        version: "v1",
        priority: "critical",
        securityClassification: "restricted",
        retentionPolicy: "archive",
        payload: {
          ruleId: "PROMPT_INJECTION",
          violationText: "Prompt injection attempt detected.",
          promptSnippet: sanitizedPrompt.slice(0, 100),
          correlationId,
          traceId
        }
      });
      metricsPlatform.counter("ai_jailbreak_attempts_total", 1);
      throw new Error("ExecutiveControlPlane: Request blocked due to prompt injection violation.");
    }

    // 3. Budget Limits Check
    const userRole = ctx.role;
    const userBudgetLimit = userRole === 'administrator' || userRole === 'admin' ? 100.00 : 5.00;
    const currentAccumulatedCost = metricsPlatform.getLatestValue("ai_cost_usd_accumulated") || 0;
    if (currentAccumulatedCost > userBudgetLimit) {
      throw new Error(`ExecutiveControlPlane: Request blocked. User budget limit of $${userBudgetLimit} exceeded. Current accumulated billing cost: $${currentAccumulatedCost}`);
    }

    // 4. Intent & Business Objective Resolution
    const businessObjective = this.resolveBusinessObjective(sanitizedPrompt);
    await eventPlatform.publish({
      name: "IntentResolved",
      source: "executive-control-plane",
      version: "v1",
      priority: "medium",
      payload: {
        businessObjective,
        correlationId,
        traceId
      }
    });

    // 5. Agent & Model Governance Verification
    if (request.agentId) {
      const agent = this.agents.getAgent(request.agentId);
      if (!agent) {
        throw new Error(`ExecutiveControlPlane: Selected agent "${request.agentId}" is not registered.`);
      }
      
      // Verify Model Approved for this agent
      const targetModel = request.model || (await this.models.route(sanitizedPrompt)).id;
      if (!agent.allowedModels.includes(targetModel) && !agent.allowedModels.includes("*")) {
        throw new Error(`ExecutiveControlPlane: Model "${targetModel}" is not approved for agent "${request.agentId}".`);
      }

      // Verify Agent isolation and timeout checks
      if (agent.isolationLevel === "sandbox" && sanitizedPrompt.includes("system_shutdown")) {
        throw new Error("ExecutiveControlPlane: System commands are not permitted inside sandboxed agents.");
      }

      await eventPlatform.publish({
        name: "AgentSelected",
        source: "executive-control-plane",
        payload: { agentId: request.agentId, model: targetModel, correlationId, traceId }
      });
    }

    if (request.workflowId) {
      const workflow = this.workflows.getWorkflow(request.workflowId);
      if (!workflow) {
        throw new Error(`ExecutiveControlPlane: Selected workflow "${request.workflowId}" is not registered.`);
      }
      await eventPlatform.publish({
        name: "WorkflowSelected",
        source: "executive-control-plane",
        payload: { workflowId: request.workflowId, correlationId, traceId }
      });
    }

    // Resolve model if direct routing
    let selectedModelId = "unknown";
    if (!request.workflowId && !request.agentId) {
      const routedModel = await this.models.route(sanitizedPrompt);
      selectedModelId = routedModel.id;
      await eventPlatform.publish({
        name: "ModelSelected",
        source: "executive-control-plane",
        payload: { modelId: selectedModelId, correlationId, traceId }
      });
    }

    // 6. Execute request via aiRuntimeKernel
    let response: AIResponse;
    try {
      response = await aiRuntimeKernel.execute({
        ...request,
        prompt: sanitizedPrompt,
        context: ctx
      });
    } catch (err: any) {
      await eventPlatform.publish({
        name: "ResponseGenerated",
        source: "executive-control-plane",
        payload: { status: "failed", errorMessage: err.message, correlationId, traceId }
      });
      throw err;
    }

    const duration = Date.now() - start;

    // 7. Dynamic Evaluation & Scorecard Generation
    const promptId = request.options?.promptId || "golden:kernel-boot";
    const evalRes = await this.evaluation.evaluateOutput(
      promptId,
      response.model,
      response.content,
      duration,
      response.usage.costUsd,
      correlationId,
      traceId
    );

    // Commit scorecard to database (Phase 5)
    let isGroundingPassed = true;
    if (request.options?.enableRag && response.content) {
      const RAG_THRESHOLD = 0.8;
      if (evalRes.groundingScore < RAG_THRESHOLD) {
        isGroundingPassed = false;
        await eventPlatform.publish({
          name: "HallucinationDetected",
          source: "executive-control-plane",
          priority: "high",
          payload: {
            groundingScore: evalRes.groundingScore,
            modelId: response.model,
            correlationId,
            traceId
          }
        });
      }
    }

    // Update cumulative metrics
    metricsPlatform.counter("ai_prompt_tokens_total", response.usage.promptTokens);
    metricsPlatform.counter("ai_completion_tokens_total", response.usage.completionTokens);
    metricsPlatform.counter("ai_cost_usd_accumulated", response.usage.costUsd);
    metricsPlatform.gauge("ai_grounding_score_ratio", evalRes.groundingScore);
    metricsPlatform.gauge("ai_inference_ttft_ms", response.latencyMs / 4); // Estimated TTFT
    metricsPlatform.gauge("ai_inference_tps", response.usage.completionTokens / (response.latencyMs / 1000 || 1));

    if (evalRes.safetyViolation) {
      metricsPlatform.counter("ai_safety_violations_total", 1);
    }
    if (!isGroundingPassed) {
      metricsPlatform.counter("ai_hallucination_detected_total", 1);
    }

    // 8. Publish final completion events
    await eventPlatform.publish({
      name: "EvaluationCompleted",
      source: "executive-control-plane",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "archive",
      payload: {
        scorecardId: evalRes.id,
        groundingScore: evalRes.groundingScore,
        safetyViolation: evalRes.safetyViolation,
        correlationId,
        traceId
      }
    });

    return response;
  }

  private resolveBusinessObjective(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes("audit") || lower.includes("validate") || lower.includes("compliance")) {
      return "Workspace Quality & Compliance Audit";
    }
    if (lower.includes("deploy") || lower.includes("build") || lower.includes("run")) {
      return "Infrastructure Deployment & Launch";
    }
    if (lower.includes("security") || lower.includes("firewall") || lower.includes("rbac")) {
      return "Zero Trust Security Hardening";
    }
    return "General Assistant & Context Reasoning";
  }
}

export const executiveControlPlane = ExecutiveControlPlane.getInstance();
export default executiveControlPlane;
