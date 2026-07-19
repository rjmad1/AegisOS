import { SubsystemBenchmarkPack } from '../packs';

export const ParticipantRuntimeBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-participant-v1',
    subsystem: 'participant',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-participant-lifecycle',
          engine: 'subsystem',
          priority: 'high',
          warmup: 5,
          iterations: 100,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'throughput', 'architectural-cost'],
          contracts: ['nfr-participant-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-participant-v1'],
    architecturalBudget: {
      id: 'budget-participant-v1',
      subsystem: 'participant',
      allocations: {
        'descriptor_validation': { budget: 10, unit: 'ms' },
        'descriptor_composition': { budget: 15, unit: 'ms' },
        'participant_instantiation': { budget: 25, unit: 'ms' },
        'activation': { budget: 10, unit: 'ms' },
        'suspension': { budget: 10, unit: 'ms' },
        'termination': { budget: 15, unit: 'ms' },
        'context_switching': { budget: 5, unit: 'ms' },
        'memory_overhead': { budget: 20, unit: 'MB' }
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
