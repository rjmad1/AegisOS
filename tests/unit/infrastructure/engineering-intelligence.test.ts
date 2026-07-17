// tests/unit/infrastructure/engineering-intelligence.test.ts
// Automated tests verifying EIP (Engineering Intelligence Platform) scoring, prioritization, and brain calculations.

import { describe, it, expect } from "vitest";
import { eipKnowledgeGraph } from "@/infrastructure/intelligence/knowledge-graph";
import { correlationEngine } from "@/infrastructure/intelligence/correlation-engine";
import { predictiveEngine } from "@/infrastructure/intelligence/predictive-engine";
import { recommendationEngine } from "@/infrastructure/intelligence/recommendation-engine";
import { engineeringIntelligenceService } from "@/services/engineering-intelligence.service";

describe("Engineering Intelligence Engine Core Assertions", () => {
  it("should construct structural EIP Knowledge Graph nodes and edges", async () => {
    const graph = await eipKnowledgeGraph.getGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    // Verify presence of core system databases and kernel files
    const dbNode = graph.nodes.find((n) => n.type === "database");
    expect(dbNode).toBeDefined();
    expect(dbNode?.label).toContain("SQLite");

    const fileNode = graph.nodes.find((n) => n.type === "file");
    expect(fileNode).toBeDefined();
    expect(fileNode?.label).toBe("PlatformKernel.ts");
  });

  it("should run correlation rules and output causal timelines", async () => {
    const chains = await correlationEngine.analyzeCorrelations();
    expect(chains.length).toBeGreaterThan(0);

    // The first correlated chain should have a name, primary cause and confidence score
    const firstChain = chains[0];
    expect(firstChain.id).toBeDefined();
    expect(firstChain.name).toBeDefined();
    expect(firstChain.primaryCause).toBeDefined();
    expect(firstChain.confidenceScore).toBeGreaterThanOrEqual(0.5);
  });

  it("should predict future saturation and decay thresholds", async () => {
    const predictions = await predictiveEngine.getPredictions();
    expect(predictions.length).toBeGreaterThan(0);

    // Verify prediction categories and recommendation mitigations
    const capacityPrediction = predictions.find((p) => p.category === "capacity");
    expect(capacityPrediction).toBeDefined();
    expect(capacityPrediction?.recommendedPrevention).toBeDefined();
    expect(capacityPrediction?.probability).toBeGreaterThan(0);
  });

  it("should priority-score engineering recommendations", () => {
    const mockCorrelations = [
      {
        id: "corr:knowledge-hallucination-test",
        timestamp: new Date().toISOString(),
        name: "Test Correlation",
        description: "Test description",
        events: [],
        primaryCause: "Test cause",
        contributingFactors: [],
        affectedComponents: [],
        confidenceScore: 0.9,
        evidenceTrail: ["Test evidence"]
      }
    ];

    const mockPredictions = [
      {
        id: "pred:capacity-test",
        category: "capacity" as const,
        name: "Test Capacity Risk",
        description: "Test capacity description",
        probability: 0.8,
        estimatedTime: "2 days",
        businessImpact: "high" as const,
        operationalImpact: "critical" as const,
        recommendedPrevention: "Upgrade RAM",
        confidenceScore: 0.9
      }
    ];

    const recommendations = recommendationEngine.generateRecommendations(mockCorrelations, mockPredictions);
    expect(recommendations.length).toBeGreaterThan(0);

    // Assert priority score calculations and status defaults
    const rec = recommendations[0];
    expect(rec.priorityScore).toBeGreaterThan(0);
    expect(rec.status).toBe("pending");
    expect(rec.alternativeActions.length).toBeGreaterThan(0);
  });

  it("should compute overall Platform Health Index and Maturity levels within limits", async () => {
    const summary = await engineeringIntelligenceService.runIntelligenceAnalysis();
    expect(summary.platformHealthIndex).toBeGreaterThanOrEqual(0);
    expect(summary.platformHealthIndex).toBeLessThanOrEqual(100);

    expect(summary.engineeringMaturityLevel).toBeGreaterThanOrEqual(1);
    expect(summary.engineeringMaturityLevel).toBeLessThanOrEqual(5);

    expect(summary.maturityIndexes.modularity).toBeDefined();
    expect(summary.maturityIndexes.observability).toBeDefined();
    expect(summary.topOpportunities.length).toBeLessThanOrEqual(2);
  });
});
