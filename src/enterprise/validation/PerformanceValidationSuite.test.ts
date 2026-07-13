// src/enterprise/validation/PerformanceValidationSuite.test.ts
// Vitest runner for the Enterprise Performance & Optimization Validation Suite

import { describe, it, expect } from 'vitest';
import { performanceValidationSuite } from './PerformanceValidationSuite';
import { enterprisePerformanceCertification } from './EnterprisePerformanceCertification';
import { databaseOptimizationEngine } from '../performance/DatabaseOptimizationEngine';
import { gpuOptimizationPlatform } from '../performance/GPUOptimizationPlatform';
import { aiRuntimeOptimizer } from '../performance/AIRuntimeOptimizer';
import { knowledgeOptimizationPlatform } from '../performance/KnowledgeOptimizationPlatform';
import { multiLevelCacheFramework } from '../performance/MultiLevelCacheFramework';
import { performanceRegressionFramework } from '../performance/PerformanceRegressionFramework';
import { enterprisePerformancePlatform } from '../performance/EnterprisePerformancePlatform';
import { performanceReadinessReport } from '../operations/PerformanceReadinessReport';
import { scalabilityReport } from '../operations/ScalabilityReport';
import { costOptimizationReport } from '../operations/CostOptimizationReport';

describe('OpenClaw Enterprise SaaS Performance Validation Suite', () => {
  
  it('should run all validation checks successfully and meet SLA targets', () => {
    const report = performanceValidationSuite.runAllChecks(100);
    
    console.log('[Performance Validation Checks Passed]:', report.passedCount);
    console.log('[Performance Validation Checks Failed]:', report.failedCount);
    
    expect(report.failedCount).toBe(0);
    expect(report.passedCount).toBeGreaterThan(0);
    expect(report.overallStatus).toBe('pass');
  });

  it('should generate a valid Enterprise Performance Certification', () => {
    const cert = enterprisePerformanceCertification.generateCertification(100);
    
    console.log('[Enterprise Performance Certificate Issued]:', cert.certificationId);
    console.log('- Verification Hash:', cert.verificationHash);
    console.log('- certified P99 Latency:', cert.certifiedP99LatencyMs, 'ms');
    console.log('- certified Throughput:', cert.certifiedThroughputReqSec, 'req/s');
    
    expect(cert.status).toBe('CERTIFIED');
    expect(cert.verificationHash).not.toBe('N/A');
  });

  it('should run database and GPU optimization benchmarks and calculate statistical significance', () => {
    // DB optimization p-value t-test check
    const dbOptResult = databaseOptimizationEngine.runQueryBenchmark('add-user-tenant-index');
    console.log('[DB Optimization]:', dbOptResult.name);
    console.log(`- Before: ${dbOptResult.beforeLatencyMs}ms, After: ${dbOptResult.afterLatencyMs}ms`);
    console.log(`- Improvement: ${dbOptResult.improvementPercent}%, p-value: ${dbOptResult.pValue}`);
    
    expect(dbOptResult.success).toBe(true);
    expect(dbOptResult.statisticallySignificant).toBe(true);

    // GPU optimization check
    const gpuOptResult = gpuOptimizationPlatform.runGPUBenchmark('continuous-batching');
    console.log('[GPU Optimization]:', gpuOptResult.optimization);
    console.log(`- Throughput Gain: +${gpuOptResult.improvementTokensPerSecPercent}%`);
    expect(gpuOptResult.statisticallySignificant).toBe(true);
  });

  it('should verify Multi-Level Cache operations (L1, L2, Semantic)', () => {
    multiLevelCacheFramework.clearAll();
    
    // L1 Cache
    multiLevelCacheFramework.setL1('key1', { data: 'test1' }, 1000);
    const val1 = multiLevelCacheFramework.getL1<{ data: string }>('key1');
    expect(val1?.data).toBe('test1');

    // L2 Cache (Disk-backed)
    multiLevelCacheFramework.setL2('key2', { data: 'test2' }, 2000);
    const val2 = multiLevelCacheFramework.getL2<{ data: string }>('key2');
    expect(val2?.data).toBe('test2');

    // Semantic Cache (similarity match)
    multiLevelCacheFramework.setSemantic('List all workspace instances', { items: [] }, 5000);
    const match = multiLevelCacheFramework.getSemantic<{ items: any[] }>('List all workspace instances.');
    expect(match).not.toBeNull();
  });

  it('should reject runs displaying significant performance degradation (regression)', () => {
    const currentRunMetrics = {
      apiLatencyMs: 142.0, // baseline is 145.0
      throughputReqSec: 325.0, // baseline is 320.0
      memoryUsageMb: 245.0,
      gpuUtilizationPercent: 0.0,
      dbQueryLatencyMs: 11.5, // baseline is 12.0
    };

    // Should not throw regression since it is better than baseline
    expect(() => {
      performanceRegressionFramework.checkRegression('api-endpoints', currentRunMetrics);
    }).not.toThrow();

    // Now test a degraded run that should trigger rejection
    const degradedMetrics = {
      apiLatencyMs: 195.0, // > 5% degradation (from 145)
      throughputReqSec: 250.0, // degraded (from 320)
      memoryUsageMb: 300.0,
      gpuUtilizationPercent: 0.0,
      dbQueryLatencyMs: 25.0, // degraded (from 12)
    };

    expect(() => {
      performanceRegressionFramework.checkRegression('api-endpoints', degradedMetrics);
    }).toThrow();
  });

  it('should execute full system optimizations via platform orchestrator', async () => {
    const results = await enterprisePerformancePlatform.optimizeSystem();
    expect(results.length).toBe(4);
    for (const r of results) {
      expect(r.success).toBe(true);
    }
  });

  it('should compile operational readiness, scalability, and FinOps reports successfully', () => {
    const readReport = performanceReadinessReport.generateReport();
    const scaleReport = scalabilityReport.generateReport();
    const costReport = costOptimizationReport.generateReport();

    expect(readReport).toContain('# OpenClaw Enterprise Performance Readiness Report');
    expect(scaleReport).toContain('# OpenClaw Scalability Validation & Audit Report');
    expect(costReport).toContain('# OpenClaw FinOps & Cost Optimization Report');

    console.log('\n=== PREVIEW: PERFORMANCE READINESS REPORT ===\n');
    console.log(readReport.substring(0, 500) + '...\n');
  });

});
