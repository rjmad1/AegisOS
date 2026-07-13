// src/enterprise/licensing/SubscriptionManager.ts
// Subscription tier management — Plans, upgrades, downgrades, add-ons

import { licenseEngine } from './LicenseEngine';
import type { TenantTier } from '../tenant/types';
import type { License } from './LicenseEngine';

// ============================================================================
// Subscription Types
// ============================================================================

export type BillingCycle = 'monthly' | 'annual' | 'custom';
export type SubscriptionStatus = 'active' | 'trialing' | 'past-due' | 'cancelled' | 'suspended' | 'expired';
export type SupportPlan = 'community' | 'basic' | 'standard' | 'premium' | 'dedicated';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: TenantTier;
  description: string;
  billingCycle: BillingCycle;
  pricePerMonth: number;          // USD cents
  pricePerYear: number;           // USD cents (discounted annual)
  includedSeats: number;
  additionalSeatPrice: number;    // Per seat per month
  features: string[];
  usageLimits: Record<string, number>;
  supportPlan: SupportPlan;
  trialDays: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  tenantId: string;
  planId: string;
  tier: TenantTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  seats: number;
  additionalSeats: number;
  addOns: SubscriptionAddOn[];
  supportPlan: SupportPlan;
  licenseId: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAddOn {
  id: string;
  name: string;
  type: 'feature-pack' | 'seat-pack' | 'storage-pack' | 'ai-token-pack' | 'support-upgrade';
  quantity: number;
  pricePerUnit: number;
  activatedAt: string;
}

// ============================================================================
// Plan Catalog
// ============================================================================

const PLAN_CATALOG: SubscriptionPlan[] = [
  {
    id: 'plan-free', name: 'Free', tier: 'free', description: 'For individuals and small experiments.',
    billingCycle: 'monthly', pricePerMonth: 0, pricePerYear: 0,
    includedSeats: 5, additionalSeatPrice: 0,
    features: ['ai-basic', 'knowledge-basic', 'workflows-basic', 'community-support'],
    usageLimits: { 'api-calls-per-min': 60, 'ai-tokens-per-month': 100_000, 'storage-gb': 1 },
    supportPlan: 'community', trialDays: 0,
  },
  {
    id: 'plan-professional', name: 'Professional', tier: 'professional', description: 'For growing teams.',
    billingCycle: 'monthly', pricePerMonth: 2500, pricePerYear: 25000,
    includedSeats: 10, additionalSeatPrice: 1500,
    features: ['ai-advanced', 'knowledge-advanced', 'workflows-advanced', 'marketplace-access', 'api-access'],
    usageLimits: { 'api-calls-per-min': 300, 'ai-tokens-per-month': 1_000_000, 'storage-gb': 10 },
    supportPlan: 'basic', trialDays: 14,
  },
  {
    id: 'plan-business', name: 'Business', tier: 'business', description: 'For departments and business units.',
    billingCycle: 'monthly', pricePerMonth: 7500, pricePerYear: 75000,
    includedSeats: 50, additionalSeatPrice: 1000,
    features: ['ai-enterprise', 'knowledge-advanced', 'workflows-enterprise', 'sso-integration', 'audit-export', 'custom-roles'],
    usageLimits: { 'api-calls-per-min': 1000, 'ai-tokens-per-month': 10_000_000, 'storage-gb': 100 },
    supportPlan: 'standard', trialDays: 30,
  },
  {
    id: 'plan-enterprise', name: 'Enterprise', tier: 'enterprise', description: 'For large organizations.',
    billingCycle: 'annual', pricePerMonth: 25000, pricePerYear: 250000,
    includedSeats: 500, additionalSeatPrice: 500,
    features: ['all-features'],
    usageLimits: { 'api-calls-per-min': 5000, 'ai-tokens-per-month': 100_000_000, 'storage-gb': 1000 },
    supportPlan: 'premium', trialDays: 30,
  },
];

// ============================================================================
// Subscription Manager
// ============================================================================

export class SubscriptionManager {
  private static instance: SubscriptionManager | null = null;
  private subscriptions: Map<string, Subscription> = new Map();

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  // ======== Plan Catalog ========

  public getPlans(): SubscriptionPlan[] {
    return [...PLAN_CATALOG];
  }

  public getPlan(planId: string): SubscriptionPlan | null {
    return PLAN_CATALOG.find(p => p.id === planId) ?? null;
  }

  // ======== Subscription Management ========

  public createSubscription(params: {
    organizationId: string;
    tenantId: string;
    planId: string;
    billingCycle: BillingCycle;
    seats?: number;
    startTrial?: boolean;
  }): Subscription {
    const plan = this.getPlan(params.planId);
    if (!plan) throw new Error(`Plan ${params.planId} not found.`);

    const now = new Date();
    const isTrial = params.startTrial && plan.trialDays > 0;
    const periodEnd = isTrial
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : params.billingCycle === 'annual'
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create associated license
    const license = licenseEngine.createLicense({
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      type: isTrial ? 'trial' : 'subscription',
      tier: plan.tier,
      seats: params.seats ?? plan.includedSeats,
      durationDays: isTrial ? plan.trialDays : (params.billingCycle === 'annual' ? 365 : 30),
    });

    // Auto-activate for trial and free plans
    if (isTrial || plan.tier === 'free') {
      licenseEngine.activateLicense(license.licenseKey, {
        tenantId: params.tenantId,
        activatedBy: 'system',
      });
    }

    const subscription: Subscription = {
      id: `sub-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      planId: params.planId,
      tier: plan.tier,
      status: isTrial ? 'trialing' : (plan.tier === 'free' ? 'active' : 'active'),
      billingCycle: params.billingCycle,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      seats: params.seats ?? plan.includedSeats,
      additionalSeats: 0,
      addOns: [],
      supportPlan: plan.supportPlan,
      licenseId: license.id,
      trialEndsAt: isTrial ? periodEnd.toISOString() : null,
      cancelledAt: null,
      cancelReason: null,
      metadata: {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.subscriptions.set(subscription.id, subscription);
    console.log(`[SubscriptionManager] Created ${plan.name} subscription: ${subscription.id}`);
    return subscription;
  }

  public upgradeSubscription(subscriptionId: string, newPlanId: string): Subscription {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

    const newPlan = this.getPlan(newPlanId);
    if (!newPlan) throw new Error(`Plan ${newPlanId} not found.`);

    const oldPlan = this.getPlan(sub.planId);

    sub.planId = newPlanId;
    sub.tier = newPlan.tier;
    sub.seats = Math.max(sub.seats, newPlan.includedSeats);
    sub.supportPlan = newPlan.supportPlan;
    sub.updatedAt = new Date().toISOString();
    sub.metadata = { ...sub.metadata, previousPlan: oldPlan?.name, upgradedAt: new Date().toISOString() };

    // Update license
    if (sub.licenseId) {
      const license = licenseEngine.getLicense(sub.licenseId);
      if (license) {
        license.tier = newPlan.tier;
        license.features = newPlan.features;
        license.seats = sub.seats;
        license.usageLimits = newPlan.usageLimits;
        license.updatedAt = new Date().toISOString();
      }
    }

    console.log(`[SubscriptionManager] Upgraded subscription ${subscriptionId} to ${newPlan.name}`);
    return sub;
  }

  public downgradeSubscription(subscriptionId: string, newPlanId: string): Subscription {
    // Same logic as upgrade but scheduled for end of current period
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

    sub.metadata = {
      ...sub.metadata,
      pendingDowngrade: newPlanId,
      downgradeEffectiveAt: sub.currentPeriodEnd,
    };
    sub.updatedAt = new Date().toISOString();

    console.log(`[SubscriptionManager] Scheduled downgrade for ${subscriptionId} to ${newPlanId} at period end`);
    return sub;
  }

  public cancelSubscription(subscriptionId: string, reason: string): Subscription {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

    sub.status = 'cancelled';
    sub.cancelledAt = new Date().toISOString();
    sub.cancelReason = reason;
    sub.updatedAt = new Date().toISOString();

    console.log(`[SubscriptionManager] Cancelled subscription ${subscriptionId}: ${reason}`);
    return sub;
  }

  public addAddOn(subscriptionId: string, addOn: Omit<SubscriptionAddOn, 'id' | 'activatedAt'>): Subscription {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

    sub.addOns.push({
      ...addOn,
      id: `addon-${crypto.randomUUID()}`,
      activatedAt: new Date().toISOString(),
    });
    sub.updatedAt = new Date().toISOString();

    console.log(`[SubscriptionManager] Added add-on "${addOn.name}" to subscription ${subscriptionId}`);
    return sub;
  }

  // ======== Queries ========

  public getSubscription(id: string): Subscription | null {
    return this.subscriptions.get(id) ?? null;
  }

  public getSubscriptionForTenant(tenantId: string): Subscription | null {
    for (const sub of this.subscriptions.values()) {
      if (sub.tenantId === tenantId && sub.status !== 'cancelled' && sub.status !== 'expired') return sub;
    }
    return null;
  }

  public listSubscriptions(organizationId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.organizationId === organizationId);
  }

  // ======== Statistics ========

  public getStats(): Record<string, unknown> {
    const all = Array.from(this.subscriptions.values());
    const active = all.filter(s => s.status === 'active' || s.status === 'trialing');
    const mrr = active.reduce((sum, s) => {
      const plan = this.getPlan(s.planId);
      return sum + (plan?.pricePerMonth ?? 0);
    }, 0);

    return {
      totalSubscriptions: all.length,
      activeSubscriptions: active.length,
      trialingSubscriptions: all.filter(s => s.status === 'trialing').length,
      cancelledSubscriptions: all.filter(s => s.status === 'cancelled').length,
      monthlyRecurringRevenue: mrr,
      byTier: {
        free: active.filter(s => s.tier === 'free').length,
        professional: active.filter(s => s.tier === 'professional').length,
        business: active.filter(s => s.tier === 'business').length,
        enterprise: active.filter(s => s.tier === 'enterprise').length,
      },
    };
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();
export default subscriptionManager;
