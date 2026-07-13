// src/enterprise/performance/LoadTestingFramework.ts
// Load Testing Framework — Load profiles, virtual agents, concurrency metrics

export interface LoadTestConfig {
  concurrencyLevel: number; // 1 | 10 | 100 | 1000 | 10000 | 100000
  targetType: 'users' | 'agents' | 'models' | 'workflows' | 'plugins' | 'searches' | 'knowledge' | 'api';
  durationSeconds: number;
}

export interface LatencyDistribution {
  p50: number;
  p90: number;
  p99: number;
  mean: number;
}

export interface LoadTestMetrics {
  config: LoadTestConfig;
  throughputReqSec: number;
  latencies: LatencyDistribution;
  errorRate: number;
  cpuUtilization: number;
  memoryUsageMb: number;
}

export class LoadTestingFramework {
  private static instance: LoadTestingFramework | null = null;

  private constructor() {}

  public static getInstance(): LoadTestingFramework {
    if (!LoadTestingFramework.instance) {
      LoadTestingFramework.instance = new LoadTestingFramework();
    }
    return LoadTestingFramework.instance;
  }

  /**
   * Run load testing execution simulation based on configuration settings.
   */
  public runLoadTest(config: LoadTestConfig): LoadTestMetrics {
    const concurrency = config.concurrencyLevel;
    
    // Simulate typical saturation and degradation curve for latency/throughput
    // Under higher concurrency, throughput peaks then flatlines/degrades; latency increases exponentially
    let throughput = 0;
    let p50 = 0;
    let p90 = 0;
    let p99 = 0;
    let errorRate = 0.0;

    // Concurrency parameters
    const baseRequestCostMs = {
      users: 15,
      agents: 120,
      models: 250,
      workflows: 90,
      plugins: 45,
      searches: 35,
      knowledge: 75,
      api: 12,
    }[config.targetType];

    const maxThroughputCap = 15000; // max 15k reqs/sec for the cluster
    
    if (concurrency === 1) {
      throughput = 1000 / baseRequestCostMs;
      p50 = baseRequestCostMs;
      p90 = baseRequestCostMs * 1.25;
      p99 = baseRequestCostMs * 1.8;
      errorRate = 0.0;
    } else if (concurrency === 10) {
      throughput = (1000 / baseRequestCostMs) * 9.8;
      p50 = baseRequestCostMs * 1.05;
      p90 = baseRequestCostMs * 1.35;
      p99 = baseRequestCostMs * 2.0;
    } else if (concurrency === 100) {
      throughput = (1000 / baseRequestCostMs) * 88.0;
      p50 = baseRequestCostMs * 1.15;
      p90 = baseRequestCostMs * 1.6;
      p99 = baseRequestCostMs * 2.8;
    } else if (concurrency === 1000) {
      throughput = Math.min(maxThroughputCap, (1000 / baseRequestCostMs) * 720.0);
      p50 = baseRequestCostMs * 1.4;
      p90 = baseRequestCostMs * 2.2;
      p99 = baseRequestCostMs * 4.5;
    } else if (concurrency === 10000) {
      throughput = Math.min(maxThroughputCap, (1000 / baseRequestCostMs) * 3100.0);
      p50 = baseRequestCostMs * 2.5;
      p90 = baseRequestCostMs * 4.8;
      p99 = baseRequestCostMs * 12.0;
      errorRate = 0.005;
    } else { // 100000 concurrency
      throughput = maxThroughputCap * 0.95; // Saturated
      p50 = baseRequestCostMs * 9.0;
      p90 = baseRequestCostMs * 22.0;
      p99 = baseRequestCostMs * 65.0;
      errorRate = 0.042; // 4.2% error rate under high load
    }

    // Resources scaling simulation
    const cpu = Math.min(99.8, 5.0 + Math.log10(concurrency) * 18);
    const memory = 512 + Math.log10(concurrency) * 450;

    return {
      config,
      throughputReqSec: Number(throughput.toFixed(1)),
      latencies: {
        p50: Number(p50.toFixed(1)),
        p90: Number(p90.toFixed(1)),
        p99: Number(p99.toFixed(1)),
        mean: Number(((p50 + p90 + p99) / 3).toFixed(1)),
      },
      errorRate: Number(errorRate.toFixed(4)),
      cpuUtilization: Number(cpu.toFixed(1)),
      memoryUsageMb: Number(memory.toFixed(1)),
    };
  }
}

export const loadTestingFramework = LoadTestingFramework.getInstance();
export default loadTestingFramework;
