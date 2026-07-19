import { SubsystemBenchmarkPack } from '../packs';

export const AgentRuntimeBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-agent-v1',
    subsystem: 'agent',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-agent-cognition',
          engine: 'subsystem',
          priority: 'high',
          warmup: 2,
          iterations: 20,
          collectors: ['cpu', 'memory', 'latency', 'token_usage'],
          analyzers: ['latency', 'throughput', 'architectural-cost'],
          contracts: ['nfr-agent-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-agent-v1'],
    architecturalBudget: {
      id: 'budget-agent-v1',
      subsystem: 'agent',
      allocations: {
        'observation': { budget: 20, unit: 'ms' },
        'reasoning': { budget: 1500, unit: 'ms' },
        'planning': { budget: 1000, unit: 'ms' },
        'workflow_compilation': { budget: 50, unit: 'ms' },
        'reflection': { budget: 800, unit: 'ms' },
        'consensus': { budget: 500, unit: 'ms' },
        'delegation': { budget: 20, unit: 'ms' },
        'memory_retrieval': { budget: 30, unit: 'ms' },
        'memory_overhead': { budget: 150, unit: 'MB' }
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
