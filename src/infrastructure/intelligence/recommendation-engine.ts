// src/infrastructure/intelligence/recommendation-engine.ts
// EIP Recommendation, Prioritization, and Continuous Learning Engine.

import * as fs from "fs";
import * as path from "path";
import { CorrelatedEventChain } from "./correlation-engine";
import { EngineeringPrediction } from "./predictive-engine";

export interface AlternativeAction {
  action: string;
  pros: string;
  cons: string;
}

export interface EngineeringRecommendation {
  id: string;
  title: string;
  problemStatement: string;
  evidence: string;
  rootCause: string;
  recommendedAction: string;
  alternativeActions: AlternativeAction[];
  tradeOffs: string;
  dependencies: string[];
  estimatedEngineeringEffort: "low" | "medium" | "high";
  estimatedBusinessValue: number; // 1-10
  estimatedRiskReduction: number; // 1-10
  estimatedCostUsd: number;
  architecturalImpact: string;
  operationalImpact: string;
  securityImpact: string;
  performanceImpact: string;
  implementationOrder: number;
  rollbackStrategy: string;
  successCriteria: string;
  priorityScore: number;
  status: "pending" | "approved" | "rejected" | "snoozed" | "implemented";
  outcomeMessage?: string;
  timestamp: string;
}

export interface LearningOutcome {
  recommendationId: string;
  title: string;
  status: string;
  expectedValue: number;
  actualValue?: number;
  expectedEffort: string;
  actualEffort?: string;
  didSolveProblem: boolean;
  performanceGainMs?: number;
  costSavingUsd?: number;
  timestamp: string;
}

export class RecommendationEngine {
  private static instance: RecommendationEngine | null = null;
  private memoryPath: string;
  private recommendations: EngineeringRecommendation[] = [];
  private outcomes: LearningOutcome[] = [];

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    this.memoryPath = path.resolve(dbDir, "engineering_brain.json");
    this.loadMemory();
  }

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  private loadMemory() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const raw = fs.readFileSync(this.memoryPath, "utf-8");
        const data = JSON.parse(raw);
        this.recommendations = data.recommendations || [];
        this.outcomes = data.outcomes || [];
      } else {
        this.bootstrapMemory();
      }
    } catch (err) {
      console.error("[RecommendationEngine] Failed to load brain memory:", err);
    }
  }

  private saveMemory() {
    try {
      const data = {
        recommendations: this.recommendations,
        outcomes: this.outcomes
      };
      fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[RecommendationEngine] Failed to save brain memory:", err);
    }
  }

  private bootstrapMemory() {
    // Populate some historical completed recommendations for continuous learning demo
    this.outcomes = [
      {
        recommendationId: "hist-rec-001",
        title: "Evict Stale Memory Store Cache Files",
        status: "implemented",
        expectedValue: 7,
        actualValue: 8,
        expectedEffort: "low",
        actualEffort: "low",
        didSolveProblem: true,
        performanceGainMs: 120,
        costSavingUsd: 0.05,
        timestamp: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        recommendationId: "hist-rec-002",
        title: "Adjust Model Router Fallback Concurrency Caps",
        status: "implemented",
        expectedValue: 8,
        actualValue: 6,
        expectedEffort: "medium",
        actualEffort: "high",
        didSolveProblem: true,
        performanceGainMs: 400,
        costSavingUsd: 0.12,
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ];
    this.saveMemory();
  }

  /**
   * Generates a list of engineering recommendations based on correlations and predictions.
   */
  public generateRecommendations(
    correlations: CorrelatedEventChain[],
    predictions: EngineeringPrediction[]
  ): EngineeringRecommendation[] {
    const freshRecs: EngineeringRecommendation[] = [];
    const now = new Date().toISOString();

    // 1. If correlation on knowledge content drift is active
    const knowCorr = correlations.find((c) => c.id.includes("knowledge-hallucination"));
    if (knowCorr) {
      freshRecs.push({
        id: "rec:knowledge-sync",
        title: "Vector Embeddings & Semantic Index Sync",
        problemStatement: "Content drift in markdown reference documentation is causing the RAG pipeline to source stale embeddings, resulting in model hallucinations during evaluation.",
        evidence: knowCorr.evidenceTrail.join(" "),
        rootCause: knowCorr.primaryCause,
        recommendedAction: "Trigger an automated re-indexing script (`npm run knowledge:sync`) to re-chunk and write fresh vector embeddings to the RAG memory store.",
        alternativeActions: [
          { action: "Disable RAG and route prompts raw", pros: "Zero latency overhead, no drift dependencies.", cons: "Significant accuracy regression; increases grounding failures." },
          { action: "Double vector chunk overlap ratios", pros: "Increases contextual coverage.", cons: "Doubles token consumption cost and processing latency." }
        ],
        tradeOffs: "Requires small temporary processing overhead (approx 450ms per document) during vector generation.",
        dependencies: ["databases/dev.db"],
        estimatedEngineeringEffort: "low",
        estimatedBusinessValue: 9,
        estimatedRiskReduction: 8,
        estimatedCostUsd: 0.08,
        architecturalImpact: "Updates the semantic retrieval cache parameters.",
        operationalImpact: "Resolves ongoing hallucination spikes and improves user SLA trust.",
        securityImpact: "Restores document level compliance checks.",
        performanceImpact: "Minor temporary API latency hit during ingestion, followed by normal baseline routing.",
        implementationOrder: 1,
        rollbackStrategy: "Restore previous vector store index backup (`restore.bat`).",
        successCriteria: "Evaluation scorecard grounding rating exceeds 90% over next 10 consecutive API triggers.",
        priorityScore: 0,
        status: "pending",
        timestamp: now
      });
    }

    // 2. If correlation on architectural boundary violations is active
    const archCorr = correlations.find((c) => c.id.includes("arch-bypass"));
    if (archCorr) {
      freshRecs.push({
        id: "rec:arch-eslint-gate",
        title: "Enforce ESLint Pre-push Boundary Gates",
        problemStatement: "View components bypass the Platform SDK facade, directly importing backend repositories, leading to circular dependency blocks.",
        evidence: archCorr.evidenceTrail.join(" "),
        rootCause: archCorr.primaryCause,
        recommendedAction: "Add custom ESLint rule constraints inside `eslint.config.mjs` to block compiling when views attempt direct deep infrastructure imports.",
        alternativeActions: [
          { action: "Manually code review pull requests", pros: "No build system updates required.", cons: "Prone to human error; fails to prevent developer workstation compiler drift." }
        ],
        tradeOffs: "Adds approximately 4.5 seconds to build and pre-push validation script execution runs.",
        dependencies: ["package.json", "eslint.config.mjs"],
        estimatedEngineeringEffort: "medium",
        estimatedBusinessValue: 7,
        estimatedRiskReduction: 9,
        estimatedCostUsd: 0,
        architecturalImpact: "Hardens strict compliance with C4 modularity principles.",
        operationalImpact: "Saves developer build time and eliminates compilation runtime circular blocks.",
        securityImpact: "Enforces least-privilege boundary checks.",
        performanceImpact: "No change to operational latency.",
        implementationOrder: 2,
        rollbackStrategy: "Remove the pre-push boundary hook definition from git configs.",
        successCriteria: "Fitness violations report count drops to 0 and stays clean on successive commits.",
        priorityScore: 0,
        status: "pending",
        timestamp: now
      });
    }

    // 3. If correlation on SQLite write lock stagnation is active
    const dbCorr = correlations.find((c) => c.id.includes("db-stagnation"));
    if (dbCorr) {
      freshRecs.push({
        id: "rec:db-wal-journaling",
        title: "Activate SQLite WAL Journal Mode",
        problemStatement: "Concurrent write checkpoints to the database trigger sqlite write-lock contention, causing workflow timeouts.",
        evidence: dbCorr.evidenceTrail.join(" "),
        rootCause: dbCorr.primaryCause,
        recommendedAction: "Execute a schema initializer command: `PRISMA_CLIENT_ENGINE_TYPE=binary prisma db execute --stdin 'PRAGMA journal_mode=WAL;'`.",
        alternativeActions: [
          { action: "Migrate SQLite database to PostgreSQL/AlloyDB", pros: "Native multi-connection concurrency and locking.", cons: "Adds complex hosting infrastructure, configuration parameters, and total cost of ownership." }
        ],
        tradeOffs: "Creates a secondary `.db-wal` file on disk, requiring minor storage headroom.",
        dependencies: ["prisma/schema.prisma"],
        estimatedEngineeringEffort: "low",
        estimatedBusinessValue: 8,
        estimatedRiskReduction: 8,
        estimatedCostUsd: 0,
        architecturalImpact: "Improves data persistence concurrency without changing client repository schemas.",
        operationalImpact: "Decreases write wait bottlenecks from 150ms to < 5ms.",
        securityImpact: "Maintains existing encryption and database settings.",
        performanceImpact: "Increases workflow execution throughput by up to 300%.",
        implementationOrder: 3,
        rollbackStrategy: "Execute command to return journal mode to default `DELETE` mode.",
        successCriteria: "Workflow execution failure rates drop to 0.00% under peak simulation loads.",
        priorityScore: 0,
        status: "pending",
        timestamp: now
      });
    }

    // 4. Default capacity warning recommendation
    const capPred = predictions.find((p) => p.category === "capacity");
    if (capPred) {
      freshRecs.push({
        id: "rec:concurrency-routing-cap",
        title: "LiteLLM Router Concurrency & Fallbacks Caps",
        problemStatement: "High concurrent prompt inference runs risk saturating VRAM limits, triggering slow CPU-offloading fallback delays.",
        evidence: capPred.description,
        rootCause: "Suboptimal routing rules executing massive reasoning models concurrently on local hardware.",
        recommendedAction: "Configure a LiteLLM routing cap in the environment variables, prioritizing light models like `smollm:135m` for simple routing/parsing checks.",
        alternativeActions: [
          { action: "Deploy dedicated external LLM endpoint", pros: "Offloads local hardware limits.", cons: "Incurs external cloud token costs and data sovereignty risks." }
        ],
        tradeOffs: "Simple tasks routed to smaller models may experience minor reasoning completeness regressions.",
        dependencies: ["ModelManifest.json"],
        estimatedEngineeringEffort: "low",
        estimatedBusinessValue: 6,
        estimatedRiskReduction: 7,
        estimatedCostUsd: 0,
        architecturalImpact: "Decouples complex reasoning prompts from lightweight orchestration loops.",
        operationalImpact: "Saves local GPU VRAM headroom.",
        securityImpact: "No change.",
        performanceImpact: "Reduces average prompt evaluation latency from 450ms to 90ms for simple queries.",
        implementationOrder: 4,
        rollbackStrategy: "Restore default router aliases in ModelManifest configuration.",
        successCriteria: "System VRAM ratio remains below 85% during parallel multi-agent executions.",
        priorityScore: 0,
        status: "pending",
        timestamp: now
      });
    }

    // Prioritize and sync with memory
    freshRecs.forEach((r) => {
      // Calculate Priority Score
      const complexity = r.estimatedEngineeringEffort === "high" ? 3 : r.estimatedEngineeringEffort === "medium" ? 2 : 1;
      const costFactor = r.estimatedCostUsd > 0.05 ? 2 : 1;
      
      const numerator = r.estimatedBusinessValue * 0.2 + r.estimatedRiskReduction * 0.25 + 7 * 0.15 + 8 * 0.2 + 6 * 0.1;
      const denominator = complexity * 0.5 + costFactor * 0.5;
      r.priorityScore = parseFloat((numerator / denominator).toFixed(2));

      // Sync status if already exists in memory
      const existing = this.recommendations.find((mem) => mem.id === r.id);
      if (existing) {
        r.status = existing.status;
        r.outcomeMessage = existing.outcomeMessage;
      }
    });

    // Merge new recommendations with existing memory recommendations, maintaining user status changes
    this.recommendations = freshRecs.map((newRec) => {
      const match = this.recommendations.find((m) => m.id === newRec.id);
      return match ? { ...newRec, status: match.status, outcomeMessage: match.outcomeMessage } : newRec;
    });

    this.saveMemory();
    return this.recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Action triggers from human dashboard clicks (HITL governance)
   */
  public updateRecommendationStatus(
    id: string,
    action: "approve" | "reject" | "snooze" | "implemented",
    feedback?: string
  ): boolean {
    const rec = this.recommendations.find((r) => r.id === id);
    if (!rec) return false;

    if (action === "approve") {
      rec.status = "approved";
      rec.outcomeMessage = feedback || "Approved for execution by Engineering Leadership.";
    } else if (action === "reject") {
      rec.status = "rejected";
      rec.outcomeMessage = feedback || "Rejected by Engineering Review Board.";
    } else if (action === "snooze") {
      rec.status = "snoozed";
      rec.outcomeMessage = feedback || "Snoozed for next prioritization sprint.";
    } else if (action === "implemented") {
      rec.status = "implemented";
      rec.outcomeMessage = feedback || "Mitigation action applied and verified.";

      // Record in Learning Outome Ledger
      this.outcomes.push({
        recommendationId: rec.id,
        title: rec.title,
        status: "implemented",
        expectedValue: rec.estimatedBusinessValue,
        actualValue: rec.estimatedBusinessValue, // Default match, can adapt over time
        expectedEffort: rec.estimatedEngineeringEffort,
        actualEffort: rec.estimatedEngineeringEffort,
        didSolveProblem: true,
        timestamp: new Date().toISOString()
      });
    }

    this.saveMemory();
    return true;
  }

  public getOutcomes(): LearningOutcome[] {
    return this.outcomes;
  }

  public getRecommendations(): EngineeringRecommendation[] {
    return this.recommendations;
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();
export default recommendationEngine;
