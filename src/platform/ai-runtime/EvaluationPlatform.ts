import { EvaluationResult } from "./types";
import prisma from "../../infrastructure/db/prisma";

interface GoldenPrompt {
  id: string;
  prompt: string;
  expectedKeywords: string[];
  referenceText: string;
}

export class EvaluationPlatform {
  private static instance: EvaluationPlatform | null = null;
  private goldenPrompts: Map<string, GoldenPrompt> = new Map();
  private resultsHistory: EvaluationResult[] = [];

  private constructor() {
    this.seedGoldenPrompts();
  }

  public static getInstance(): EvaluationPlatform {
    if (!EvaluationPlatform.instance) {
      EvaluationPlatform.instance = new EvaluationPlatform();
    }
    return EvaluationPlatform.instance;
  }

  private seedGoldenPrompts(): void {
    const goldens: GoldenPrompt[] = [
      {
        id: "golden:kernel-boot",
        prompt: "How does the Platform Kernel boot?",
        expectedKeywords: ["bootstrapping", "initializing", "resolving", "ready", "running"],
        referenceText: "The kernel executes boot stages: bootstrapping, initializing, resolving, ready, and running.",
      },
      {
        id: "golden:security-rbac",
        prompt: "Explain security role checks in the gateway.",
        expectedKeywords: ["RBAC", "policy", "authorizeRole", "admin"],
        referenceText: "Gateway security uses RBAC policies to authorize role permissions for active sessions.",
      },
    ];

    for (const g of goldens) {
      this.goldenPrompts.set(g.id, g);
    }
  }

  public registerGoldenPrompt(id: string, prompt: string, expectedKeywords: string[], referenceText: string): void {
    this.goldenPrompts.set(id, { id, prompt, expectedKeywords, referenceText });
  }

  public getHistory(): EvaluationResult[] {
    return this.resultsHistory;
  }

  /**
   * Evaluates the LLM response output against the golden prompt standards.
   * Calculates grounding score, checks for hallucinated facts, and enforces safety boundaries.
   */
  public async evaluateOutput(
    promptId: string,
    modelId: string,
    output: string,
    latencyMs: number,
    costUsd: number,
    correlationId?: string,
    traceId?: string
  ): Promise<EvaluationResult> {
    const golden = this.goldenPrompts.get(promptId);
    
    let groundingScore = 1.0;
    let hallucinationIndex = 0.0;
    let safetyViolation = false;
    let qualityRating = 5;

    if (golden) {
      // 1. Calculate grounding score: check presence of expected keywords
      const matched = golden.expectedKeywords.filter((k) =>
        output.toLowerCase().includes(k.toLowerCase())
      );
      groundingScore = matched.length / golden.expectedKeywords.length;

      // 2. Hallucination index: check if output text is extremely short or contains conflicting words
      if (output.length < 15) {
        hallucinationIndex = 0.8; // High chance of empty/hallucinated fallback
      } else if (output.toLowerCase().includes("error") || output.toLowerCase().includes("undefined")) {
        hallucinationIndex = 0.4;
      }

      // Quality rating matches grounding score
      qualityRating = Math.max(1, Math.round(groundingScore * 5));
    }

    // 3. Safety validation: verify no credential leaks (common security rule)
    if (output.includes("sha256-sig-") || output.includes("super-secret-random-hash-key")) {
      safetyViolation = true;
      qualityRating = 1;
    }

    const result: EvaluationResult = {
      id: `eval:${promptId}:${Date.now()}`,
      promptId,
      modelId,
      latencyMs,
      costUsd,
      hallucinationIndex,
      groundingScore,
      safetyViolation,
      qualityRating,
      timestamp: new Date().toISOString(),
    };

    // Save to Database Scorecard table
    try {
      let alreadyExists = false;
      if (correlationId) {
        const existing = await prisma.evaluationScorecard.findFirst({
          where: { correlationId }
        });
        if (existing) {
          alreadyExists = true;
          console.log(`[EvaluationPlatform] Scorecard already exists for correlationId: ${correlationId}. Skipping duplicate write.`);
        }
      }

      if (!alreadyExists) {
        await prisma.evaluationScorecard.create({
          data: {
            id: result.id,
            timestamp: result.timestamp,
            correlationId: correlationId || `corr-${result.id.split(':').pop()}`,
            traceId: traceId || `trace-${result.id.split(':').pop()}`,
            promptId: result.promptId,
            modelId: result.modelId,
            correctness: result.groundingScore,
            completeness: result.groundingScore >= 0.8 ? 1.0 : 0.5,
            grounding: result.groundingScore,
            confidence: result.groundingScore,
            security: result.safetyViolation ? 0.0 : 1.0,
            compliance: result.safetyViolation ? 0.0 : 1.0,
            latencyMs: result.latencyMs,
            costUsd: result.costUsd,
            businessValue: result.qualityRating >= 4 ? 1.0 : 0.5,
            userObjectiveFulfilled: result.groundingScore >= 0.8 && !result.safetyViolation,
            safetyViolation: result.safetyViolation,
            details: JSON.stringify(result)
          }
        });

        // Register Prompt and Model lineage in EKG and Digital Twin (Program 8.7)
        try {
          const { knowledgeGraphEngine } = require("../knowledge/KnowledgeGraphEngine");
          const { platformTwin } = require("../pik/twin/PlatformDigitalTwin");

          knowledgeGraphEngine.addNode({
            id: `prompt:${result.promptId}`,
            label: `Prompt: ${result.promptId}`,
            type: 'data',
            properties: { promptId: result.promptId },
            lineageId: `prompt:${result.promptId}`,
            version: '1.0.0',
            owner: 'system',
            confidence: 1.0,
            trustScore: 1.0,
            sourceReferences: []
          });

          knowledgeGraphEngine.addNode({
            id: `model:${result.modelId}`,
            label: `Model: ${result.modelId}`,
            type: 'model',
            properties: { modelId: result.modelId },
            lineageId: `model:${result.modelId}`,
            version: '1.0.0',
            owner: 'system',
            confidence: 1.0,
            trustScore: 1.0,
            sourceReferences: []
          });

          knowledgeGraphEngine.addRelationship({
            sourceId: `prompt:${result.promptId}`,
            targetId: `model:${result.modelId}`,
            type: 'evaluated_on',
            weight: result.qualityRating / 5.0,
            trustScore: result.safetyViolation ? 0.0 : 1.0,
            metadata: {
              timestamp: result.timestamp,
              cost: result.costUsd,
              latency: result.latencyMs,
              correctness: result.groundingScore,
              safetyViolation: result.safetyViolation
            }
          });

          platformTwin.live.upsertNode(`prompt:${result.promptId}`, 'Prompt', {
            name: `Prompt: ${result.promptId}`,
            status: result.safetyViolation ? 'degraded' : 'healthy'
          });
          platformTwin.live.upsertNode(`model:${result.modelId}`, 'Model', {
            name: `Model: ${result.modelId}`,
            status: 'healthy'
          });
        } catch (lErr: any) {
          console.warn("[EvaluationPlatform] EKG/Twin lineage sync failed:", lErr.message);
        }
      }
    } catch (err: any) {
      console.warn("[EvaluationPlatform] Failed to write scorecard to database:", err.message);
    }

    this.resultsHistory.push(result);
    return result;
  }

  /**
   * Model Benchmarking Runner: Runs all golden prompts against a simulated model
   * to output aggregate accuracy, speed, and reliability metrics.
   */
  public async runModelBenchmark(modelId: string): Promise<{ avgLatencyMs: number; accuracy: number; qualityScore: number }> {
    console.log(`[EvaluationPlatform] Benchmarking model: "${modelId}"`);

    let totalLatency = 0;
    let totalGrounding = 0;
    let totalQuality = 0;
    const count = this.goldenPrompts.size;

    for (const golden of this.goldenPrompts.values()) {
      // Simulate execution latency
      const lat = 200 + Math.random() * 300;
      totalLatency += lat;

      // Simulate output response matching reference
      const simulatedOutput = `${golden.referenceText} (Simulated execution on ${modelId})`;
      const evalRes = await this.evaluateOutput(golden.id, modelId, simulatedOutput, lat, 0.001);
      
      totalGrounding += evalRes.groundingScore;
      totalQuality += evalRes.qualityRating;
    }

    return {
      avgLatencyMs: totalLatency / count,
      accuracy: totalGrounding / count,
      qualityScore: totalQuality / count,
    };
  }
}
export default EvaluationPlatform;
