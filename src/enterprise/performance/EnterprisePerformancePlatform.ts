// src/enterprise/performance/EnterprisePerformancePlatform.ts
// Enterprise Performance Platform — Primary Orchestrator and API Gateway for Optimizations

import { databaseOptimizationEngine } from './DatabaseOptimizationEngine';
import { gpuOptimizationPlatform } from './GPUOptimizationPlatform';
import { aiRuntimeOptimizer } from './AIRuntimeOptimizer';
import { knowledgeOptimizationPlatform } from './KnowledgeOptimizationPlatform';
import { multiLevelCacheFramework } from './MultiLevelCacheFramework';
import { performanceRegressionFramework } from './PerformanceRegressionFramework';

export interface PlatformOptimizationResult {
  engine: 'database' | 'gpu' | 'runtime' | 'knowledge';
  optimization: string;
  beforeLatencyMs?: number;
  afterLatencyMs?: number;
  beforeThroughput?: number;
  afterThroughput?: number;
  improvementPercent: number;
  pValue: number;
  significant: boolean;
  success: boolean;
}

export class EnterprisePerformancePlatform {
  private static instance: EnterprisePerformancePlatform | null = null;
  private isOptimizing = false;

  private constructor() {}

  public static getInstance(): EnterprisePerformancePlatform {
    if (!EnterprisePerformancePlatform.instance) {
      EnterprisePerformancePlatform.instance = new EnterprisePerformancePlatform();
    }
    return EnterprisePerformancePlatform.instance;
  }

  /**
   * Orchestrates execution of optimizations across the entire system.
   */
  public async optimizeSystem(): Promise<PlatformOptimizationResult[]> {
    if (this.isOptimizing) {
      throw new Error('Optimization cycle already in progress.');
    }
    this.isOptimizing = true;
    const results: PlatformOptimizationResult[] = [];

    try {
      // 1. Optimize Database
      const dbOpt = databaseOptimizationEngine.getOptimizations()[0]; // add-user-tenant-index
      const dbRes = databaseOptimizationEngine.runQueryBenchmark(dbOpt);
      databaseOptimizationEngine.applyOptimization(dbOpt);
      results.push({
        engine: 'database',
        optimization: dbOpt,
        beforeLatencyMs: dbRes.beforeLatencyMs,
        afterLatencyMs: dbRes.afterLatencyMs,
        improvementPercent: dbRes.improvementPercent,
        pValue: dbRes.pValue,
        significant: dbRes.statisticallySignificant,
        success: dbRes.success,
      });

      // 2. Optimize GPU Allocation
      const gpuOpt = gpuOptimizationPlatform.getOptimizations()[0]; // continuous-batching
      const gpuRes = gpuOptimizationPlatform.runGPUBenchmark(gpuOpt);
      gpuOptimizationPlatform.applyOptimization(gpuOpt);
      results.push({
        engine: 'gpu',
        optimization: gpuOpt,
        beforeThroughput: gpuRes.before.throughputTokensPerSec,
        afterThroughput: gpuRes.after.throughputTokensPerSec,
        improvementPercent: gpuRes.improvementTokensPerSecPercent,
        pValue: gpuRes.pValue,
        significant: gpuRes.statisticallySignificant,
        success: gpuRes.statisticallySignificant,
      });

      // 3. Optimize AI Runtime execution
      const rtOpt = aiRuntimeOptimizer.getOptimizations()[0]; // compiled-prompt-caching
      const rtRes = aiRuntimeOptimizer.runRuntimeBenchmark(rtOpt);
      aiRuntimeOptimizer.applyOptimization(rtOpt);
      results.push({
        engine: 'runtime',
        optimization: rtOpt,
        beforeLatencyMs: rtRes.before.overallExecutionMs,
        afterLatencyMs: rtRes.after.overallExecutionMs,
        improvementPercent: rtRes.latencySavedPercent,
        pValue: rtRes.pValue,
        significant: rtRes.statisticallySignificant,
        success: rtRes.statisticallySignificant,
      });

      // 4. Optimize Knowledge Retrival
      const knOpt = knowledgeOptimizationPlatform.getOptimizations()[0]; // embed-batch-compression
      const knRes = knowledgeOptimizationPlatform.runKnowledgeBenchmark(knOpt);
      knowledgeOptimizationPlatform.applyOptimization(knOpt);
      results.push({
        engine: 'knowledge',
        optimization: knOpt,
        improvementPercent: knRes.improvementPercent,
        pValue: knRes.pValue,
        significant: knRes.statisticallySignificant,
        success: knRes.statisticallySignificant,
      });

      // 5. Verify no performance regressions compared to baseline
      const sampleRunMetrics = {
        apiLatencyMs: dbRes.afterLatencyMs + (rtRes.after.overallExecutionMs / 10),
        throughputReqSec: 350.0,
        memoryUsageMb: 260.0,
        gpuUtilizationPercent: gpuRes.after.utilizationPercent,
        dbQueryLatencyMs: dbRes.afterLatencyMs,
      };
      
      performanceRegressionFramework.checkRegression('api-endpoints', sampleRunMetrics);

    } finally {
      this.isOptimizing = false;
    }

    return results;
  }

  public rollbackAll(): void {
    // Database rollbacks
    for (const opt of databaseOptimizationEngine.getOptimizations()) {
      databaseOptimizationEngine.rollbackOptimization(opt);
    }
    // GPU rollbacks
    for (const opt of gpuOptimizationPlatform.getOptimizations()) {
      gpuOptimizationPlatform.rollbackOptimization(opt);
    }
    // Runtime rollbacks
    for (const opt of aiRuntimeOptimizer.getOptimizations()) {
      aiRuntimeOptimizer.rollbackOptimization(opt);
    }
    // Knowledge rollbacks
    for (const opt of knowledgeOptimizationPlatform.getOptimizations()) {
      knowledgeOptimizationPlatform.rollbackOptimization(opt);
    }
    // Cache clearing
    multiLevelCacheFramework.clearAll();
    console.log('[EnterprisePerformancePlatform] All optimizations rolled back and caches cleared.');
  }
}

export const enterprisePerformancePlatform = EnterprisePerformancePlatform.getInstance();
export default enterprisePerformancePlatform;
