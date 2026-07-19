import { SubsystemBenchmarkPack } from '../packs';

export const CapabilityFrameworkBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-capability-v1',
    subsystem: 'capability',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-capability-lifecycle',
          engine: 'subsystem',
          priority: 'high',
          warmup: 5,
          iterations: 100,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'throughput', 'architectural-cost'],
          contracts: ['nfr-capability-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-capability-v1'],
    architecturalBudget: {
      id: 'budget-capability-v1',
      subsystem: 'capability',
      allocations: {
        'discovery': { budget: 15, unit: 'ms' },
        'trust_validation': { budget: 20, unit: 'ms' },
        'sandbox_startup': { budget: 50, unit: 'ms' },
        'capability_acquisition': { budget: 100, unit: 'ms' },
        'capability_execution_overhead': { budget: 5, unit: 'ms' },
        'capability_release': { budget: 10, unit: 'ms' },
        'capability_unload': { budget: 20, unit: 'ms' },
        'cache_effectiveness': { budget: 95, unit: 'percent' },
        'memory_overhead': { budget: 30, unit: 'MB' }
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
