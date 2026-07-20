import { OptimizationRecommendation, OptimizationExecutionResult } from './types';
import { constitutionEngine } from '../governance/ConstitutionEngine';
import { BaseAnalyzer } from './analyzers/BaseAnalyzer';

export class OptimizationEngine {
  private static instance: OptimizationEngine | null = null;
  private analyzers: BaseAnalyzer[] = [];
  
  // Pending recommendations that require human or organizational approval
  private pendingAdvisory: OptimizationRecommendation[] = [];
  
  // Execution history log
  private executionLog: OptimizationExecutionResult[] = [];

  private constructor() {}

  public static getInstance(): OptimizationEngine {
    if (!OptimizationEngine.instance) {
      OptimizationEngine.instance = new OptimizationEngine();
    }
    return OptimizationEngine.instance;
  }

  public registerAnalyzer(analyzer: BaseAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /**
   * Run the optimization loop:
   * 1. Collect recommendations from all registered analyzers.
   * 2. Rank recommendations based on confidence and expected benefit.
   * 3. Evaluate against the Governance Policy Framework (Constitution).
   * 4. Execute autonomously if permitted, or queue as advisory.
   */
  public async runOptimizationCycle(): Promise<void> {
    const recommendations: OptimizationRecommendation[] = [];
    
    for (const analyzer of this.analyzers) {
      try {
        const recs = await analyzer.analyze();
        recommendations.push(...recs);
      } catch (err) {
        console.error(`Analyzer ${analyzer.name} failed:`, err);
      }
    }

    // Rank recommendations: Higher confidence and lower risk level take priority
    const rankedRecommendations = this.rankRecommendations(recommendations);

    for (const rec of rankedRecommendations) {
      await this.processRecommendation(rec);
    }
  }

  private rankRecommendations(recs: OptimizationRecommendation[]): OptimizationRecommendation[] {
    return recs.sort((a, b) => {
      // Primary: Confidence (descending)
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // Secondary: Risk Level (ascending - lower risk first)
      return a.riskLevel - b.riskLevel;
    });
  }

  private async processRecommendation(rec: OptimizationRecommendation): Promise<void> {
    const isAuthorized = constitutionEngine.isAuthorized(rec);

    // Enforce Architecture Drift / Self Improvement constraints
    // "Never modify platform architecture automatically."
    // Any recommendation with riskLevel LEVEL_4_ARCHITECTURAL or category ArchitectureRefactor must not be autonomous.
    if (rec.category === 'ArchitectureRefactor' || rec.riskLevel === 4) {
      rec.autonomousEligibility = false;
    }

    if (isAuthorized && rec.autonomousEligibility && rec.constitutionalCompliance) {
      // Execute Autonomous Mode
      await this.executeOptimization(rec);
    } else {
      // Advisory Mode: store for approval
      this.pendingAdvisory.push(rec);
    }
  }

  private async executeOptimization(rec: OptimizationRecommendation): Promise<void> {
    // In a real implementation, this would dispatch to specific executor strategies
    // based on rec.category. For now, we simulate execution success.
    console.log(`[OptimizationEngine] Executing autonomous action: ${rec.id} (${rec.title})`);
    
    const result: OptimizationExecutionResult = {
      recommendationId: rec.id,
      success: true,
      executedAutonomous: true,
      timestamp: Date.now(),
      message: `Successfully executed autonomous action: ${rec.category}`
    };

    this.executionLog.push(result);
  }

  public getPendingAdvisory(): OptimizationRecommendation[] {
    return this.pendingAdvisory;
  }

  public getExecutionLog(): OptimizationExecutionResult[] {
    return this.executionLog;
  }
}

export const optimizationEngine = OptimizationEngine.getInstance();
export default optimizationEngine;
