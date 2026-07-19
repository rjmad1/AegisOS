/**
 * Benchmark Execution Model (BEM) Lifecycle
 * 
 * Defines the universal execution lifecycle for all benchmarks.
 * No benchmark runner shall implement its own execution flow.
 */

export enum BenchmarkLifecycleState {
  /**
   * The benchmark has been registered with the framework.
   */
  REGISTERED = 'REGISTERED',

  /**
   * The benchmark's configuration and dependencies have been validated.
   */
  VALIDATED = 'VALIDATED',

  /**
   * Test data, sandbox environments, and mock providers are prepared.
   */
  PREPARED = 'PREPARED',

  /**
   * The benchmark is running a warm-up phase to eliminate cold-start jitter.
   */
  WARM_UP = 'WARM_UP',

  /**
   * The benchmark payload is actively executing.
   */
  EXECUTING = 'EXECUTING',

  /**
   * The execution is complete; active metrics are being gathered from UOP.
   */
  COLLECTING_TELEMETRY = 'COLLECTING_TELEMETRY',

  /**
   * Raw metrics are being aggregated across iterations/runs.
   */
  AGGREGATING_METRICS = 'AGGREGATING_METRICS',

  /**
   * Statistical analysis (P95, MAD, variance) is being applied.
   */
  STATISTICAL_ANALYSIS = 'STATISTICAL_ANALYSIS',

  /**
   * Validating results against the Performance Governance Framework (NFRs).
   */
  CONTRACT_EVALUATION = 'CONTRACT_EVALUATION',

  /**
   * Generating the Benchmark Provenance Manifest and output bundles.
   */
  ARTIFACT_GENERATION = 'ARTIFACT_GENERATION',

  /**
   * The benchmark run is complete.
   */
  COMPLETED = 'COMPLETED',

  /**
   * The benchmark failed during any lifecycle state.
   */
  BENCHMARK_FAILED = 'BENCHMARK_FAILED'
}
