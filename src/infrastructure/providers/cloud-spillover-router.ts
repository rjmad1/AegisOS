import { hardenedEventBus } from "@/infrastructure/events/event-bus";
import { telemetryTracker } from "@/infrastructure/observability/telemetry";
import { GpuProvider } from "./infrastructure-providers";

export interface SpilloverConfig {
  maxVramUsage: number;
  maxContextTokens: number;
  defaultCloudProvider: "anthropic" | "azure-openai";
}

export class CloudSpilloverRouter {
  private config: SpilloverConfig;
  private lastVramMetrics: { free: number; total: number; usageRatio: number } | null = null;

  constructor(config?: Partial<SpilloverConfig>) {
    this.config = {
      maxVramUsage: 0.9, // 90%
      maxContextTokens: 32000,
      defaultCloudProvider: "azure-openai",
      ...config
    };

    this.subscribeToTelemetryEvents();
  }

  private subscribeToTelemetryEvents(): void {
    try {
      hardenedEventBus.subscribe("SystemHealthReport", (evt: any) => {
        if (evt.payload && evt.payload.vram) {
          const { free, total } = evt.payload.vram;
          const usageRatio = (total - free) / (total || 1);
          this.lastVramMetrics = { free, total, usageRatio };
        }
      });
    } catch (e) {
      console.warn("[CloudSpilloverRouter] Could not attach to hardenedEventBus telemetry feed.");
    }
  }

  /**
   * Determines if a request should bypass local inference and spill over to a cloud provider
   * based on context window size and available system resources.
   */
  public async shouldSpillover(model: any, promptTokens: number): Promise<boolean> {
    // 1. Check if prompt tokens exceed local maximum threshold
    if (promptTokens > this.config.maxContextTokens) {
      console.log(`[CloudSpilloverRouter] Spillover triggered: Prompt tokens (${promptTokens}) exceed local threshold (${this.config.maxContextTokens}).`);
      return true;
    }

    // 2. Check if model size or current VRAM utilization exceeds thresholds using Real-Time Telemetry
    try {
      const gpuProvider = new GpuProvider();
      const gpuData = await gpuProvider.getGpu();
      
      if (gpuData && gpuData.devices && gpuData.devices.length > 0) {
        const dev = gpuData.devices[0];
        const freeVram = dev.vram.free;
        const totalVram = dev.vram.total || (dev.vram.used + dev.vram.free);
        const vramUsageRatio = totalVram > 0 ? (totalVram - freeVram) / totalVram : 0;

        if (vramUsageRatio > this.config.maxVramUsage) {
          console.log(`[CloudSpilloverRouter] Spillover triggered: Live VRAM usage ratio (${(vramUsageRatio * 100).toFixed(1)}%) exceeds configured max (${(this.config.maxVramUsage * 100)}%).`);
          return true;
        }

        if (model.sizeBytes > freeVram) {
          console.log(`[CloudSpilloverRouter] Spillover triggered: Model size (${model.sizeDisplay || model.sizeBytes + ' bytes'}) exceeds available live VRAM (${Math.round(freeVram/1024/1024)} MB free).`);
          return true;
        }
      } else if (this.lastVramMetrics) {
        if (this.lastVramMetrics.usageRatio > this.config.maxVramUsage || model.sizeBytes > this.lastVramMetrics.free) {
          console.log(`[CloudSpilloverRouter] Spillover triggered via event bus telemetry feed.`);
          return true;
        }
      } else {
        // Fallback if no GPU detected
        if (model.sizeBytes > 10 * 1024 * 1024 * 1024) { 
          console.log(`[CloudSpilloverRouter] Spillover triggered: Model size exceeds safe local threshold (no GPU telemetry available).`);
          return true;
        }
      }
    } catch (e) {
      console.warn(`[CloudSpilloverRouter] Failed to query real-time GPU telemetry. Falling back to static checks.`, e);
      if (model.sizeBytes > 10 * 1024 * 1024 * 1024) { 
        console.log(`[CloudSpilloverRouter] Spillover triggered: Model size exceeds safe local threshold (fallback mode).`);
        return true;
      }
    }

    return false;
  }

  /**
   * Routes the request to the configured cloud provider.
   */
  public async routeToCloud(prompt: string, options: any = {}): Promise<any> {
    const provider = this.config.defaultCloudProvider;
    console.log(`[CloudSpilloverRouter] Routing inference request to ${provider}...`);

    if (provider === "azure-openai") {
      // Simulate Azure OpenAI routing
      return this.simulateAzureCall(prompt);
    } else {
      // Simulate Anthropic routing
      return this.simulateAnthropicCall(prompt);
    }
  }

  private async simulateAzureCall(prompt: string) {
    if (!process.env.AZURE_OPENAI_API_KEY) {
      console.warn("[CloudSpilloverRouter] AZURE_OPENAI_API_KEY missing. Simulating fallback response.");
    }
    return {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "gpt-4o",
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: "This is a cloud-routed response from Azure OpenAI due to local resource constraints."
        },
        finish_reason: "stop"
      }],
      usage: {
        prompt_tokens: prompt.length / 4,
        completion_tokens: 18,
        total_tokens: (prompt.length / 4) + 18
      }
    };
  }

  private async simulateAnthropicCall(prompt: string) {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("[CloudSpilloverRouter] ANTHROPIC_API_KEY missing. Simulating fallback response.");
    }
    return {
      id: `msg_${Date.now()}`,
      type: "message",
      role: "assistant",
      content: [
        { type: "text", text: "This is a cloud-routed response from Anthropic Claude due to local resource constraints." }
      ],
      model: "claude-3-5-sonnet-20240620",
      stop_reason: "end_turn",
      usage: {
        input_tokens: prompt.length / 4,
        output_tokens: 18
      }
    };
  }
}
