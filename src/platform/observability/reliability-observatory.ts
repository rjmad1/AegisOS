/**
 * Platform Reliability Observatory
 * 
 * 4-Layer Monitoring:
 * Layer 1: Continuous runtime sampling
 * Layer 2: Adaptive deep diagnostics (heap snapshots on leak alert)
 * Layer 3: Infrastructure telemetry correlation
 * Layer 4: Trend analysis & alert predictions
 */

import { writeHeapSnapshot } from 'v8';
import * as path from 'path';
import * as fs from 'fs';
import { resourceSampler } from '../../infrastructure/reliability/resource-sampler';
import { leakDetector } from '../../infrastructure/reliability/leak-detector';

export interface TelemetrySample {
  timestamp: number;
  heapUsedBytes: number;
  cpuPercent: number;
  activeHandles: number;
  activeRequests: number;
}

export class ReliabilityObservatory {
  private static instance: ReliabilityObservatory | null = null;
  private samples: TelemetrySample[] = [];
  private isSampling = false;
  private sampleTimer?: NodeJS.Timeout;

  private constructor() {}

  public static getInstance(): ReliabilityObservatory {
    if (!ReliabilityObservatory.instance) {
      ReliabilityObservatory.instance = new ReliabilityObservatory();
    }
    return ReliabilityObservatory.instance;
  }

  public startProfiling(intervalMs = 5000) {
    if (this.isSampling) return;
    this.isSampling = true;
    this.samples = [];
    console.log(`[ReliabilityObservatory] Layer 1 profiling active. Sampling every ${intervalMs}ms...`);

    this.sampleTimer = setInterval(async () => {
      const sample = await this.takeSample();
      this.samples.push(sample);

      // Layer 4: Trend analysis & leak prediction
      const hasLeak = leakDetector.analyze(this.samples);
      if (hasLeak) {
        console.warn(`⚠️ [ReliabilityObservatory] Leak detected during trend analysis! Triggering Layer 2 deep diagnostics.`);
        this.triggerDeepDiagnostics();
      }
    }, intervalMs);
  }

  public stopProfiling() {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
    }
    this.isSampling = false;
    console.log(`[ReliabilityObservatory] Profiling stopped.`);
  }

  public getSamples(): TelemetrySample[] {
    return this.samples;
  }

  private async takeSample(): Promise<TelemetrySample> {
    const stats = await resourceSampler.getStats();
    return {
      timestamp: Date.now(),
      heapUsedBytes: stats.heapUsedBytes,
      cpuPercent: stats.cpuPercent,
      activeHandles: stats.activeHandles,
      activeRequests: stats.activeRequests
    };
  }

  /**
   * Layer 2 Adaptive Diagnostics: Trigger V8 Heap snapshot on leak discovery
   */
  private triggerDeepDiagnostics() {
    const snapshotsDir = path.resolve(process.cwd(), 'databases', 'diagnostics');
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }
    const snapshotPath = path.join(snapshotsDir, `leak-diagnostic-${Date.now()}.heapsnapshot`);
    try {
      writeHeapSnapshot(snapshotPath);
      console.warn(`💾 [ReliabilityObservatory] Saved V8 heap snapshot to: ${snapshotPath}`);
    } catch (err: any) {
      console.error(`[ReliabilityObservatory] Snapshot failed:`, err.message);
    }
  }
}

export const reliabilityObservatory = ReliabilityObservatory.getInstance();
export default reliabilityObservatory;
