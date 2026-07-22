import { EventEmitter } from 'events';

export interface SustainabilityMetrics {
  technicalDebtTrend: number; // e.g., -5% (decreasing) or +2% (increasing)
  operationalDebt: number; // quantified abstractly
  governanceDebt: number;
  knowledgeDebt: number;
  ecosystemDebt: number;
  workforceDebt: number;
  reliabilityTrend: number;
  maintainabilityIndex: number; // 0-100 scale
  architecturalStability: number; // 0-100 scale
  timestamp: Date;
}

export class PlatformSustainabilityAnalytics extends EventEmitter {
  private historicalMetrics: SustainabilityMetrics[] = [];

  constructor() {
    super();
  }

  public recordMetrics(metrics: Omit<SustainabilityMetrics, 'timestamp'>): void {
    const fullMetrics: SustainabilityMetrics = {
      ...metrics,
      timestamp: new Date()
    };
    this.historicalMetrics.push(fullMetrics);
    this.emit('sustainability_metrics_recorded', fullMetrics);
  }

  public getLatestMetrics(): SustainabilityMetrics | undefined {
    return this.historicalMetrics[this.historicalMetrics.length - 1];
  }

  public getTrendAnalysis(metricKey: keyof SustainabilityMetrics, windowDays: number = 30): any[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);

    return this.historicalMetrics
      .filter(m => m.timestamp >= cutoff)
      .map(m => ({
        timestamp: m.timestamp,
        value: m[metricKey]
      }));
  }

  public calculateMaintainabilityIndex(): number {
    // Abstract calculation based on Digital Twin, PQF, and EKG
    const baseIndex = 85;
    const latest = this.getLatestMetrics();
    if (!latest) return baseIndex;
    
    // Penalize for high technical or operational debt
    let adjustment = 0;
    if (latest.technicalDebtTrend > 0) adjustment -= 5;
    if (latest.operationalDebt > 50) adjustment -= 10;
    
    return Math.max(0, Math.min(100, baseIndex + adjustment));
  }
}
