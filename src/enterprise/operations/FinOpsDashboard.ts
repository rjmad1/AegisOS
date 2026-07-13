// src/enterprise/operations/FinOpsDashboard.ts
// FinOps Dashboard — Aggregates spending summaries, savings recommendation queues, and forecasts

import { costOptimizationPlatform } from '../performance/CostOptimizationPlatform';

export interface FinOpsCategoryCost {
  category: string;
  monthlyCostUsd: number;
  savingsOpportunityUsd: number;
}

export interface FinOpsDashboardOverview {
  tenantId: string;
  totalMonthlySpentUsd: number;
  totalProjectedSavingsUsd: number;
  netSpendAfterSavingsUsd: number;
  wastePercentage: number;
  costsByCategory: FinOpsCategoryCost[];
  savingsTimelineRecommendations: {
    title: string;
    savingsUsd: number;
    priority: 'high' | 'medium' | 'low';
    remediationAction: string;
  }[];
}

export class FinOpsDashboard {
  private static instance: FinOpsDashboard | null = null;

  private constructor() {}

  public static getInstance(): FinOpsDashboard {
    if (!FinOpsDashboard.instance) {
      FinOpsDashboard.instance = new FinOpsDashboard();
    }
    return FinOpsDashboard.instance;
  }

  public getDashboardOverview(tenantId: string): FinOpsDashboardOverview {
    const savingsOpportunities = costOptimizationPlatform.identifySavings(tenantId);
    const efficiency = costOptimizationPlatform.getFinOpsEfficiency(tenantId);

    // Group items by category
    const categoryMap: Record<string, { cost: number; savings: number }> = {};
    for (const s of savingsOpportunities) {
      if (!categoryMap[s.type]) {
        categoryMap[s.type] = { cost: 0, savings: 0 };
      }
      categoryMap[s.type].cost += s.monthlyCostUsd;
      categoryMap[s.type].savings += s.potentialSavingsUsd;
    }

    const costsByCategory: FinOpsCategoryCost[] = Object.entries(categoryMap).map(([cat, val]) => ({
      category: cat.toUpperCase(),
      monthlyCostUsd: val.cost,
      savingsOpportunityUsd: val.savings,
    }));

    // Generate timeline recommendations
    const savingsTimelineRecommendations = savingsOpportunities.map(s => ({
      title: s.description,
      savingsUsd: s.potentialSavingsUsd,
      priority: s.potentialSavingsUsd > 1000 ? 'high' as const : s.potentialSavingsUsd > 200 ? 'medium' as const : 'low' as const,
      remediationAction: s.actionableStep,
    }));

    return {
      tenantId,
      totalMonthlySpentUsd: Number(efficiency.spentUsd.toFixed(2)),
      totalProjectedSavingsUsd: Number(efficiency.netSavingsUsd.toFixed(2)),
      netSpendAfterSavingsUsd: Number(efficiency.optimizedSpentUsd.toFixed(2)),
      wastePercentage: efficiency.wastePercentage,
      costsByCategory,
      savingsTimelineRecommendations: savingsTimelineRecommendations.sort((a, b) => b.savingsUsd - a.savingsUsd),
    };
  }
}

export const finOpsDashboard = FinOpsDashboard.getInstance();
export default finOpsDashboard;
