// src/enterprise/licensing/EntitlementService.ts
// Real-time feature entitlement checking and usage quota enforcement

import { licenseEngine } from './LicenseEngine';
import { subscriptionManager } from './SubscriptionManager';
import { TenantContext } from '../tenant/TenantContext';

// ============================================================================
// Entitlement Types
// ============================================================================

export interface EntitlementCheck {
  entitled: boolean;
  feature: string;
  reason: string | null;
  tier: string;
  limit: number | null;
  used: number | null;
  remaining: number | null;
}

export interface QuotaUsage {
  metric: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  exceeded: boolean;
}

// ============================================================================
// Entitlement Service
// ============================================================================

export class EntitlementService {
  private static instance: EntitlementService | null = null;

  // Track real-time usage per tenant per metric
  private usageCounters: Map<string, Map<string, number>> = new Map(); // tenantId -> metric -> count

  private constructor() {}

  public static getInstance(): EntitlementService {
    if (!EntitlementService.instance) {
      EntitlementService.instance = new EntitlementService();
    }
    return EntitlementService.instance;
  }

  // ======== Feature Entitlement ========

  /**
   * Check if the current tenant is entitled to a specific feature.
   */
  public checkFeature(feature: string, tenantId?: string): EntitlementCheck {
    const tid = tenantId ?? TenantContext.current()?.tenantId;
    if (!tid) {
      return { entitled: false, feature, reason: 'No tenant context.', tier: 'unknown', limit: null, used: null, remaining: null };
    }

    // System tenant always has full entitlement
    if (tid === '__system__') {
      return { entitled: true, feature, reason: null, tier: 'system', limit: null, used: null, remaining: null };
    }

    const entitled = licenseEngine.checkFeatureEntitlement(tid, feature);
    const validation = licenseEngine.validate(tid);

    if (!entitled) {
      return {
        entitled: false, feature,
        reason: `Feature "${feature}" is not included in the current ${validation.license?.tier ?? 'free'} plan.`,
        tier: validation.license?.tier ?? 'free',
        limit: null, used: null, remaining: null,
      };
    }

    return {
      entitled: true, feature, reason: null,
      tier: validation.license?.tier ?? 'free',
      limit: null, used: null, remaining: null,
    };
  }

  /**
   * Guard: throws if the current tenant is not entitled to a feature.
   */
  public requireFeature(feature: string): void {
    const check = this.checkFeature(feature);
    if (!check.entitled) {
      throw new Error(`[Entitlement] Access denied: ${check.reason} Upgrade your plan to access this feature.`);
    }
  }

  // ======== Usage Quota Enforcement ========

  /**
   * Check if a usage quota allows the requested consumption.
   */
  public checkQuota(metric: string, requestedAmount: number = 1, tenantId?: string): QuotaUsage {
    const tid = tenantId ?? TenantContext.current()?.tenantId;
    if (!tid || tid === '__system__') {
      return { metric, limit: Infinity, used: 0, remaining: Infinity, percentage: 0, exceeded: false };
    }

    const validation = licenseEngine.validate(tid);
    const limit = validation.license?.usageLimits[metric] ?? 0;
    const used = this.getUsage(tid, metric);
    const remaining = Math.max(0, limit - used);

    return {
      metric, limit, used, remaining,
      percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
      exceeded: used + requestedAmount > limit,
    };
  }

  /**
   * Guard: throws if quota would be exceeded.
   */
  public requireQuota(metric: string, amount: number = 1): void {
    const quota = this.checkQuota(metric, amount);
    if (quota.exceeded) {
      throw new Error(
        `[Entitlement] Quota exceeded for "${metric}": ` +
        `${quota.used}/${quota.limit} used (requested ${amount}). ` +
        `Upgrade your plan or wait for the quota to reset.`
      );
    }
  }

  // ======== Usage Tracking ========

  /**
   * Record usage of a metered resource.
   */
  public recordUsage(tenantId: string, metric: string, amount: number = 1): void {
    if (!this.usageCounters.has(tenantId)) {
      this.usageCounters.set(tenantId, new Map());
    }
    const tenantUsage = this.usageCounters.get(tenantId)!;
    const current = tenantUsage.get(metric) ?? 0;
    tenantUsage.set(metric, current + amount);
  }

  /**
   * Get current usage for a metric.
   */
  public getUsage(tenantId: string, metric: string): number {
    return this.usageCounters.get(tenantId)?.get(metric) ?? 0;
  }

  /**
   * Get all usage metrics for a tenant.
   */
  public getAllUsage(tenantId: string): Record<string, QuotaUsage> {
    const validation = licenseEngine.validate(tenantId);
    const limits = validation.license?.usageLimits ?? {};
    const result: Record<string, QuotaUsage> = {};

    for (const [metric, limit] of Object.entries(limits)) {
      const used = this.getUsage(tenantId, metric);
      result[metric] = {
        metric, limit, used,
        remaining: Math.max(0, limit - used),
        percentage: limit > 0 ? Math.round((used / limit) * 100) : 0,
        exceeded: used > limit,
      };
    }

    return result;
  }

  /**
   * Reset usage counters (called at billing period boundaries).
   */
  public resetUsage(tenantId: string, metrics?: string[]): void {
    const tenantUsage = this.usageCounters.get(tenantId);
    if (!tenantUsage) return;

    if (metrics) {
      for (const m of metrics) tenantUsage.delete(m);
    } else {
      tenantUsage.clear();
    }
    console.log(`[EntitlementService] Reset usage counters for tenant ${tenantId}`);
  }

  // ======== Batch Entitlement Check ========

  /**
   * Check multiple features at once.
   */
  public checkFeatures(features: string[], tenantId?: string): Record<string, EntitlementCheck> {
    const result: Record<string, EntitlementCheck> = {};
    for (const feature of features) {
      result[feature] = this.checkFeature(feature, tenantId);
    }
    return result;
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    let totalTrackedTenants = 0;
    let totalMetrics = 0;

    for (const tenantUsage of this.usageCounters.values()) {
      totalTrackedTenants++;
      totalMetrics += tenantUsage.size;
    }

    return { totalTrackedTenants, totalMetrics };
  }
}

export const entitlementService = EntitlementService.getInstance();
export default entitlementService;
