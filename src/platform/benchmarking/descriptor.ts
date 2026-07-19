/**
 * Benchmark Suite Descriptor (BSD)
 * 
 * Declarative definition of benchmarking suites, allowing new benchmarks
 * to be configuration rather than code.
 */

export interface BenchmarkSuiteDescriptor {
  suite: {
    /**
     * Unique identifier for the benchmark suite.
     */
    id: string;

    /**
     * The pluggable execution engine to use (e.g., 'micro', 'subsystem', 'scenario').
     */
    engine: string;

    /**
     * Execution priority (e.g., 'high', 'normal', 'low').
     */
    priority: string;

    /**
     * Number of warm-up cycles to eliminate cold-start jitter before metrics are collected.
     */
    warmup: number;

    /**
     * Total number of iterations to execute during the telemetry collection phase.
     */
    iterations: number;

    /**
     * List of pluggable collectors to attach (e.g., 'cpu', 'memory', 'gpu').
     */
    collectors: string[];

    /**
     * List of pluggable analyzers to evaluate the metrics (e.g., 'latency', 'throughput', 'architectural-cost').
     */
    analyzers: string[];

    /**
     * List of performance contracts to evaluate against (e.g., 'workflow_compile_p95').
     */
    contracts: string[];

    /**
     * List of report artifacts to generate (e.g., 'regression', 'recommendation').
     */
    reports: string[];
  };
}
