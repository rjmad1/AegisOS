import { SubsystemBenchmarkPack } from '../packs';

export const PlatformIntelligenceBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-intelligence-v1',
    subsystem: 'intelligence',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-intelligence-analysis',
          engine: 'subsystem',
          priority: 'high',
          warmup: 1,
          iterations: 10,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'architectural-cost'],
          contracts: ['nfr-intelligence-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-intelligence-v1'],
    architecturalBudget: {
      id: 'budget-intelligence-v1',
      subsystem: 'intelligence',
      allocations: {
        'digital_twin_projection': { budget: 100, unit: 'ms' },
        'recommendation_generation': { budget: 300, unit: 'ms' },
        'analyzer_latency': { budget: 50, unit: 'ms' },
        'architecture_drift_analysis': { budget: 200, unit: 'ms' },
        'optimization_ranking': { budget: 20, unit: 'ms' },
        'dashboard_generation': { budget: 150, unit: 'ms' },
        'memory_overhead': { budget: 250, unit: 'MB' }
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
