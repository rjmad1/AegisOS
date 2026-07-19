/**
 * Leak Detector
 * 
 * Applies statistical analysis (linear regression) over sample streams
 * to determine whether a resource growth trend violates NFR budgets.
 */

export interface TelemetrySampleLike {
  timestamp: number;
  heapUsedBytes: number;
  cpuPercent: number;
}

export class LeakDetector {
  private static instance: LeakDetector | null = null;

  private constructor() {}

  public static getInstance(): LeakDetector {
    if (!LeakDetector.instance) {
      LeakDetector.instance = new LeakDetector();
    }
    return LeakDetector.instance;
  }

  /**
   * Applies simple linear regression (slope calculation) to check for a monotonic memory leak.
   * Requires at least 10 samples to calculate a trend.
   */
  public analyze(samples: TelemetrySampleLike[], maxAllowedSlopeBytesPerSec = 5000): boolean {
    if (samples.length < 10) return false;

    // Use the last 50 samples to detect recent trends
    const subset = samples.slice(-50);
    const n = subset.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    const firstTime = subset[0].timestamp;

    for (let i = 0; i < n; i++) {
      const x = (subset[i].timestamp - firstTime) / 1000; // time in seconds
      const y = subset[i].heapUsedBytes;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return false;

    const slope = (n * sumXY - sumX * sumY) / denominator;

    // If memory is increasing consistently at a rate higher than allowed slope
    if (slope > maxAllowedSlopeBytesPerSec) {
      console.warn(`[LeakDetector] Linear regression slope is ${slope.toFixed(2)} bytes/sec. Threshold is ${maxAllowedSlopeBytesPerSec}.`);
      return true;
    }

    return false;
  }
}

export const leakDetector = LeakDetector.getInstance();
export default leakDetector;
