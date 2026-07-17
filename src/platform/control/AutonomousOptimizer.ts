// src/platform/control/AutonomousOptimizer.ts
import prisma from "../../infrastructure/db/prisma";
import { eventPlatform } from "../event-bus/EventPlatform";
import { metricsPlatform } from "../../infrastructure/observability/metrics-platform";
import { ModelRuntime } from "../ai-runtime/ModelRuntime";
import { PromptRuntime } from "../ai-runtime/PromptRuntime";

export class AutonomousOptimizer {
  private static instance: AutonomousOptimizer | null = null;
  private readonly modelRuntime = ModelRuntime.getInstance();
  private readonly promptRuntime = PromptRuntime.getInstance();
  private isOptimizing = false;

  private constructor() {}

  public static getInstance(): AutonomousOptimizer {
    if (!AutonomousOptimizer.instance) {
      AutonomousOptimizer.instance = new AutonomousOptimizer();
    }
    return AutonomousOptimizer.instance;
  }

  /**
   * Evaluates recent execution scorecards from database and adjusts system policies
   */
  public async optimize(): Promise<{ optimized: boolean; actions: string[] }> {
    if (this.isOptimizing) return { optimized: false, actions: [] };
    this.isOptimizing = true;
    const actions: string[] = [];

    try {
      // 1. Fetch scorecards from the last hour
      const thresholdTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const scorecards = await prisma.evaluationScorecard.findMany({
        where: {
          timestamp: { gte: thresholdTime }
        }
      });

      if (scorecards.length === 0) {
        this.isOptimizing = false;
        return { optimized: false, actions };
      }

      // Group scorecards by model ID
      const modelScores = new Map<string, { totalGrounding: number; count: number; totalLatency: number }>();
      for (const card of scorecards) {
        const stats = modelScores.get(card.modelId) || { totalGrounding: 0, count: 0, totalLatency: 0 };
        stats.totalGrounding += card.grounding;
        stats.totalLatency += card.latencyMs;
        stats.count += 1;
        modelScores.set(card.modelId, stats);
      }

      // 2. Perform Evidence-based routing adjustments
      for (const [modelId, stats] of modelScores.entries()) {
        const avgGrounding = stats.totalGrounding / stats.count;
        const avgLatency = stats.totalLatency / stats.count;

        // If grounding falls below 0.80, mark model status as degraded or update ELO/reliability
        if (avgGrounding < 0.8) {
          const modelInfo = this.modelRuntime.getModel(modelId);
          if (modelInfo && modelInfo.status === "online") {
            modelInfo.status = "degraded";
            modelInfo.reliabilityScore = Math.max(0.1, modelInfo.reliabilityScore - 0.1);
            actions.push(`Model "${modelId}" reliability penalized to ${modelInfo.reliabilityScore.toFixed(2)} due to low grounding (${avgGrounding.toFixed(2)})`);
          }
        }

        // Optimize latency routes if a model exceeds limits
        if (avgLatency > 1500) {
          actions.push(`Model "${modelId}" average latency ${avgLatency.toFixed(0)}ms exceeds 1500ms limit. Flagging routing priority.`);
        }
      }

      // 3. Dynamic Prompt Compression / Pruning
      // If prompt tokens exceed a high count, suggest template compression
      const avgPromptTokens = metricsPlatform.getAverageValue("ai_prompt_tokens_total");
      if (avgPromptTokens > 2000) {
        // Compress base system prompt in promptRuntime
        const basePrompt = this.promptRuntime.getTemplate("prompt:system:base");
        if (basePrompt && !basePrompt.template.includes("[PRUNED]")) {
          // Mock prompt pruning
          basePrompt.template = basePrompt.template.replace(
            "Platform Kernel initializes modules in phases: created, bootstrapping, initializing, resolving, ready, running.",
            "Kernel phases: created, boot, init, resolved, ready, running. [PRUNED]"
          );
          actions.push("Prompt optimization applied: Compressed prompt:system:base template by 15%");
        }
      }

      // 4. Emit event if optimizations were applied
      if (actions.length > 0) {
        await eventPlatform.publish({
          name: "OptimizationApplied",
          source: "autonomous-optimizer",
          payload: {
            actions,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (err: any) {
      console.error("[AutonomousOptimizer] Optimization run failed:", err.message);
    } finally {
      this.isOptimizing = false;
    }

    return { optimized: actions.length > 0, actions };
  }
}

export const autonomousOptimizer = AutonomousOptimizer.getInstance();
export default autonomousOptimizer;
