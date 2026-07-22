/**
 * Program 11.1 — Product Intelligence Framework
 * 
 * Continuously measures platform value by capturing and correlating:
 * - Feature adoption
 * - Capability utilization
 * - Workforce utilization
 * - Solution Pack adoption
 * - Marketplace downloads
 * - Mission completion rates
 * - User journeys
 * - Operational efficiency
 * - Business outcomes
 * - Platform ROI
 */

export interface ProductMetric {
  id: string;
  metricType: 'adoption' | 'utilization' | 'roi' | 'completion_rate' | 'efficiency';
  entityId: string;
  entityType: 'feature' | 'capability' | 'workforce' | 'solution_pack' | 'marketplace_item' | 'mission' | 'user_journey';
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ProductIntelligenceFramework {
  private digitalTwinNodeId: string;
  
  constructor() {
    this.digitalTwinNodeId = 'platform-product-intelligence';
  }

  /**
   * Captures feature adoption metrics.
   */
  public async captureFeatureAdoption(featureId: string, adoptionRate: number): Promise<void> {
    const metric = this.createMetric('adoption', featureId, 'feature', adoptionRate);
    await this.correlateWithDigitalTwin(metric);
  }

  /**
   * Captures workforce utilization metrics.
   */
  public async captureWorkforceUtilization(workforceId: string, utilizationScore: number): Promise<void> {
    const metric = this.createMetric('utilization', workforceId, 'workforce', utilizationScore);
    await this.correlateWithDigitalTwin(metric);
  }

  /**
   * Captures mission completion rates.
   */
  public async captureMissionCompletionRate(missionPackId: string, completionRate: number): Promise<void> {
    const metric = this.createMetric('completion_rate', missionPackId, 'mission', completionRate);
    await this.correlateWithDigitalTwin(metric);
  }

  /**
   * Calculates and captures platform ROI.
   */
  public async calculatePlatformROI(investment: number, returnVal: number): Promise<void> {
    const roi = ((returnVal - investment) / investment) * 100;
    const metric = this.createMetric('roi', 'platform-core', 'capability', roi);
    await this.correlateWithDigitalTwin(metric);
  }

  private createMetric(
    type: ProductMetric['metricType'], 
    entityId: string, 
    entityType: ProductMetric['entityType'], 
    value: number
  ): ProductMetric {
    return {
      id: `metric-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      metricType: type,
      entityId,
      entityType,
      value,
      timestamp: new Date()
    };
  }

  /**
   * Models the metric as a first-class entity in the Digital Twin and EKG.
   */
  private async correlateWithDigitalTwin(metric: ProductMetric): Promise<void> {
    // In a full implementation, this would interface with the PlatformDigitalTwin and KnowledgeGraphEngine
    // to mutate their states.
    console.log(`[Product Intelligence] Correlating metric ${metric.id} with Digital Twin (Node: ${this.digitalTwinNodeId})`);
  }
}
