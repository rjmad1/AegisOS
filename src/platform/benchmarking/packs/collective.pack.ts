import { SubsystemBenchmarkPack } from '../packs';

export const CollectiveIntelligenceBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-collective-v1',
    subsystem: 'collective',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-collective-operations',
          engine: 'subsystem',
          priority: 'high',
          warmup: 2,
          iterations: 50,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'architectural-cost'],
          contracts: ['nfr-collective-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-collective-v1'],
    architecturalBudget: {
      id: 'budget-collective-v1',
      subsystem: 'collective',
      allocations: {
        'reasoning_strategy_latency': { budget: 30, unit: 'ms' },
        'critique_latency': { budget: 500, unit: 'ms' },
        'consensus_latency': { budget: 400, unit: 'ms' },
        'reflection_generation': { budget: 600, unit: 'ms' },
        'strategy_retrieval': { budget: 15, unit: 'ms' },
        'confidence_calculation': { budget: 5, unit: 'ms' },
        'memory_overhead': { budget: 200, unit: 'MB' }
      }
    },
    artifacts: {
      generateProvenanceManifest: true,
      generateArchitecturalCostBenchmark: true,
      generateSubsystemPerformanceContract: true,
      generateRegressionReport: true,
      generateOptimizationRecommendations: true
    }
  }
};
