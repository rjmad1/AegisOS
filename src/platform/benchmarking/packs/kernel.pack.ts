import { SubsystemBenchmarkPack } from '../packs';

export const PlatformKernelBenchmarkPack: SubsystemBenchmarkPack = {
  pack: {
    id: 'pack-kernel-v1',
    subsystem: 'kernel',
    version: '1.0.0',
    suites: [
      {
        suite: {
          id: 'suite-kernel-startup',
          engine: 'subsystem',
          priority: 'high',
          warmup: 5,
          iterations: 100,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'throughput', 'architectural-cost'],
          contracts: ['nfr-kernel-latency'],
          reports: ['regression', 'recommendation']
        }
      },
      {
        suite: {
          id: 'suite-kernel-lifecycle',
          engine: 'subsystem',
          priority: 'high',
          warmup: 2,
          iterations: 50,
          collectors: ['cpu', 'memory', 'latency'],
          analyzers: ['latency', 'architectural-cost'],
          contracts: ['nfr-kernel-lifecycle'],
          reports: ['regression']
        }
      }
    ],
    performanceContracts: ['contract-kernel-v1'],
    architecturalBudget: {
      id: 'budget-kernel-v1',
      subsystem: 'kernel',
      allocations: {
        'boot_time': { budget: 500, unit: 'ms' },
        'composition_root': { budget: 50, unit: 'ms' },
        'service_registration': { budget: 20, unit: 'ms' },
        'execution_context_propagation': { budget: 2, unit: 'ms' },
        'resource_manager_latency': { budget: 10, unit: 'ms' },
        'policy_service_latency': { budget: 5, unit: 'ms' },
        'optimization_service_latency': { budget: 10, unit: 'ms' },
        'digital_twin_synchronization': { budget: 50, unit: 'ms' },
        'kernel_shutdown': { budget: 100, unit: 'ms' },
        'memory_overhead': { budget: 50, unit: 'MB' }
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
