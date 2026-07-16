// ============================================================================
// Ollama AI Runtime Provider — Infrastructure Adapter
// ============================================================================
// Discovers models, aliases, endpoints, and health from the Ollama API.
// All responses are mapped to canonical AIModel types before returning.
// This provider is READ-ONLY — no model management operations.
// ============================================================================

import { IAIRuntimeProviderAdapter } from "../contracts/ai-runtime-provider";
import { HealthCheckResult } from "../health/types";
import { CapabilityReport } from "../discovery/types";
import type {
  AIModel, ModelAlias, Endpoint, ProviderHealth, ProviderCapabilities,
  RoutingPolicy, InferenceStatistics, Capability, CapabilityName,
  QuantizationFormat, ModelStatus,
} from "@/types/ai-runtime";

import { PortRegistry } from "@/platform/ports/PortRegistry";

const DEFAULT_OLLAMA_URL = PortRegistry.getServiceUrl("ollama") || "http://127.0.0.1:11434";

export class OllamaAIRuntimeProvider implements IAIRuntimeProviderAdapter {
  id = "ollama-ai-runtime";
  name = "Ollama Local Inference Engine";
  type = "ai-runtime-provider" as const;

  private baseUrl: string = DEFAULT_OLLAMA_URL;

  async initialize(config: Record<string, any>): Promise<void> {
    this.baseUrl = process.env.OLLAMA_BASE_URL || config.baseUrl || DEFAULT_OLLAMA_URL;
    console.log(`[OllamaAIRuntime] Initialized. Base URL: ${this.baseUrl}`);
  }

  async shutdown(): Promise<void> {
    console.log("[OllamaAIRuntime] Shut down.");
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const res = await fetch(this.baseUrl, { signal: AbortSignal.timeout(3000) });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          status: "healthy",
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          version: await this.getRuntimeVersion(),
        };
      }
      return { status: "degraded", latencyMs, lastCheckedAt: new Date().toISOString(), errorMessage: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: "unhealthy", latencyMs: Date.now() - start, lastCheckedAt: new Date().toISOString(), errorMessage: err.message };
    }
  }

  async getProviderHealth(): Promise<ProviderHealth> {
    const hc = await this.checkHealth();
    return {
      providerId: this.id,
      providerName: this.name,
      status: hc.status as any,
      latencyMs: hc.latencyMs,
      lastCheckedAt: hc.lastCheckedAt,
      version: hc.version || "unknown",
      errorMessage: hc.errorMessage || null,
      heartbeat: hc.status === "healthy",
      checks: [
        { name: "api-reachable", status: hc.status === "healthy" ? "pass" : "fail", message: hc.errorMessage || "OK" },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // Version
  // ---------------------------------------------------------------------------

  async getRuntimeVersion(): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/version`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        return data.version || "unknown";
      }
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
        { name: "inference", description: "Local model inference on CPU/GPU" },
        { name: "model-hosting", description: "Host and serve local model weights" },
        { name: "streaming", description: "Streaming token generation" },
      ],
      supportedOperations: ["discoverModels", "discoverAliases", "getProviderHealth"],
      limitations: ["Local execution only", "No remote GPU support", "Read-only integration"],
      dependencies: [],
      authRequirements: "none",
    };
  }

  async getProviderCapabilities(): Promise<ProviderCapabilities> {
    return {
      providerId: this.id,
      providerName: this.name,
      supportedCapabilities: ["chat", "completion", "embeddings", "streaming", "vision", "tool-calling", "reasoning"],
      supportedOperations: ["discoverModels", "discoverAliases", "discoverEndpoints", "getProviderHealth"],
      limitations: ["Local execution only", "No remote GPU support"],
      dependencies: [],
      authRequirement: "none",
    };
  }

  // ---------------------------------------------------------------------------
  // Model Discovery
  // ---------------------------------------------------------------------------

  async discoverModels(): Promise<AIModel[]> {
    const models: AIModel[] = [];

    try {
      // Get installed models
      const tagsRes = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!tagsRes.ok) return this.fallbackModels();
      const tagsData = await tagsRes.json();
      const installedModels: any[] = tagsData.models || [];

      // Get running models
      let runningModels: any[] = [];
      try {
        const psRes = await fetch(`${this.baseUrl}/api/ps`, { signal: AbortSignal.timeout(3000) });
        if (psRes.ok) {
          const psData = await psRes.json();
          runningModels = psData.models || [];
        }
      } catch {}

      const runningSet = new Set(runningModels.map((m: any) => m.name || m.model));

      for (const raw of installedModels) {
        const modelName: string = raw.name || raw.model || "unknown";
        const isRunning = runningSet.has(modelName);

        // Try to get detailed info for capabilities
        let details: any = null;
        try {
          const showRes = await fetch(`${this.baseUrl}/api/show`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: modelName }),
            signal: AbortSignal.timeout(3000),
          });
          if (showRes.ok) details = await showRes.json();
        } catch {}

        models.push(this.mapToCanonical(modelName, raw, details, isRunning));
      }
    } catch {
      return this.fallbackModels();
    }

    return models;
  }

  private mapToCanonical(modelName: string, raw: any, details: any, isRunning: boolean): AIModel {
    const sizeBytes = raw.size || 0;
    const family = this.extractFamily(modelName);
    const params = this.extractParameters(modelName, details);
    const quantization = this.extractQuantization(modelName, details);
    const capabilities = this.extractCapabilities(modelName, details);
    const contextLength = this.extractContextLength(details);
    const digest = raw.digest || details?.digest || "";
    const license = details?.license || "unknown";
    const arch = details?.modelinfo?.["general.architecture"] || details?.details?.family || "";
    const template = details?.template || "";

    const status: ModelStatus = isRunning ? "running" : "available";

    return {
      id: `ollama:${modelName}`,
      name: modelName,
      displayName: this.toDisplayName(modelName),
      family,
      providerId: this.id,
      providerName: this.name,
      status,
      parameters: params.display,
      parameterCount: params.count,
      sizeBytes,
      sizeDisplay: this.formatBytes(sizeBytes),
      quantization,
      contextWindow: {
        inputTokens: contextLength,
        outputTokens: Math.min(contextLength, 8192),
        totalTokens: contextLength,
      },
      capabilities,
      aliases: [],
      deployment: {
        status,
        loadedAt: isRunning ? new Date().toISOString() : null,
        gpuLayers: null,
        gpuMemoryUsed: null,
        cpuThreads: null,
        expiresAt: null,
      },
      lifecycle: {
        createdAt: raw.modified_at || new Date().toISOString(),
        modifiedAt: raw.modified_at || new Date().toISOString(),
        lastAccessedAt: isRunning ? new Date().toISOString() : null,
        state: status,
      },
      license,
      architecture: arch,
      templateFormat: template.slice(0, 200),
      digest: digest.slice(0, 20),
      tags: [family, quantization.format !== "unknown" ? quantization.format : ""].filter(Boolean),
      metadata: {
        ollamaRaw: { size: raw.size, digest: raw.digest, modified_at: raw.modified_at },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Alias Discovery
  // ---------------------------------------------------------------------------

  async discoverAliases(): Promise<ModelAlias[]> {
    // Ollama doesn't natively support aliases in the API
    // We derive aliases from ModelManifest.json if available
    try {
      const fs = require("fs");
      const path = require("path");
      const manifestPath = path.resolve(process.cwd(), "ModelManifest.json");
      if (fs.existsSync(manifestPath)) {
        const raw = fs.readFileSync(manifestPath, "utf-8");
        const entries: any[] = JSON.parse(raw);
        const aliases: ModelAlias[] = [];
        for (const entry of entries) {
          if (entry.alias && entry.alias !== "none") {
            for (const a of entry.alias.split(",").map((s: string) => s.trim())) {
              aliases.push({
                alias: a,
                modelId: `ollama:${entry.name}`,
                modelName: entry.name,
                providerId: this.id,
                providerName: this.name,
                description: entry.role || "",
                isDefault: false,
              });
            }
          }
        }
        return aliases;
      }
    } catch {}
    return [];
  }

  // ---------------------------------------------------------------------------
  // Endpoint Discovery
  // ---------------------------------------------------------------------------

  async discoverEndpoints(): Promise<Endpoint[]> {
    const health = await this.checkHealth();
    return [{
      id: `${this.id}:main`,
      url: this.baseUrl,
      protocol: "http",
      providerId: this.id,
      providerName: this.name,
      auth: "none",
      status: health.status as any,
      latencyMs: health.latencyMs,
      lastCheckedAt: health.lastCheckedAt,
    }];
  }

  // ---------------------------------------------------------------------------
  // Routes (N/A for Ollama — only gateways have routes)
  // ---------------------------------------------------------------------------

  async discoverRoutes(): Promise<RoutingPolicy[]> {
    return [];
  }

  // ---------------------------------------------------------------------------
  // Inference Statistics (read-only placeholder)
  // ---------------------------------------------------------------------------

  async getInferenceStatistics(): Promise<InferenceStatistics> {
    return {
      providerId: this.id,
      providerName: this.name,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatencyMs: 0,
      p99LatencyMs: 0,
      throughputRps: 0,
      lastRequestAt: null,
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
    if (lower.startsWith("all-minilm") || lower.startsWith("nomic")) return "Embedding";
    if (lower.startsWith("gpt-oss")) return "GPT-OSS";
    if (lower.startsWith("codellama")) return "CodeLlama";
    if (lower.startsWith("starcoder")) return "StarCoder";
    return name.split(":")[0] || "Unknown";
  }

  private extractParameters(name: string, details: any): { display: string; count: number | null } {
    // Try details first
    const paramCount = details?.details?.parameter_size || details?.modelinfo?.["general.parameter_count"];
    if (paramCount) {
      const str = String(paramCount);
      if (str.match(/^\d+$/)) {
        const num = parseInt(str, 10);
        if (num > 1_000_000_000) return { display: `${(num / 1_000_000_000).toFixed(1)}B`, count: num };
        if (num > 1_000_000) return { display: `${(num / 1_000_000).toFixed(0)}M`, count: num };
        return { display: str, count: num };
      }
      return { display: str, count: null };
    }
    // Try to parse from name (e.g., "qwen3:14b")
    const match = name.match(/(\d+(?:\.\d+)?)\s*[bBmM]/);
    if (match) {
      const numStr = match[0];
      const isB = /b/i.test(numStr);
      const val = parseFloat(match[1]);
      const count = isB ? val * 1_000_000_000 : val * 1_000_000;
      return { display: numStr.toUpperCase(), count };
    }
    return { display: "unknown", count: null };
  }

  private extractQuantization(_name: string, details: any): { format: QuantizationFormat; bitsPerWeight: number | null; description: string } {
    const quantLevel = details?.details?.quantization_level;
    if (quantLevel) {
      const format = quantLevel as QuantizationFormat;
      const bitsMap: Record<string, number> = {
        Q2_K: 2, Q3_K_S: 3, Q3_K_M: 3, Q3_K_L: 3,
        Q4_0: 4, Q4_1: 4, Q4_K_S: 4, Q4_K_M: 4,
        Q5_0: 5, Q5_1: 5, Q5_K_S: 5, Q5_K_M: 5,
        Q6_K: 6, Q8_0: 8, fp16: 16, fp32: 32, bf16: 16,
      };
      return {
        format,
        bitsPerWeight: bitsMap[quantLevel] || null,
        description: `${quantLevel} quantization`,
      };
    }
    return { format: "unknown", bitsPerWeight: null, description: "Quantization format not detected" };
  }

  private extractCapabilities(name: string, details: any): Capability[] {
    const caps: Capability[] = [];
    const lower = name.toLowerCase();

    // Always supports chat and streaming for LLMs
    const isEmbedding = lower.includes("minilm") || lower.includes("embed") || lower.includes("nomic");
    if (isEmbedding) {
      caps.push({ name: "embeddings", supported: true, description: "Semantic embedding generation" });
    } else {
      caps.push({ name: "chat", supported: true, description: "Conversational text generation" });
      caps.push({ name: "completion", supported: true, description: "Text completion" });
      caps.push({ name: "streaming", supported: true, description: "Streaming token output" });
    }

    // Vision detection
    const families = details?.details?.families || [];
    if (families.includes("clip") || lower.includes("vision") || lower.includes("llava")) {
      caps.push({ name: "vision", supported: true, description: "Image understanding" });
      caps.push({ name: "image-input", supported: true, description: "Accepts image input" });
    }

    // Tool calling (Qwen, Gemma4, recent models)
    if (lower.includes("qwen") || lower.includes("gemma4") || lower.includes("llama3")) {
      caps.push({ name: "tool-calling", supported: true, description: "Function/tool calling" });
      caps.push({ name: "function-calling", supported: true, description: "Function calling API" });
    }

    // Reasoning (DeepSeek-R1, qwen3)
    if (lower.includes("deepseek-r1") || lower.includes("qwen3")) {
      caps.push({ name: "reasoning", supported: true, description: "Chain-of-thought reasoning" });
    }

    // Code generation
    if (lower.includes("code") || lower.includes("coder") || lower.includes("starcoder") || lower.includes("deepseek")) {
      caps.push({ name: "code-generation", supported: true, description: "Code generation and analysis" });
    }

    // JSON mode (most modern models)
    if (!isEmbedding) {
      caps.push({ name: "json-mode", supported: true, description: "Structured JSON output" });
      caps.push({ name: "temperature", supported: true, description: "Temperature control" });
      caps.push({ name: "top-p", supported: true, description: "Top-p sampling" });
      caps.push({ name: "seed", supported: true, description: "Deterministic seed" });
    }

    return caps;
  }

  private extractContextLength(details: any): number {
    // Try modelinfo
    const ctxLen = details?.modelinfo?.["llama.context_length"]
      || details?.model_info?.["llama.context_length"];
    if (ctxLen) return Number(ctxLen);

    // Try parameters block
    const params = details?.parameters;
    if (params && typeof params === "string") {
      const match = params.match(/num_ctx\s+(\d+)/);
      if (match) return parseInt(match[1], 10);
    }

    return 8192; // Safe default
  }

  private toDisplayName(name: string): string {
    return name
      .replace(/:latest$/, "")
      .split(/[-_:]/)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  private fallbackModels(): AIModel[] {
    // Read from ModelManifest.json as fallback
    try {
      const fs = require("fs");
      const path = require("path");
      const manifestPath = path.resolve(process.cwd(), "ModelManifest.json");
      if (fs.existsSync(manifestPath)) {
        const raw = fs.readFileSync(manifestPath, "utf-8");
        const entries: any[] = JSON.parse(raw);
        return entries.map(entry => this.mapManifestEntry(entry));
      }
    } catch {}
    return [];
  }

  private mapManifestEntry(entry: any): AIModel {
    const name = entry.name || "unknown";
    const params = this.extractParameters(name, null);
    return {
      id: `ollama:${name}`,
      name,
      displayName: this.toDisplayName(name),
      family: this.extractFamily(name),
      providerId: this.id,
      providerName: this.name,
      status: "available",
      parameters: entry.parameters || params.display,
      parameterCount: params.count,
      sizeBytes: this.parseSizeString(entry.size || "0"),
      sizeDisplay: entry.size || "unknown",
      quantization: { format: "unknown", bitsPerWeight: null, description: "Unknown" },
      contextWindow: { inputTokens: 8192, outputTokens: 4096, totalTokens: 8192 },
      capabilities: this.extractCapabilities(name, null),
      aliases: entry.alias && entry.alias !== "none" ? entry.alias.split(",").map((s: string) => s.trim()) : [],
      deployment: { status: "available", loadedAt: null, gpuLayers: null, gpuMemoryUsed: null, cpuThreads: null, expiresAt: null },
      lifecycle: { createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString(), lastAccessedAt: null, state: "available" },
      license: "unknown",
      architecture: "",
      templateFormat: "",
      digest: "",
      tags: [this.extractFamily(name)],
      metadata: { source: "manifest-fallback", role: entry.role || "" },
    };
  }

  private parseSizeString(size: string): number {
    const match = size.match(/([\d.]+)\s*(GB|MB|KB|TB|B)/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
    return Math.round(val * (multipliers[unit] || 1));
  }
}
