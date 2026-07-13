// src/enterprise/performance/PerformanceRegressionFramework.ts
// Continuous Performance Regression Framework — Automatic regression rejection

export interface RunMetrics {
  apiLatencyMs: number;
  throughputReqSec: number;
  memoryUsageMb: number;
  gpuUtilizationPercent: number;
  dbQueryLatencyMs: number;
}

export interface RegressionCheckResult {
  runName: string;
  isRegression: boolean;
  regressedMetrics: {
    metric: string;
    baselineValue: number;
    currentValue: number;
    degradationPercent: number;
    thresholdPercent: number;
  }[];
}

export class PerformanceRegressionFramework {
  private static instance: PerformanceRegressionFramework | null = null;

  // Historical baselines for validation comparison
  private baselines: Map<string, RunMetrics> = new Map();
  private runsHistory: Map<string, RunMetrics[]> = new Map();

  private constructor() {
    this.seedDefaultBaselines();
  }

  public static getInstance(): PerformanceRegressionFramework {
    if (!PerformanceRegressionFramework.instance) {
      PerformanceRegressionFramework.instance = new PerformanceRegressionFramework();
    }
    return PerformanceRegressionFramework.instance;
  }

  public registerBaseline(name: string, metrics: RunMetrics): void {
    this.baselines.set(name, metrics);
  }

  public getBaseline(name: string): RunMetrics | null {
    return this.baselines.get(name) ?? null;
  }

  /**
   * Evaluates if a new run shows performance regression compared to the baseline.
   * Throws an Error if regression is detected and rejects the execution.
   */
  public checkRegression(name: string, current: RunMetrics, thresholdPercent = 5.0): RegressionCheckResult {
    const baseline = this.baselines.get(name);
    if (!baseline) {
      // If no baseline exists, set current as baseline
      this.baselines.set(name, current);
      return { runName: name, isRegression: false, regressedMetrics: [] };
    }

    const regressedMetrics: RegressionCheckResult['regressedMetrics'] = [];

    // 1. Check API Latency (Lower is better)
    const latDegradation = ((current.apiLatencyMs - baseline.apiLatencyMs) / baseline.apiLatencyMs) * 100;
    if (latDegradation > thresholdPercent) {
      regressedMetrics.push({
        metric: 'apiLatencyMs',
        baselineValue: baseline.apiLatencyMs,
        currentValue: current.apiLatencyMs,
        degradationPercent: Number(latDegradation.toFixed(1)),
        thresholdPercent,
      });
    }

    // 2. Check Throughput (Higher is better)
    const tputDegradation = ((baseline.throughputReqSec - current.throughputReqSec) / baseline.throughputReqSec) * 100;
    if (tputDegradation > thresholdPercent) {
      regressedMetrics.push({
        metric: 'throughputReqSec',
        baselineValue: baseline.throughputReqSec,
        currentValue: current.throughputReqSec,
        degradationPercent: Number(tputDegradation.toFixed(1)),
        thresholdPercent,
      });
    }

    // 3. Check DB Latency (Lower is better)
    const dbDegradation = ((current.dbQueryLatencyMs - baseline.dbQueryLatencyMs) / baseline.dbQueryLatencyMs) * 100;
    if (dbDegradation > thresholdPercent) {
      regressedMetrics.push({
        metric: 'dbQueryLatencyMs',
        baselineValue: baseline.dbQueryLatencyMs,
        currentValue: current.dbQueryLatencyMs,
        degradationPercent: Number(dbDegradation.toFixed(1)),
        thresholdPercent,
      });
    }

    // Append to run history
    const history = this.runsHistory.get(name) || [];
    history.push(current);
    this.runsHistory.set(name, history);

    const isRegression = regressedMetrics.length > 0;

    if (isRegression) {
      const errMsgs = regressedMetrics.map(
        m => `${m.metric} regressed by ${m.degradationPercent}% (Value: ${m.currentValue}, Baseline: ${m.baselineValue}, Threshold: ${m.thresholdPercent}%)`
      );
      throw new Error(`[RegressionFramework] REJECTED RUN due to performance degradation: \n- ${errMsgs.join('\n- ')}`);
    }

    return {
      runName: name,
      isRegression: false,
      regressedMetrics,
    };
  }

  private seedDefaultBaselines(): void {
    // Standard baseline values for different workloads
    this.baselines.set('api-endpoints', {
      apiLatencyMs: 200.0,
      throughputReqSec: 320.0,
      memoryUsageMb: 240.0,
      gpuUtilizationPercent: 0.0,
      dbQueryLatencyMs: 20.0,
    });

    this.baselines.set('ai-agent-flow', {
      apiLatencyMs: 980.0,
      throughputReqSec: 15.0,
      memoryUsageMb: 850.0,
      gpuUtilizationPercent: 82.0,
      dbQueryLatencyMs: 18.0,
    });
  }
}

export const performanceRegressionFramework = PerformanceRegressionFramework.getInstance();
export default performanceRegressionFramework;
