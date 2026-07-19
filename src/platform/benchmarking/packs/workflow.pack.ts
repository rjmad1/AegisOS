import { SubsystemBenchmarkPack } from '../packs';

export const WorkflowEngineBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-workflow-v1',
    subsystem: 'workflow',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-workflow-execution',
          engine: 'subsystem',
          priority: 'high',
          warmup: 5,
          iterations: 100,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'throughput', 'architectural-cost'],
          contracts: ['nfr-workflow-latency'],
          reports: ['regression', 'recommendation']
        }
      }
    ],
    performanceContracts: ['contract-workflow-v1'],
    architecturalBudget: {
      id: 'budget-workflow-v1',
      subsystem: 'workflow',
      allocations: {
        'execution_graph_compilation': { budget: 20, unit: 'ms' },
        'workflow_startup': { budget: 10, unit: 'ms' },
        'checkpoint_creation': { budget: 15, unit: 'ms' },
        'checkpoint_recovery': { budget: 30, unit: 'ms' },
        'parallel_scheduling': { budget: 5, unit: 'ms' },
        'critical_path_execution': { budget: 50, unit: 'ms' },
        'workflow_completion': { budget: 10, unit: 'ms' },
        'workflow_teardown': { budget: 10, unit: 'ms' },
        'memory_overhead': { budget: 100, unit: 'MB' }
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
