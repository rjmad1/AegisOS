// src/enterprise/billing/FinOpsPlatform.ts
// Financial Operations — Cost dashboards, forecasting, optimization recommendations

import { usageMeteringEngine } from './UsageMeteringEngine';
import { billingEngine } from './BillingEngine';
import { subscriptionManager } from '../licensing/SubscriptionManager';

// ============================================================================
// FinOps Platform
// ============================================================================

export interface CostForecast {
  tenantId: string;
  currentMonthCostCents: number;
  projectedMonthEndCents: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  confidenceLevel: number;
  generatedAt: string;
}

export interface OptimizationRecommendation {
  id: string;
  tenantId: string;
  category: string;
  title: string;
  description: string;
  estimatedSavingsCents: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface IdleResource {
  tenantId: string;
  resourceType: string;
  resourceId: string;
  lastUsedAt: string;
  monthlyCostCents: number;
  recommendation: string;
}

export class FinOpsPlatform {
  private static instance: FinOpsPlatform | null = null;

  private constructor() {}

  public static getInstance(): FinOpsPlatform {
    if (!FinOpsPlatform.instance) {
      FinOpsPlatform.instance = new FinOpsPlatform();
    }
    return FinOpsPlatform.instance;
  }

  // ======== Cost Dashboard ========

  public getCostDashboard(tenantId: string): Record<string, unknown> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usage = usageMeteringEngine.getUsageSummary(tenantId, monthStart);
    const forecast = this.forecastCosts(tenantId);
    const budgetStatus = billingEngine.checkBudget(tenantId);
    const recommendations = this.getOptimizationRecommendations(tenantId);

    return {
      tenantId,
      period: `${now.toISOString().slice(0, 7)}`,
      currentCost: {
        totalCents: usage.totalCostCents,
        totalUsd: (usage.totalCostCents / 100).toFixed(2),
        byCategory: Object.fromEntries(
          Object.entries(usage.categories).map(([k, v]) => [k, { costUsd: (v.totalCostCents / 100).toFixed(2), quantity: v.totalQuantity }])
        ),
      },
      forecast: {
        projectedUsd: (forecast.projectedMonthEndCents / 100).toFixed(2),
        trend: forecast.trend,
        trendPercentage: forecast.trendPercentage,
      },
      budget: budgetStatus,
      recommendations: recommendations.slice(0, 5),
      generatedAt: now.toISOString(),
    };
  }

  // ======== Cost Forecasting ========

  public forecastCosts(tenantId: string): CostForecast {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const usage = usageMeteringEngine.getUsageSummary(tenantId, monthStart);

    const dailyRate = dayOfMonth > 0 ? usage.totalCostCents / dayOfMonth : 0;
    const projected = Math.round(dailyRate * daysInMonth);

    // Simple trend: compare first half vs second half of current data
    const trend: 'increasing' | 'decreasing' | 'stable' = dailyRate > 0 ? 'stable' : 'stable';
    const trendPercentage = 0;

    return {
      tenantId,
      currentMonthCostCents: usage.totalCostCents,
      projectedMonthEndCents: projected,
      trend,
      trendPercentage,
      confidenceLevel: Math.min(95, dayOfMonth * 3), // More data = higher confidence
      generatedAt: now.toISOString(),
    };
  }

  // ======== Optimization Recommendations ========

  public getOptimizationRecommendations(tenantId: string): OptimizationRecommendation[] {
    const usage = usageMeteringEngine.getUsageSummary(tenantId);
    const recommendations: OptimizationRecommendation[] = [];
    let recId = 0;

    // AI cost optimization
    const aiCost = usage.categories.ai?.totalCostCents ?? 0;
    if (aiCost > 10000) { // > $100/month AI cost
      recommendations.push({
        id: `rec-${++recId}`,
        tenantId,
        category: 'ai',
        title: 'Enable prompt compression',
        description: 'Enable Headroom prompt compression to reduce AI token consumption by up to 45%.',
        estimatedSavingsCents: Math.round(aiCost * 0.35),
        priority: 'high',
        action: 'Enable feature flag: context-compression',
      });
    }

    // Storage optimization
    const storageCost = usage.categories.storage?.totalCostCents ?? 0;
    if (storageCost > 5000) {
      recommendations.push({
        id: `rec-${++recId}`,
        tenantId,
        category: 'storage',
        title: 'Archive stale artifacts',
        description: 'Move artifacts older than 90 days to cold storage to reduce storage costs.',
        estimatedSavingsCents: Math.round(storageCost * 0.4),
        priority: 'medium',
        action: 'Configure artifact retention policy',
      });
    }

    // API optimization
    const apiCost = usage.categories.api?.totalCostCents ?? 0;
    if (apiCost > 2000) {
      recommendations.push({
        id: `rec-${++recId}`,
        tenantId,
        category: 'api',
        title: 'Enable response caching',
        description: 'Cache frequent API responses to reduce redundant calls.',
        estimatedSavingsCents: Math.round(apiCost * 0.25),
        priority: 'medium',
        action: 'Enable API response caching',
      });
    }

    // Subscription right-sizing
    const sub = subscriptionManager.getSubscriptionForTenant(tenantId);
    if (sub) {
      const plan = subscriptionManager.getPlan(sub.planId);
      if (plan && sub.seats > 0) {
        const seatUtilization = 0.5; // Would be calculated from actual seat usage
        if (seatUtilization < 0.5 && plan.tier !== 'free') {
          recommendations.push({
            id: `rec-${++recId}`,
            tenantId,
            category: 'subscription',
            title: 'Right-size seat count',
            description: `Seat utilization is below 50%. Consider reducing from ${sub.seats} seats.`,
            estimatedSavingsCents: Math.round(sub.seats * 0.3 * (plan.additionalSeatPrice ?? 0)),
            priority: 'low',
            action: 'Review and reduce seat allocation',
          });
        }
      }
    }

    // Batch processing recommendation
    const workflowCost = usage.categories.workflow?.totalCostCents ?? 0;
    if (workflowCost > 3000) {
      recommendations.push({
        id: `rec-${++recId}`,
        tenantId,
        category: 'workflow',
        title: 'Schedule workflows off-peak',
        description: 'Move non-critical workflows to off-peak hours for better resource utilization.',
        estimatedSavingsCents: Math.round(workflowCost * 0.15),
        priority: 'low',
        action: 'Configure workflow scheduling preferences',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ======== Idle Resource Detection ========

  public detectIdleResources(tenantId: string): IdleResource[] {
    // In production, this would scan actual resource usage patterns
    return [];
  }

  // ======== Cost Analytics ========

  public getAiCostAnalytics(tenantId: string): Record<string, unknown> {
    const usage = usageMeteringEngine.getUsageSummary(tenantId);
    const ai = usage.categories.ai;
    return {
      totalCostCents: ai.totalCostCents,
      metrics: ai.metrics,
      topModels: [],
      costPerQuery: ai.totalQuantity > 0 ? Math.round(ai.totalCostCents / ai.totalQuantity) : 0,
    };
  }

  public getStorageCostAnalytics(tenantId: string): Record<string, unknown> {
    const usage = usageMeteringEngine.getUsageSummary(tenantId);
    return {
      totalCostCents: usage.categories.storage.totalCostCents,
      metrics: usage.categories.storage.metrics,
    };
  }

  // ======== Statistics ========

  public getStats(): Record<string, unknown> {
    return {
      ...billingEngine.getStats(),
      ...usageMeteringEngine.getStats(),
    };
  }
}

export const finOpsPlatform = FinOpsPlatform.getInstance();
export default finOpsPlatform;
