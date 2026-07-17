import * as crypto from "crypto";
import { AIRequest, AIResponse, AIRuntimeContext } from "./types";
import { ModelRuntime } from "./ModelRuntime";
import { PromptRuntime } from "./PromptRuntime";
import { MemoryPlatform } from "./MemoryPlatform";
import { KnowledgeRuntime } from "./KnowledgeRuntime";
import { ToolRuntime } from "./ToolRuntime";
import { WorkflowRuntime } from "./WorkflowRuntime";
import { AgentRuntime } from "./AgentRuntime";
import { MultiAgentOrchestrator } from "./MultiAgentOrchestrator";
import { ReasoningEngine } from "./ReasoningEngine";
import { PlanningEngine } from "./PlanningEngine";
import { EvaluationPlatform } from "./EvaluationPlatform";
import { HumanCollaborationLayer } from "./HumanCollaborationLayer";
import { AIMarketplace } from "./AIMarketplace";
import { AIOperationsDashboard } from "./AIOperationsDashboard";
import { RuntimeHealthFramework } from "./RuntimeHealthFramework";
import { policyEnforcer } from "../../infrastructure/security/policy-enforcer";
import { recoveryEngine } from "../../infrastructure/reliability/RecoveryEngine";

export class AIRuntimeKernel {
  private static instance: AIRuntimeKernel | null = null;

  // Registry Accessors for the AI Operating System engines
  public readonly models = ModelRuntime.getInstance();
  public readonly prompts = PromptRuntime.getInstance();
  public readonly memories = MemoryPlatform.getInstance();
  public readonly knowledge = KnowledgeRuntime.getInstance();
  public readonly tools = ToolRuntime.getInstance();
  public readonly workflows = WorkflowRuntime.getInstance();
  public readonly agents = AgentRuntime.getInstance();
  public readonly orchestrator = MultiAgentOrchestrator.getInstance();
  public readonly reasoning = ReasoningEngine.getInstance();
  public readonly planning = PlanningEngine.getInstance();
  public readonly evaluation = EvaluationPlatform.getInstance();
  public readonly human = HumanCollaborationLayer.getInstance();
  public readonly marketplace = AIMarketplace.getInstance();
  public readonly dashboard = AIOperationsDashboard.getInstance();
  public readonly health = RuntimeHealthFramework.getInstance();

  private constructor() {}

  public static getInstance(): AIRuntimeKernel {
    if (!AIRuntimeKernel.instance) {
      AIRuntimeKernel.instance = new AIRuntimeKernel();
    }
    return AIRuntimeKernel.instance;
  }

  /**
   * The single execution gateway through which every AI request is processed.
   * Enforces security, routes to models, applies memories, evaluates results,
   * and tracks system operations telemetry.
   */
  public async execute(request: AIRequest): Promise<AIResponse> {
    const start = Date.now();

    // 1. Establish runtime context
    const correlationId = request.context?.correlationId || `corr-${crypto.randomUUID().slice(0, 8)}`;
    const traceId = request.context?.traceId || `trace-${crypto.randomUUID().slice(0, 8)}`;
    const ctx: AIRuntimeContext = {
      correlationId,
      traceId,
      userId: request.context?.userId || "usr-admin-01",
      role: request.context?.role || "administrator",
      timestamp: Date.now(),
    };

    this.dashboard.addRoutingTrace(`Kernel received request. Target Agent: ${request.agentId || "none"}`);

    // 2. Safety & Governance guardrails
    // Cost limit / budget enforcement checking (OBS-OA-07)
    const userRole = ctx.role;
    const userBudgetLimit = userRole === 'administrator' ? 100.00 : 5.00;
    const currentUsageStats = this.dashboard.getMetrics();
    const currentAccumulatedCost = currentUsageStats.totalCostUsd || 0;
    if (currentAccumulatedCost > userBudgetLimit) {
      throw new Error(`AIRuntimeKernel: Request blocked. User budget limit of $${userBudgetLimit} exceeded. Current accumulated billing cost: $${currentAccumulatedCost}`);
    }

    // Redact sensitive PII and check for injection
    const sanitizedPrompt = policyEnforcer.maskPII(request.prompt);
    const hasInjection = policyEnforcer.containsInjection(sanitizedPrompt);
    if (hasInjection) {
      this.dashboard.recordCall(0, 0, 0, false, true);
      throw new Error("AIRuntimeKernel: Request blocked due to prompt injection warning.");
    }

    try {
      let finalContent = "";
      let routedModelId = "unknown";

      // 3. Context & Knowledge retrieval: RAG context query if requested
      let ragContext = "";
      let retrievedAsset: { id: string; content: string } | null = null;
      if (request.options?.enableRag) {
        const assets = await this.knowledge.queryHybrid(sanitizedPrompt);
        if (assets.length > 0) {
          ragContext = `\n[Knowledge Context]: ${assets[0].content}`;
          retrievedAsset = assets[0];
          this.dashboard.addRoutingTrace(`RAG integration resolved context asset: ${assets[0].id}`);
        }
      }

      // 4. Memory Integration: fetch relevant user conversation context
      const userMemory = await this.memories.retrieve("conversation", sanitizedPrompt, ctx.userId!);
      let conversationHistory = "";
      if (userMemory.length > 0) {
        conversationHistory = `\n[Previous context]: ${userMemory[0].content}`;
      }

      // Compose final context prompt
      const finalPrompt = `${sanitizedPrompt}${ragContext}${conversationHistory}`;

      // 5. Routing and Execution plane
      if (request.agentId) {
        // Route through Agent runtime
        const agent = this.agents.getAgent(request.agentId);
        if (!agent) throw new Error(`Agent ${request.agentId} not found`);

        // Resolve model using Model Router
        const routedModel = await this.models.route(finalPrompt);
        routedModelId = routedModel.id;

        const primaryQuery = async () => {
          return await this.agents.executeAgentTask(request.agentId!, finalPrompt, ctx);
        };
        const fallbackQuery = async () => {
          return `[Degraded Fallback]: Downstream agent service overloaded. Task executed under recovery protocol.`;
        };
        finalContent = await recoveryEngine.executeModelQuery(primaryQuery, fallbackQuery, routedModelId);
      } else if (request.workflowId) {
        // Execute workflow
        const exec = await this.workflows.startExecution(request.workflowId, request.options?.variables || {});
        const finalState = await this.workflows.runWorkflow(exec.id);
        
        finalContent = `Workflow execution ${finalState.status.toUpperCase()}. Results: ${JSON.stringify(finalState.stepResults)}`;
        routedModelId = "system:workflow-runtime";
      } else {
        // Direct model execution
        const routedModel = await this.models.route(finalPrompt);
        routedModelId = routedModel.id;

        // Mock LLM invocation output protected by circuit breaker
        const primaryQuery = async () => {
          return `[Response from ${routedModel.displayName}]: I processed your prompt: "${sanitizedPrompt.slice(0, 50)}". Everything looks valid.`;
        };
        const fallbackQuery = async () => {
          return `[Response from Fallback]: Primary model offline. Handled request via fallback routing.`;
        };
        finalContent = await recoveryEngine.executeModelQuery(primaryQuery, fallbackQuery, routedModelId);
      }

      const elapsed = Date.now() - start;

      // 6. Output safety and Evaluation scoring
      const tokensCount = Math.round(finalPrompt.length / 4 + finalContent.length / 4);
      const cost = (tokensCount / 1000) * 0.0015;

      const evalRes = await this.evaluation.evaluateOutput("golden:kernel-boot", routedModelId, finalContent, elapsed, cost, ctx.correlationId, ctx.traceId);
      if (evalRes.safetyViolation) {
        throw new Error("AIRuntimeKernel: Output verification blocked due to sensitive signature leak.");
      }

      // Grounding validation checking (OBS-AN-08)
      if (request.options?.enableRag && retrievedAsset) {
        const similarity = this.calculateCosineSimilarity(finalContent, retrievedAsset.content);
        console.log(`[AIRuntimeKernel:Grounding] Cosine similarity grounding score: ${similarity}`);
        const MIN_GROUNDING_SCORE = 0.10;
        if (similarity < MIN_GROUNDING_SCORE) {
          throw new Error(`AIRuntimeKernel: Output verification failed. Hallucination detected (cosine similarity grounding score ${similarity.toFixed(4)} < ${MIN_GROUNDING_SCORE}).`);
        }
      }

      // 7. Store new interaction in Conversation Memory
      await this.memories.store({
        id: `mem:conv:${correlationId}:${Date.now()}`,
        domain: "conversation",
        ownerId: ctx.userId!,
        content: `User: ${sanitizedPrompt} | Assistant: ${finalContent}`,
        confidence: 1.0,
        timestamp: Date.now(),
        importance: 5,
      });

      // 8. Record telemetry in dashboard
      this.dashboard.recordCall(tokensCount, cost, elapsed, false);
      this.dashboard.addRoutingTrace(`Request completed successfully in ${elapsed}ms.`);

      return {
        content: finalContent,
        model: routedModelId,
        usage: {
          promptTokens: Math.round(finalPrompt.length / 4),
          completionTokens: Math.round(finalContent.length / 4),
          totalTokens: tokensCount,
          costUsd: cost,
        },
        latencyMs: elapsed,
        traceId: ctx.traceId,
        correlationId: ctx.correlationId,
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[AIRuntimeKernel:Error] execution failed:`, errMsg);
      
      // Auto-healing diagnosis call
      await this.health.triggerSelfHealing("inferenceEngine");
      
      this.dashboard.recordCall(0, 0, Date.now() - start, false, true);
      this.dashboard.addRoutingTrace(`Request failed: ${errMsg}`);

      throw err;
    }
  }

  public calculateCosineSimilarity(text1: string, text2: string): number {
    const tokenize = (text: string) => text.toLowerCase().match(/\w+/g) || [];
    const words1 = tokenize(text1);
    const words2 = tokenize(text2);
    const freq1: Record<string, number> = {};
    const freq2: Record<string, number> = {};
    const allWords = new Set<string>();
    
    for (const w of words1) {
      freq1[w] = (freq1[w] || 0) + 1;
      allWords.add(w);
    }
    for (const w of words2) {
      freq2[w] = (freq2[w] || 0) + 1;
      allWords.add(w);
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const w of allWords) {
      const v1 = freq1[w] || 0;
      const v2 = freq2[w] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
export const aiRuntimeKernel = AIRuntimeKernel.getInstance();
export default aiRuntimeKernel;
