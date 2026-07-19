import { BaseAnalyzer } from './BaseAnalyzer';
import { OptimizationRecommendation, RiskLevels } from '../types';

export class ParticipantIntelligence extends BaseAnalyzer {
  public get name(): string { return 'ParticipantIntelligence'; }

  public async analyze(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Evaluate participant intelligence: agent effectiveness, delegation quality, 
    // human workload, participant specialization, descriptor quality, mission success.
    
    // Example: Descriptor Quality / Participant Specialization
    recommendations.push({
      id: `participant-descriptor-opt`,
      category: 'ParticipantOptimization',
      title: `Refine 'DataAnalyst' Descriptor Prompts`,
      description: `The 'DataAnalyst' agent is experiencing a 30% increase in delegation failure. Adjusting its descriptor constraints will improve role specialization.`,
      riskLevel: RiskLevels.LEVEL_2_CONFIGURATION,
      confidence: 0.90,
      supportingEvidence: [`Delegation fail rate went from 5% to 35% this week.`, `Agent context indicates confusion over 'write' vs 'read' permissions.`],
      historicalFrequency: 'First occurrence in 30 days',
      expectedBenefit: 'Improves mission success rate and reduces circular delegations.',
      estimatedRisk: 'Low. Descriptor updates are versioned.',
      rollbackStrategy: 'Revert to DataAnalyst descriptor v1.2.',
      constitutionalCompliance: true,
      autonomousEligibility: false, // Requires human approval to update descriptor behaviors
      timestamp: Date.now(),
      sourceAnalyzer: this.name
    });

    // Example: Human Workload
    recommendations.push({
      id: `participant-human-workload-opt`,
      category: 'ParticipantOptimization',
      title: `Elevate 'LogReview' Autonomous Eligibility`,
      description: `Human participants are spending 2.5 hours/day approving standard 'LogReview' tasks. Suggest elevating these tasks to fully autonomous.`,
      riskLevel: RiskLevels.LEVEL_3_BEHAVIORAL,
      confidence: 0.95,
      supportingEvidence: [`100% of 'LogReview' tasks were approved by humans without modification over the last 90 days.`],
      historicalFrequency: 'Daily task analysis',
      expectedBenefit: 'Frees 2.5 hours/day of human workload.',
      estimatedRisk: 'Medium. Reduces human oversight on logs.',
      rollbackStrategy: 'Re-enable mandatory human-in-the-loop for LogReview.',
      constitutionalCompliance: true,
      autonomousEligibility: false, // Must be approved by a human to reduce human oversight
      timestamp: Date.now(),
      sourceAnalyzer: this.name
    });

    return recommendations;
  }
}
