// ============================================================================
// LiteLLM AI Runtime Provider — Infrastructure Adapter
// ============================================================================
// Discovers models, aliases, routes, endpoints, and health from LiteLLM API.
// LiteLLM is the logical AI Gateway — all interactions route through it.
// This provider is READ-ONLY — no configuration changes.
// ============================================================================

import { IAIRuntimeProviderAdapter } from "../contracts/ai-runtime-provider";
import { HealthCheckResult } from "../health/types";
import { CapabilityReport } from "../discovery/types";
import type {
  AIModel, ModelAlias, Endpoint, ProviderHealth, ProviderCapabilities,
  RoutingPolicy, InferenceStatistics, Capability, ModelStatus,
} from "@/types/ai-runtime";

const DEFAULT_LITELLM_URL = "http://127.0.0.1:4000";

export class LiteLLMAIRuntimeProvider implements IAIRuntimeProviderAdapter {
  id = "litellm-ai-runtime";
  name = "LiteLLM API Gateway";
  type = "ai-runtime-provider" as const;

  private baseUrl: string = DEFAULT_LITELLM_URL;

  async initialize(config: Record<string, any>): Promise<void> {
    this.baseUrl = process.env.LITELLM_BASE_URL || config.baseUrl || DEFAULT_LITELLM_URL;
    console.log(`[LiteLLMAIRuntime] Initialized. Base URL: ${this.baseUrl}`);
  }

  async shutdown(): Promise<void> {
    console.log("[LiteLLMAIRuntime] Shut down.");
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        const isHealthy = data.status === "healthy" || data.healthy_count > 0 || res.status === 200;
        return {
          status: isHealthy ? "healthy" : "degraded",
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          version: await this.getRuntimeVersion(),
          details: data,
        };
      }
      return { status: "degraded", latencyMs, lastCheckedAt: new Date().toISOString(), errorMessage: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: "unhealthy", latencyMs: Date.now() - start, lastCheckedAt: new Date().toISOString(), errorMessage: err.message };
    }
  }

  async getProviderHealth(): Promise<ProviderHealth> {
    const hc = await this.checkHealth();
    const checks: { name: string; status: "pass" | "fail" | "warn"; message: string }[] = [
      { name: "gateway-reachable", status: hc.status === "healthy" ? "pass" : "fail", message: hc.errorMessage || "OK" },
    ];

    // Check liveliness
    try {
      const liveRes = await fetch(`${this.baseUrl}/health/liveliness`, { signal: AbortSignal.timeout(2000) });
      checks.push({
        name: "liveliness",
        status: liveRes.ok ? "pass" : "fail",
        message: liveRes.ok ? "Live" : `HTTP ${liveRes.status}`,
      });
    } catch (err: any) {
      checks.push({ name: "liveliness", status: "fail", message: err.message });
    }

    return {
      providerId: this.id,
      providerName: this.name,
      status: hc.status as any,
      latencyMs: hc.latencyMs,
      lastCheckedAt: hc.lastCheckedAt,
      version: hc.version || "unknown",
      errorMessage: hc.errorMessage || null,
      heartbeat: hc.status === "healthy",
      checks,
    };
  }

  // ---------------------------------------------------------------------------
  // Version
  // ---------------------------------------------------------------------------

  async getRuntimeVersion(): Promise<string> {
    try {
      // LiteLLM doesn't have a dedicated version endpoint — attempt the models endpoint header
      const res = await fetch(`${this.baseUrl}/v1/models`, { method: "HEAD", signal: AbortSignal.timeout(2000) });
      const serverHeader = res.headers.get("server") || res.headers.get("x-litellm-version") || "";
      if (serverHeader) return serverHeader;
    } catch {}
    return "unknown";
  }

  // ---------------------------------------------------------------------------
  // Capabilities
  // ---------------------------------------------------------------------------

  async getCapabilities(): Promise<CapabilityReport> {
    return {
      providerId: this.id,
      providerName: this.name,
      version: await this.getRuntimeVersion(),
      capabilities: [
        { name: "routing", description: "Route LLM calls to multiple providers" },
        { name: "load-balancing", description: "Load balance across model deployments" },
        { name: "fallbacks", description: "Automatic fallback to alternative models" },
        { name: "caching", description: "Response caching for repeated queries" },
        { name: "rate-limiting", description: "Per-key and per-model rate limits" },
      ],
      supportedOperations: ["discoverModels", "discoverRoutes", "discoverAliases", "getProviderHealth"],
      limitations: ["Read-only integration", "No direct inference through console"],
      dependencies: ["Ollama"],
      authRequirements: "api-key",
    };
  }

  async getProviderCapabilities(): Promise<ProviderCapabilities> {
    return {
      providerId: this.id,
      providerName: this.name,
      supportedCapabilities: ["chat", "completion", "embeddings", "streaming", "tool-calling", "function-calling", "vision", "reasoning"],
      supportedOperations: ["discoverModels", "discoverRoutes", "discoverAliases", "discoverEndpoints", "getProviderHealth"],
      limitations: ["Gateway only — actual inference delegated to underlying providers"],
      dependencies: ["Ollama"],
      authRequirement: "api-key",
    };
  }

  // ---------------------------------------------------------------------------
  // Model Discovery
  // ---------------------------------------------------------------------------

  async discoverModels(): Promise<AIModel[]> {
    const models: AIModel[] = [];

    try {
      // OpenAI-compatible model list
      const res = await fetch(`${this.baseUrl}/v1/models`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return [];
      const data = await res.json();
      const rawModels: any[] = data.data || data.models || [];

      // Try to get model info for richer metadata
      let modelInfoMap: Record<string, any> = {};
      try {
        const infoRes = await fetch(`${this.baseUrl}/model/info`, { signal: AbortSignal.timeout(5000) });
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const infoList = infoData.data || [];
          for (const info of infoList) {
            const key = info.model_name || info.id;
            if (key) modelInfoMap[key] = info;
          }
        }
      } catch {}

      for (const raw of rawModels) {
        const modelId = raw.id || raw.model || "unknown";
        const info = modelInfoMap[modelId] || {};
        models.push(this.mapToCanonical(modelId, raw, info));
      }
    } catch {}

    return models;
  }

  private mapToCanonical(modelId: string, raw: any, info: any): AIModel {
    const name = modelId;
    const litellmProvider = info.litellm_params?.model?.split("/")[0] || "ollama";
    const underlyingModel = info.litellm_params?.model || name;
    const family = this.extractFamily(name);
    const isVirtual = name !== underlyingModel;

    const capabilities: Capability[] = [
      { name: "chat", supported: true, description: "Conversational text generation" },
      { name: "streaming", supported: true, description: "Streaming token output" },
    ];

    // Merge mode info
    const mode = info.mode || raw.mode;
    if (mode === "embedding" || name.includes("embed") || name.includes("minilm")) {
      capabilities.push({ name: "embeddings", supported: true, description: "Embedding generation" });
    }
    if (info.supports_function_calling || info.supports_tool_calling) {
      capabilities.push({ name: "tool-calling", supported: true, description: "Function/tool calling" });
      capabilities.push({ name: "function-calling", supported: true, description: "Function calling API" });
    }
    if (info.supports_vision) {
      capabilities.push({ name: "vision", supported: true, description: "Image understanding" });
      capabilities.push({ name: "image-input", supported: true, description: "Accepts image input" });
    }

    const maxTokens = info.max_tokens || info.max_input_tokens || 8192;
    const maxOutput = info.max_output_tokens || 4096;

    return {
      id: `litellm:${name}`,
      name,
      displayName: this.toDisplayName(name),
      family,
      providerId: this.id,
      providerName: this.name,
      status: "available",
      parameters: info.parameter_size || "unknown",
      parameterCount: null,
      sizeBytes: 0,
      sizeDisplay: "via gateway",
      quantization: { format: "unknown", bitsPerWeight: null, description: "Managed by underlying provider" },
      contextWindow: {
        inputTokens: maxTokens,
        outputTokens: maxOutput,
        totalTokens: maxTokens,
      },
      capabilities,
      aliases: [],
      deployment: {
        status: "available",
        loadedAt: null,
        gpuLayers: null,
        gpuMemoryUsed: null,
        cpuThreads: null,
        expiresAt: null,
      },
      lifecycle: {
        createdAt: raw.created ? new Date(raw.created * 1000).toISOString() : new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        lastAccessedAt: null,
        state: "available",
      },
      license: "unknown",
      architecture: "",
      templateFormat: "",
      digest: "",
      tags: [family, isVirtual ? "virtual" : "direct", litellmProvider].filter(Boolean),
      metadata: {
        litellmProvider,
        underlyingModel,
        isVirtual,
        mode: mode || "chat",
        litellmParams: info.litellm_params || {},
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Alias Discovery
  // ---------------------------------------------------------------------------

  async discoverAliases(): Promise<ModelAlias[]> {
    const aliases: ModelAlias[] = [];
    try {
      const infoRes = await fetch(`${this.baseUrl}/model/info`, { signal: AbortSignal.timeout(5000) });
      if (!infoRes.ok) return [];
      const data = await infoRes.json();
      const infoList = data.data || [];

      for (const info of infoList) {
        const modelName = info.model_name || "";
        const underlyingModel = info.litellm_params?.model || "";
        if (modelName && underlyingModel && modelName !== underlyingModel) {
          aliases.push({
            alias: modelName,
            modelId: `litellm:${modelName}`,
            modelName: underlyingModel,
            providerId: this.id,
            providerName: this.name,
            description: `Routes to ${underlyingModel}`,
            isDefault: false,
          });
        }
      }
    } catch {}
    return aliases;
  }

  // ---------------------------------------------------------------------------
  // Endpoint Discovery
  // ---------------------------------------------------------------------------

  async discoverEndpoints(): Promise<Endpoint[]> {
    const health = await this.checkHealth();
    return [
      {
        id: `${this.id}:gateway`,
        url: this.baseUrl,
        protocol: "http",
        providerId: this.id,
        providerName: this.name,
        auth: "api-key",
        status: health.status as any,
        latencyMs: health.latencyMs,
        lastCheckedAt: health.lastCheckedAt,
      },
      {
        id: `${this.id}:openai-compat`,
        url: `${this.baseUrl}/v1`,
        protocol: "http",
        providerId: this.id,
        providerName: this.name,
        auth: "api-key",
        status: health.status as any,
        latencyMs: health.latencyMs,
        lastCheckedAt: health.lastCheckedAt,
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Route Discovery
  // ---------------------------------------------------------------------------

  async discoverRoutes(): Promise<RoutingPolicy[]> {
    const routes: RoutingPolicy[] = [];
    try {
      const infoRes = await fetch(`${this.baseUrl}/model/info`, { signal: AbortSignal.timeout(5000) });
      if (!infoRes.ok) return [];
      const data = await infoRes.json();
      const infoList = data.data || [];

      for (const info of infoList) {
        const modelName = info.model_name || "";
        const underlying = info.litellm_params?.model || modelName;
        const litellmProvider = underlying.split("/")[0] || "unknown";

        routes.push({
          id: `route:${modelName}`,
          name: modelName,
          virtualModelName: modelName,
          underlyingModels: [{
            modelId: `ollama:${underlying.replace(/^ollama\//, "")}`,
            modelName: underlying,
            provider: litellmProvider,
          }],
          loadBalancing: "none",
          fallbackOrder: [],
          retryPolicy: { maxRetries: info.litellm_params?.num_retries || 2, retryDelayMs: 1000 },
          timeout: info.litellm_params?.timeout || 600,
          cachingEnabled: !!info.litellm_params?.cache,
          metadata: {
            mode: info.mode || "chat",
            inputCostPerToken: info.input_cost_per_token,
            outputCostPerToken: info.output_cost_per_token,
          },
        });
      }
    } catch {}
    return routes;
  }

  // ---------------------------------------------------------------------------
  // Inference Statistics (read-only)
  // ---------------------------------------------------------------------------

  async getInferenceStatistics(): Promise<InferenceStatistics> {
    // LiteLLM may expose /spend/logs or /global/spend — attempt reading
    try {
      const res = await fetch(`${this.baseUrl}/global/spend/logs?limit=1`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        return {
          providerId: this.id,
          providerName: this.name,
          totalRequests: data.total_count || 0,
          successfulRequests: data.success_count || 0,
          failedRequests: data.failure_count || 0,
          avgLatencyMs: data.avg_latency_ms || 0,
          p99LatencyMs: data.p99_latency_ms || 0,
          throughputRps: 0,
          lastRequestAt: data.last_request_at || null,
        };
      }
    } catch {}

    return {
      providerId: this.id,
      providerName: this.name,
      totalRequests: 0, successfulRequests: 0, failedRequests: 0,
      avgLatencyMs: 0, p99LatencyMs: 0, throughputRps: 0, lastRequestAt: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private extractFamily(name: string): string {
    const lower = name.toLowerCase();
    if (lower.startsWith("gemma")) return "Gemma";
    if (lower.startsWith("qwen")) return "Qwen";
    if (lower.startsWith("deepseek")) return "DeepSeek";
    if (lower.startsWith("llama")) return "Llama";
    if (lower.startsWith("mistral")) return "Mistral";
    if (lower.startsWith("phi")) return "Phi";
    if (lower.startsWith("smollm")) return "SmolLM";
    if (lower.startsWith("gpt-oss")) return "GPT-OSS";
    if (lower.includes("minilm") || lower.includes("embed")) return "Embedding";
    return name.split(":")[0].split("/").pop() || "Unknown";
  }

  private toDisplayName(name: string): string {
    return name
      .replace(/^ollama\//, "")
      .replace(/:latest$/, "")
      .split(/[-_:]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
}
