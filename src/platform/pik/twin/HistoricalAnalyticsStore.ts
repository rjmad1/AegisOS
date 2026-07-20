export interface HistoricalMetric {
  timestamp: number;
  metricType: string;
  value: number;
  labels?: Record<string, string>;
}

export interface ArchitectureDriftRecord {
  timestamp: number;
  violationsFound: number;
  details: string[];
}

/**
 * HistoricalAnalyticsStore
 * Persists historical data for trend analysis.
 * Note: MVP uses an in-memory fallback. Future implementations will use SQLite/DuckDB.
 */
export class HistoricalAnalyticsStore {
  private metrics: HistoricalMetric[] = [];
  private driftHistory: ArchitectureDriftRecord[] = [];

  public recordMetric(metricType: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      timestamp: Date.now(),
      metricType,
      value,
      labels
    });
  }

  public recordDrift(violationsFound: number, details: string[]): void {
    this.driftHistory.push({
      timestamp: Date.now(),
      violationsFound,
      details
    });
  }

  public getMetricsTrend(metricType: string, timeRangeMs: number): HistoricalMetric[] {
    const cutoff = Date.now() - timeRangeMs;
    return this.metrics.filter(m => m.metricType === metricType && m.timestamp >= cutoff);
  }
  
  public getRecentDrift(): ArchitectureDriftRecord[] {
    return [...this.driftHistory].sort((a, b) => b.timestamp - a.timestamp);
  }
}
