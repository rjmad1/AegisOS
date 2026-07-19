import { BenchmarkSuiteDescriptor } from './descriptor';
import { ArchitecturalBudgetContract } from '../performance-governance/types';

/**
 * Subsystem Benchmark Pack (SBP)
 * 
 * A declarative, versioned collection of benchmark suites representing one subsystem.
 * Encapsulates the execution requirements and constraints (budgets/contracts) for 
 * validating a subsystem's performance and architectural fitness.
 */
export interface SubsystemBenchmarkPack {
  pack: {
    /**
     * Unique identifier for the benchmark pack.
     */
    id: string;

    /**
     * The subsystem this pack evaluates (e.g., 'kernel', 'workflow', 'collective').
     */
    subsystem: string;

    /**
     * Version of the pack structure/requirements.
     */
    version: string;

    /**
     * The declarative benchmark suites to execute as part of this pack.
     */
    suites: BenchmarkSuiteDescriptor[];

    /**
     * References to the performance contracts this pack evaluates against.
     */
    performanceContracts: string[]; // References by ID to the NFR Registry

    /**
     * The architectural budgets allocated for this subsystem.
     */
    architecturalBudget: ArchitecturalBudgetContract;

    /**
     * Configuration for generating the expected 5 artifacts.
     */
    artifacts: {
      generateProvenanceManifest: boolean;
      generateArchitecturalCostBenchmark: boolean;
      generateSubsystemPerformanceContract: boolean;
      generateRegressionReport: boolean;
      generateOptimizationRecommendations: boolean;
    };
  };
}
