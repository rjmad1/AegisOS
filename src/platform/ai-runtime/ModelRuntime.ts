import { AIModelInfo, RoutingPolicy, ModelProviderType } from "./types";
import prisma from "../../infrastructure/db/prisma";

export class ModelRuntime {
  private static instance: ModelRuntime | null = null;
  private models: Map<string, AIModelInfo> = new Map();
  private policies: Map<string, RoutingPolicy> = new Map();

  private constructor() {
    this.seedDefaultModels();
  }

  public static getInstance(): ModelRuntime {
    if (!ModelRuntime.instance) {
      ModelRuntime.instance = new ModelRuntime();
    }
    return ModelRuntime.instance;
  }

  public reset(): void {
    this.models.clear();
    this.policies.clear();
    this.seedDefaultModels();
  }

  public seedDefaultModels(): void {
    const defaultModels: AIModelInfo[] = [
      {
        id: "ollama:gemma2:9b",
        name: "gemma2:9b",
        displayName: "Gemma 2 9B (Local)",
        provider: "ollama",
        family: "gemma",
        parameterCount: "9B",
        vramRequiredGb: 8,
        contextLength: 8192,
        costPer1kInput: 0.0,
        costPer1kOutput: 0.0,
        latencyAvgMs: 250,
        reliabilityScore: 0.95,
        capabilities: ["tool-use", "reasoning"],
        status: "online",
        version: "latest",
      },
      {
        id: "ollama:llama3.1:8b",
        name: "llama3.1:8b",
        displayName: "Llama 3.1 8B (Local)",
        provider: "ollama",
        family: "llama",
        parameterCount: "8B",
        vramRequiredGb: 6,
        contextLength: 16384,
        costPer1kInput: 0.0,
        costPer1kOutput: 0.0,
        latencyAvgMs: 180,
        reliabilityScore: 0.92,
        capabilities: ["tool-use"],
        status: "online",
        version: "latest",
      },
      {
        id: "litellm:gpt-4o",
        name: "gpt-4o",
        displayName: "GPT-4o (LiteLLM)",
        provider: "litellm",
        family: "gpt",
        parameterCount: "unknown",
        contextLength: 128000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        latencyAvgMs: 800,
        reliabilityScore: 0.99,
        capabilities: ["tool-use", "vision", "reasoning"],
        status: "online",
        version: "v1.0",
      },
      {
        id: "litellm:claude-3-5-sonnet",
        name: "claude-3-5-sonnet",
        displayName: "Claude 3.5 Sonnet (LiteLLM)",
        provider: "litellm",
        family: "claude",
        parameterCount: "unknown",
        contextLength: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        latencyAvgMs: 950,
        reliabilityScore: 0.99,
        capabilities: ["tool-use", "vision", "reasoning"],
        status: "online",
        version: "v1.0",
      },
      {
        id: "openai:gpt-3.5-turbo",
        name: "gpt-3.5-turbo",
        displayName: "GPT-3.5 Turbo",
        provider: "openai",
        family: "gpt",
        contextLength: 16384,
        costPer1kInput: 0.0015,
        costPer1kOutput: 0.002,
        latencyAvgMs: 300,
        reliabilityScore: 0.97,
        capabilities: ["tool-use"],
        status: "online",
        version: "latest",
      },
      {
        id: "gemini:gemini-1.5-flash",
        name: "gemini-1.5-flash",
        displayName: "Gemini 1.5 Flash",
        provider: "gemini",
        family: "gemini",
        contextLength: 1048576,
        costPer1kInput: 0.000075,
        costPer1kOutput: 0.0003,
        latencyAvgMs: 400,
        reliabilityScore: 0.98,
        capabilities: ["tool-use", "vision", "reasoning"],
        status: "online",
        version: "latest",
      },
    ];

    for (const m of defaultModels) {
      this.models.set(m.id, m);
    }

    // Default Routing Policies
    const defaultPolicies: RoutingPolicy[] = [
      {
        id: "policy:default",
        name: "Standard Default Policy",
        strategy: "direct",
        primaryModel: "ollama:gemma2:9b",
        fallbackModels: ["ollama:llama3.1:8b", "litellm:gpt-4o"],
        enabled: true,
      },
      {
        id: "policy:cost-optimized",
        name: "Cost Optimized Router",
        strategy: "cost",
        primaryModel: "ollama:gemma2:9b",
        fallbackModels: ["gemini:gemini-1.5-flash", "openai:gpt-3.5-turbo"],
        enabled: true,
      },
      {
        id: "policy:latency-optimized",
        name: "Latency Optimized Router",
        strategy: "latency",
        primaryModel: "ollama:llama3.1:8b",
        fallbackModels: ["ollama:gemma2:9b", "openai:gpt-3.5-turbo"],
        enabled: true,
      },
      {
        id: "policy:high-reliability",
        name: "High Reliability Router (Consensus)",
        strategy: "consensus",
        primaryModel: "litellm:claude-3-5-sonnet",
        fallbackModels: ["litellm:gpt-4o", "gemini:gemini-1.5-flash"],
        consensusThreshold: 0.6,
        enabled: true,
      },
    ];

    for (const p of defaultPolicies) {
      this.policies.set(p.id, p);
    }
  }

  public registerModel(model: AIModelInfo): void {
    this.models.set(model.id, model);
  }

  public getModels(): AIModelInfo[] {
    return Array.from(this.models.values());
  }

  public getModel(id: string): AIModelInfo | undefined {
    return this.models.get(id);
  }

  public registerPolicy(policy: RoutingPolicy): void {
    this.policies.set(policy.id, policy);
  }

  public getPolicies(): RoutingPolicy[] {
    return Array.from(this.policies.values());
  }

  public getPolicy(id: string): RoutingPolicy | undefined {
    return this.policies.get(id);
  }

  /**
   * Routes the prompt based on policy constraints and capability matching.
   */
  public async route(prompt: string, policyId: string = "policy:default"): Promise<AIModelInfo> {
    // Dynamically update model metrics from DB scorecards (Phase 9/10)
    try {
      const recentCards = await prisma.evaluationScorecard.findMany({
        take: 50,
        orderBy: { timestamp: "desc" }
      });
      if (recentCards.length > 0) {
        const modelStats = new Map<string, { totalGrounding: number; count: number; totalLatency: number }>();
        for (const card of recentCards) {
          const stats = modelStats.get(card.modelId) || { totalGrounding: 0, count: 0, totalLatency: 0 };
          stats.totalGrounding += card.grounding;
          stats.totalLatency += card.latencyMs;
          stats.count += 1;
          modelStats.set(card.modelId, stats);
        }

        for (const [modelId, stats] of modelStats.entries()) {
          const m = this.getModel(modelId);
          if (m) {
            m.reliabilityScore = parseFloat((stats.totalGrounding / stats.count).toFixed(2));
            m.latencyAvgMs = Math.round(stats.totalLatency / stats.count);
          }
        }
      }
    } catch (e: any) {
      console.warn("[ModelRuntime] Scorecard dynamic metrics sync failed:", e.message);
    }

    const policy = this.policies.get(policyId) || this.policies.get("policy:default")!;
    const availableModels = this.getModels().filter((m) => m.status === "online");

    switch (policy.strategy) {
      case "direct": {
        const primary = this.getModel(policy.primaryModel);
        if (primary && primary.status === "online") {
          return primary;
        }
        // Fallback strategy if primary is offline
        for (const fbId of policy.fallbackModels) {
          const fb = this.getModel(fbId);
          if (fb && fb.status === "online") {
            console.log(`[ModelRuntime] Primary model ${policy.primaryModel} offline. Routing to fallback ${fbId}`);
            return fb;
          }
        }
        throw new Error("ModelRuntime: Primary model and all fallback models are offline.");
      }

      case "cost": {
        // Choose the online model with the lowest input/output cost matching context length and required capabilities
        const sortedByCost = [...availableModels].sort(
          (a, b) => (a.costPer1kInput + a.costPer1kOutput) - (b.costPer1kInput + b.costPer1kOutput)
        );
        if (sortedByCost.length > 0) return sortedByCost[0];
        break;
      }

      case "latency": {
        // Choose the online model with lowest average latency
        const sortedByLatency = [...availableModels].sort((a, b) => a.latencyAvgMs - b.latencyAvgMs);
        if (sortedByLatency.length > 0) return sortedByLatency[0];
        break;
      }

      case "confidence":
      case "consensus": {
        // High reliability routing: prioritize reliability score
        const sortedByReliability = [...availableModels].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
        if (sortedByReliability.length > 0) return sortedByReliability[0];
        break;
      }
    }

    // Default Fallback
    const fallback = this.getModel(policy.primaryModel);
    if (!fallback) {
      throw new Error(`ModelRuntime: Failed to resolve model for policy ${policyId}`);
    }
    return fallback;
  }
}
