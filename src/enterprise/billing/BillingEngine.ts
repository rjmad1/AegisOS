// src/enterprise/billing/BillingEngine.ts
// Billing orchestration — Invoices, credits, budgets, cost allocation, chargeback

import { usageMeteringEngine } from './UsageMeteringEngine';
import { subscriptionManager } from '../licensing/SubscriptionManager';

// ============================================================================
// Billing Types
// ============================================================================

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'past-due' | 'void' | 'refunded';
export type CreditType = 'prepaid' | 'promotional' | 'referral' | 'goodwill' | 'refund';

export interface Invoice {
  id: string;
  organizationId: string;
  tenantId: string;
  subscriptionId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  discountCents: number;
  creditAppliedCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  category: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface Credit {
  id: string;
  organizationId: string;
  type: CreditType;
  amountCents: number;
  remainingCents: number;
  description: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  limitCents: number;
  currentSpendCents: number;
  alertThresholds: number[];      // Percentages, e.g., [50, 75, 90, 100]
  alertsSent: number[];           // Which thresholds have triggered
  hardCap: boolean;               // If true, blocks usage at 100%
  period: 'monthly' | 'quarterly' | 'annual';
  periodStart: string;
  createdAt: string;
}

export interface CostAllocation {
  tenantId: string;
  workspaceId: string | null;
  departmentId: string | null;
  costCenterCode: string | null;
  totalCostCents: number;
  period: string;
  breakdown: Record<string, number>; // category -> cost
}

// ============================================================================
// Billing Engine
// ============================================================================

export class BillingEngine {
  private static instance: BillingEngine | null = null;

  private invoices: Map<string, Invoice> = new Map();
  private credits: Map<string, Credit> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private invoiceCounter = 1000;

  private constructor() {}

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  // ======== Invoice Management ========

  public generateInvoice(params: {
    organizationId: string;
    tenantId: string;
    subscriptionId: string;
    periodStart: string;
    periodEnd: string;
  }): Invoice {
    const sub = subscriptionManager.getSubscription(params.subscriptionId);
    const plan = sub ? subscriptionManager.getPlan(sub.planId) : null;
    const usage = usageMeteringEngine.getUsageSummary(params.tenantId, params.periodStart, params.periodEnd);

    const lineItems: InvoiceLineItem[] = [];

    // Base subscription fee
    if (plan) {
      lineItems.push({
        description: `${plan.name} Plan - ${sub?.billingCycle} subscription`,
        category: 'subscription',
        quantity: 1,
        unitPriceCents: plan.pricePerMonth,
        totalCents: plan.pricePerMonth,
      });

      // Additional seats
      if (sub && sub.additionalSeats > 0) {
        lineItems.push({
          description: `Additional seats (${sub.additionalSeats})`,
          category: 'seats',
          quantity: sub.additionalSeats,
          unitPriceCents: plan.additionalSeatPrice,
          totalCents: sub.additionalSeats * plan.additionalSeatPrice,
        });
      }

      // Add-ons
      if (sub) {
        for (const addOn of sub.addOns) {
          lineItems.push({
            description: addOn.name,
            category: 'add-on',
            quantity: addOn.quantity,
            unitPriceCents: addOn.pricePerUnit,
            totalCents: addOn.quantity * addOn.pricePerUnit,
          });
        }
      }
    }

    // Usage-based charges
    for (const [category, categoryUsage] of Object.entries(usage.categories)) {
      if (categoryUsage.totalCostCents > 0) {
        lineItems.push({
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} usage`,
          category: `usage-${category}`,
          quantity: categoryUsage.totalQuantity,
          unitPriceCents: Math.round(categoryUsage.totalCostCents / Math.max(categoryUsage.totalQuantity, 1)),
          totalCents: categoryUsage.totalCostCents,
        });
      }
    }

    const subtotalCents = lineItems.reduce((sum, li) => sum + li.totalCents, 0);
    const creditApplied = this.applyCredits(params.organizationId, subtotalCents);
    const taxRate = 0; // Tax calculation would be handled by tax service
    const taxCents = Math.round((subtotalCents - creditApplied) * taxRate);

    this.invoiceCounter++;
    const invoice: Invoice = {
      id: `inv-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      subscriptionId: params.subscriptionId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(this.invoiceCounter).padStart(6, '0')}`,
      status: 'issued',
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      lineItems,
      subtotalCents,
      discountCents: 0,
      creditAppliedCents: creditApplied,
      taxCents,
      totalCents: subtotalCents - creditApplied + taxCents,
      currency: 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: null,
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    this.invoices.set(invoice.id, invoice);
    console.log(`[BillingEngine] Generated invoice ${invoice.invoiceNumber}: $${(invoice.totalCents / 100).toFixed(2)}`);
    return invoice;
  }

  public markInvoicePaid(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);
    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    return invoice;
  }

  public listInvoices(organizationId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter(i => i.organizationId === organizationId);
  }

  // ======== Credit Management ========

  public addCredit(params: {
    organizationId: string;
    type: CreditType;
    amountCents: number;
    description: string;
    expiresAt?: string;
  }): Credit {
    const credit: Credit = {
      id: `crd-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      type: params.type,
      amountCents: params.amountCents,
      remainingCents: params.amountCents,
      description: params.description,
      expiresAt: params.expiresAt ?? null,
      createdAt: new Date().toISOString(),
    };

    this.credits.set(credit.id, credit);
    console.log(`[BillingEngine] Added $${(params.amountCents / 100).toFixed(2)} ${params.type} credit`);
    return credit;
  }

  private applyCredits(organizationId: string, amountCents: number): number {
    let remaining = amountCents;
    let applied = 0;

    const orgCredits = Array.from(this.credits.values())
      .filter(c => c.organizationId === organizationId && c.remainingCents > 0)
      .filter(c => !c.expiresAt || new Date(c.expiresAt) > new Date())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // FIFO

    for (const credit of orgCredits) {
      if (remaining <= 0) break;
      const deduction = Math.min(credit.remainingCents, remaining);
      credit.remainingCents -= deduction;
      remaining -= deduction;
      applied += deduction;
    }

    return applied;
  }

  public getCreditBalance(organizationId: string): number {
    return Array.from(this.credits.values())
      .filter(c => c.organizationId === organizationId && c.remainingCents > 0)
      .filter(c => !c.expiresAt || new Date(c.expiresAt) > new Date())
      .reduce((sum, c) => sum + c.remainingCents, 0);
  }

  // ======== Budget Management ========

  public createBudget(params: {
    tenantId: string;
    organizationId: string;
    name: string;
    limitCents: number;
    alertThresholds?: number[];
    hardCap?: boolean;
    period?: 'monthly' | 'quarterly' | 'annual';
  }): Budget {
    const budget: Budget = {
      id: `bgt-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      name: params.name,
      limitCents: params.limitCents,
      currentSpendCents: 0,
      alertThresholds: params.alertThresholds ?? [50, 75, 90, 100],
      alertsSent: [],
      hardCap: params.hardCap ?? false,
      period: params.period ?? 'monthly',
      periodStart: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.budgets.set(budget.id, budget);
    console.log(`[BillingEngine] Created budget "${params.name}": $${(params.limitCents / 100).toFixed(2)}`);
    return budget;
  }

  public checkBudget(tenantId: string): { withinBudget: boolean; alerts: string[] } {
    const tenantBudgets = Array.from(this.budgets.values()).filter(b => b.tenantId === tenantId);
    const alerts: string[] = [];
    let withinBudget = true;

    for (const budget of tenantBudgets) {
      const usage = usageMeteringEngine.getUsageSummary(tenantId, budget.periodStart);
      budget.currentSpendCents = usage.totalCostCents;

      const percentage = (budget.currentSpendCents / budget.limitCents) * 100;

      for (const threshold of budget.alertThresholds) {
        if (percentage >= threshold && !budget.alertsSent.includes(threshold)) {
          budget.alertsSent.push(threshold);
          alerts.push(`Budget "${budget.name}" has reached ${threshold}% ($${(budget.currentSpendCents / 100).toFixed(2)} of $${(budget.limitCents / 100).toFixed(2)})`);
        }
      }

      if (budget.hardCap && percentage >= 100) {
        withinBudget = false;
      }
    }

    return { withinBudget, alerts };
  }

  // ======== Cost Allocation ========

  public getCostAllocation(tenantId: string, period?: string): CostAllocation[] {
    const usage = usageMeteringEngine.getUsageByWorkspace(tenantId);
    const allocations: CostAllocation[] = [];

    for (const [workspaceId, costCents] of Object.entries(usage)) {
      allocations.push({
        tenantId,
        workspaceId,
        departmentId: null,
        costCenterCode: null,
        totalCostCents: costCents,
        period: period ?? new Date().toISOString().slice(0, 7),
        breakdown: { general: costCents },
      });
    }

    return allocations;
  }

  // ======== Chargeback / Showback ========

  public getChargebackReport(organizationId: string): Record<string, unknown> {
    const invoices = this.listInvoices(organizationId);
    const totalBilled = invoices.reduce((sum, i) => sum + i.totalCents, 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalCents, 0);
    const outstanding = invoices.filter(i => i.status === 'issued').reduce((sum, i) => sum + i.totalCents, 0);

    return {
      organizationId,
      totalBilledCents: totalBilled,
      totalPaidCents: totalPaid,
      outstandingCents: outstanding,
      creditBalanceCents: this.getCreditBalance(organizationId),
      invoiceCount: invoices.length,
      generatedAt: new Date().toISOString(),
    };
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    const invoices = Array.from(this.invoices.values());
    return {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      totalRevenueCents: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalCents, 0),
      outstandingCents: invoices.filter(i => i.status === 'issued').reduce((s, i) => s + i.totalCents, 0),
      totalCreditsOutstanding: Array.from(this.credits.values()).reduce((s, c) => s + c.remainingCents, 0),
      activeBudgets: this.budgets.size,
    };
  }
}

export const billingEngine = BillingEngine.getInstance();
export default billingEngine;
