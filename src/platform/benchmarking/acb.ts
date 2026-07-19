/**
 * Architectural Cost Benchmark (ACB)
 * 
 * Measures the cost of the architecture itself, segregating
 * latency into discrete categories to isolate platform overhead
 * from business logic, LLM generation, tool execution, and persistence.
 */

export interface ArchitecturalCostMetrics {
  totalTimeMs: number;
  platformOverheadMs: number;
  llmTimeMs: number;
  businessLogicMs: number;
  toolExecutionMs: number;
  persistenceMs: number;
  
  // Specific internal subsystem breakdowns (sub-segments of platformOverhead)
  workflowOverheadMs?: number;
  capabilityOverheadMs?: number;
  memoryOverheadMs?: number;
  policyOverheadMs?: number;
}

export interface ArchitecturalCostReport {
  scenarioName: string;
  totalTimeMs: number;
  breakdown: ArchitecturalCostMetrics;
  platformOverheadPercentage: number;
}

export class ArchitecturalCostAnalyzer {
  static analyze(metrics: ArchitecturalCostMetrics, scenarioName: string): ArchitecturalCostReport {
    const platformPercentage = (metrics.platformOverheadMs / metrics.totalTimeMs) * 100;

    return {
      scenarioName,
      totalTimeMs: metrics.totalTimeMs,
      breakdown: metrics,
      platformOverheadPercentage: Number(platformPercentage.toFixed(2))
    };
  }
}
