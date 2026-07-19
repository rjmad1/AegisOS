/**
 * Universal Benchmark Interfaces
 * 
 * Defines the strict contractual boundaries for the Benchmark Execution Model.
 */
import { BenchmarkExecutionContext } from './context';
import { BenchmarkLifecycleState } from './lifecycle';
import { Metric } from '../observability/types';
import { BenchmarkProvenanceManifest } from './types';
import { 
  PerformanceContract, 
  RegressionDecision,
  BudgetEvaluationResult
} from '../performance-governance/types';

export interface IBenchmarkScenario {
  id: string;
  name: string;
  description: string;
  prepare(context: BenchmarkExecutionContext): Promise<void>;
  execute(context: BenchmarkExecutionContext): Promise<void>;
  cleanup(context: BenchmarkExecutionContext): Promise<void>;
}

export interface IBenchmark {
  id: string;
  name: string;
  scenarios: IBenchmarkScenario[];
}

export interface IBenchmarkSuite {
  id: string;
  name: string;
  benchmarks: IBenchmark[];
}

export interface IBenchmarkCollector {
  start(context: BenchmarkExecutionContext): void;
  stop(context: BenchmarkExecutionContext): void;
  getMetrics(): Promise<Metric[]>;
}

export interface AggregatedMetrics {
  [metricName: string]: {
    raw: number[];
    median: number;
    p50: number;
    p95: number;
    p99: number;
    mad: number;
    variance: number;
    standardDeviation: number;
  }
}

export interface IBenchmarkAnalyzer {
  aggregate(metrics: Metric[], warmUpExclusionCount?: number): AggregatedMetrics;
  detectOutliers(aggregated: AggregatedMetrics): AggregatedMetrics;
}

export interface ContractEvaluationResult {
  passed: boolean;
  decisions: Record<string, RegressionDecision>;
  contract: PerformanceContract;
  budgetEvaluation?: BudgetEvaluationResult;
}

export interface IBenchmarkValidator {
  evaluate(aggregated: AggregatedMetrics, context: BenchmarkExecutionContext): Promise<ContractEvaluationResult>;
}

export interface SubsystemPerformanceContract {
  id: string;
  subsystem: string;
  metrics: {
    expectedLatency: number;
    expectedThroughput: number;
    expectedMemory: number;
    expectedCpu: number;
    expectedGpu?: number;
    expectedScalability: string;
    expectedReliability: string;
    expectedVariance: number;
    expectedRegressionThresholds: Record<string, number>;
  };
}

export interface ArchitecturalCostBenchmark {
  subsystem: string;
  costProfile: Record<string, number>; // Maps metric names to values
}

export interface RegressionReport {
  healthScore: number;
  performanceScore: number;
  resourceEfficiency: number;
  regressionScore: number;
  historicalTrends: Record<string, number[]>;
  decisions: Record<string, RegressionDecision>;
}

export interface OptimizationRecommendation {
  id: string;
  subsystem: string;
  type: string;
  description: string;
  expectedImpact: string;
}

export interface BenchmarkOutputArtifacts {
  provenance: BenchmarkProvenanceManifest;
  telemetryBundle: Metric[];
  aggregatedMetrics: AggregatedMetrics;
  evaluationResult: ContractEvaluationResult;
  // Pack-specific outputs
  architecturalCostBenchmark?: ArchitecturalCostBenchmark;
  subsystemPerformanceContract?: SubsystemPerformanceContract;
  regressionReport?: RegressionReport;
  optimizationRecommendations?: OptimizationRecommendation[];
}

export interface IBenchmarkArtifactProvider {
  generate(
    context: BenchmarkExecutionContext, 
    metrics: Metric[], 
    aggregated: AggregatedMetrics, 
    evaluation: ContractEvaluationResult
  ): Promise<BenchmarkOutputArtifacts>;
}

export interface IBenchmarkReporter {
  report(artifacts: BenchmarkOutputArtifacts): Promise<void>;
}

export interface IBenchmarkExecutionEngine {
  readonly engineType: string;
  execute(benchmark: IBenchmark, context: BenchmarkExecutionContext): Promise<void>;
}

export interface IBenchmarkOrchestrator {
  executeDescriptor(descriptor: import('./descriptor').BenchmarkSuiteDescriptor): Promise<BenchmarkOutputArtifacts>;
  executePack(pack: import('./packs').SubsystemBenchmarkPack): Promise<BenchmarkOutputArtifacts[]>;
  getLifecycleState(): BenchmarkLifecycleState;
}

export interface IBenchmarkScheduler {
  schedule(descriptors: import('./descriptor').BenchmarkSuiteDescriptor[]): Promise<BenchmarkOutputArtifacts[]>;
  schedulePacks(packs: import('./packs').SubsystemBenchmarkPack[]): Promise<BenchmarkOutputArtifacts[][]>;
}
