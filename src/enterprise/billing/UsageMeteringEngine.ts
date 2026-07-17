// src/enterprise/billing/UsageMeteringEngine.ts
// Real-time usage metering for AI, GPU, storage, API, knowledge, and marketplace

import { TenantContext } from '../tenant/TenantContext';
import { entitlementService } from '../licensing/EntitlementService';
import prisma from '../../infrastructure/db/prisma';

// ============================================================================
// Usage Record Types
// ============================================================================

export type UsageCategory = 'ai' | 'gpu' | 'storage' | 'api' | 'knowledge' | 'marketplace' | 'workflow' | 'compute';

export interface UsageRecord {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId: string | null;
  userId: string | null;
  category: UsageCategory;
  metric: string;
  quantity: number;
  unit: string;
  unitCost: number;             // Cost per unit in USD cents
  totalCost: number;            // quantity * unitCost in USD cents
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface UsageSummary {
  tenantId: string;
  period: string;              // ISO date range
  categories: Record<UsageCategory, CategoryUsage>;
  totalCostCents: number;
  totalRecords: number;
}

export interface CategoryUsage {
  totalQuantity: number;
  totalCostCents: number;
  metrics: Record<string, MetricUsage>;
}

export interface MetricUsage {
  quantity: number;
  costCents: number;
  unit: string;
}

// ============================================================================
// Cost Catalog — Per-unit pricing
// ============================================================================

const COST_CATALOG: Record<string, { unit: string; costPerUnit: number }> = {
  // AI usage
  'ai.prompt-tokens':      { unit: 'tokens',   costPerUnit: 0.0015  },  // $0.0015 per 1K tokens
  'ai.completion-tokens':  { unit: 'tokens',   costPerUnit: 0.003   },  // $0.003 per 1K tokens
  'ai.embedding-tokens':   { unit: 'tokens',   costPerUnit: 0.0001  },
  'ai.image-generation':   { unit: 'images',   costPerUnit: 2.0     },
  // GPU usage
  'gpu.compute-seconds':   { unit: 'seconds',  costPerUnit: 0.01    },
  'gpu.inference-seconds':  { unit: 'seconds', costPerUnit: 0.005   },
  // Storage
  'storage.bytes':         { unit: 'GB-month', costPerUnit: 2.3     },
  'storage.artifact-bytes':{ unit: 'GB-month', costPerUnit: 2.3     },
  'storage.embedding-bytes':{ unit: 'GB-month',costPerUnit: 3.0     },
  // API
  'api.requests':          { unit: 'requests', costPerUnit: 0.0001  },
  'api.bandwidth-bytes':   { unit: 'GB',       costPerUnit: 8.0     },
  // Knowledge
  'knowledge.ingestion':   { unit: 'documents',costPerUnit: 0.01    },
  'knowledge.queries':     { unit: 'queries',  costPerUnit: 0.001   },
  // Marketplace
  'marketplace.extension-usage': { unit: 'hours', costPerUnit: 0.1  },
  // Workflow
  'workflow.execution-minutes': { unit: 'minutes', costPerUnit: 0.02 },
};

// ============================================================================
// Usage Metering Engine
// ============================================================================

export class UsageMeteringEngine {
  private static instance: UsageMeteringEngine | null = null;
  private records: UsageRecord[] = [];
  private maxRecords = 100_000;

  private constructor() {
    this.init();
  }

  private async init() {
    try {
      const dbRecords = await prisma.usageRecord.findMany({
        take: this.maxRecords,
        orderBy: { timestamp: 'desc' }
      });
      this.records = dbRecords.map(r => ({
        id: r.id,
        tenantId: r.tenantId,
        organizationId: r.organizationId,
        workspaceId: r.workspaceId,
        userId: r.userId,
        category: r.category as any,
        metric: r.metric,
        quantity: r.quantity,
        unit: r.unit,
        unitCost: r.unitCost,
        totalCost: r.totalCost,
        metadata: JSON.parse(r.metadata || '{}'),
        timestamp: r.timestamp.toISOString()
      })).reverse();
      console.log(`[UsageMeteringEngine] Restored ${this.records.length} usage records from database.`);
    } catch (err: any) {
      console.warn(`[UsageMeteringEngine] Failed to restore records from database: ${err.message}`);
    }
  }

  public static getInstance(): UsageMeteringEngine {
    if (!UsageMeteringEngine.instance) {
      UsageMeteringEngine.instance = new UsageMeteringEngine();
    }
    return UsageMeteringEngine.instance;
  }

  // ======== Record Usage ========

  /**
   * Record a usage event. Automatically calculates cost and updates entitlement counters.
   */
  public record(params: {
    tenantId?: string;
    organizationId?: string;
    workspaceId?: string;
    userId?: string;
    category: UsageCategory;
    metric: string;
    quantity: number;
    metadata?: Record<string, unknown>;
  }): UsageRecord {
    const ctx = TenantContext.current();
    const tenantId = params.tenantId ?? ctx?.tenantId ?? 'unknown';
    const organizationId = params.organizationId ?? ctx?.organizationId ?? 'unknown';

    const catalogEntry = COST_CATALOG[params.metric];
    const unitCost = catalogEntry?.costPerUnit ?? 0;
    const totalCost = Math.round(params.quantity * unitCost * 100) / 100; // Round to 2 decimal places

    const record: UsageRecord = {
      id: `usg-${crypto.randomUUID()}`,
      tenantId,
      organizationId,
      workspaceId: params.workspaceId ?? ctx?.workspaceId ?? null,
      userId: params.userId ?? ctx?.userId ?? null,
      category: params.category,
      metric: params.metric,
      quantity: params.quantity,
      unit: catalogEntry?.unit ?? 'units',
      unitCost,
      totalCost,
      metadata: params.metadata ?? {},
      timestamp: new Date().toISOString(),
    };

    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    // Persist asynchronously to DB
    prisma.usageRecord.create({
      data: {
        id: record.id,
        tenantId: record.tenantId,
        organizationId: record.organizationId,
        workspaceId: record.workspaceId,
        userId: record.userId,
        category: record.category,
        metric: record.metric,
        quantity: record.quantity,
        unit: record.unit,
        unitCost: record.unitCost,
        totalCost: record.totalCost,
        metadata: JSON.stringify(record.metadata),
        timestamp: new Date(record.timestamp)
      }
    }).catch(err => {
      console.error("[UsageMeteringEngine] Asynchronous database write failed:", err);
    });

    // Update entitlement usage counters
    entitlementService.recordUsage(tenantId, params.metric, params.quantity);

    return record;
  }

  // ======== Convenience Methods ========

  public recordAiUsage(promptTokens: number, completionTokens: number, model?: string): void {
    const ctx = TenantContext.current();
    const tenantId = ctx?.tenantId ?? 'unknown';

    this.record({ tenantId, category: 'ai', metric: 'ai.prompt-tokens', quantity: promptTokens / 1000, metadata: { model } });
    this.record({ tenantId, category: 'ai', metric: 'ai.completion-tokens', quantity: completionTokens / 1000, metadata: { model } });

    // Update aggregated metric for quota checking
    entitlementService.recordUsage(tenantId, 'ai-tokens-per-month', promptTokens + completionTokens);
  }

  public recordApiCall(endpoint: string): void {
    this.record({ category: 'api', metric: 'api.requests', quantity: 1, metadata: { endpoint } });
  }

  public recordStorageUsage(bytes: number, type: string = 'general'): void {
    const gbMonths = bytes / (1024 * 1024 * 1024); // Convert to GB
    this.record({ category: 'storage', metric: 'storage.bytes', quantity: gbMonths, metadata: { type } });
  }

  public recordWorkflowExecution(durationMinutes: number, workflowId: string): void {
    this.record({ category: 'workflow', metric: 'workflow.execution-minutes', quantity: durationMinutes, metadata: { workflowId } });
  }

  public recordKnowledgeQuery(queryCount: number = 1): void {
    this.record({ category: 'knowledge', metric: 'knowledge.queries', quantity: queryCount });
  }

  // ======== Query Usage ========

  public getUsageSummary(tenantId: string, startDate?: string, endDate?: string): UsageSummary {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filtered = this.records.filter(r =>
      r.tenantId === tenantId &&
      new Date(r.timestamp) >= start &&
      new Date(r.timestamp) <= end
    );

    const categories: Record<UsageCategory, CategoryUsage> = {
      ai:          { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      gpu:         { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      storage:     { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      api:         { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      knowledge:   { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      marketplace: { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      workflow:    { totalQuantity: 0, totalCostCents: 0, metrics: {} },
      compute:     { totalQuantity: 0, totalCostCents: 0, metrics: {} },
    };

    let totalCostCents = 0;

    for (const r of filtered) {
      const cat = categories[r.category];
      cat.totalQuantity += r.quantity;
      cat.totalCostCents += Math.round(r.totalCost * 100);
      totalCostCents += Math.round(r.totalCost * 100);

      if (!cat.metrics[r.metric]) {
        cat.metrics[r.metric] = { quantity: 0, costCents: 0, unit: r.unit };
      }
      cat.metrics[r.metric].quantity += r.quantity;
      cat.metrics[r.metric].costCents += Math.round(r.totalCost * 100);
    }

    return {
      tenantId,
      period: `${start.toISOString()} - ${end.toISOString()}`,
      categories,
      totalCostCents,
      totalRecords: filtered.length,
    };
  }

  public getUsageByWorkspace(tenantId: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const r of this.records) {
      if (r.tenantId === tenantId && r.workspaceId) {
        result[r.workspaceId] = (result[r.workspaceId] ?? 0) + Math.round(r.totalCost * 100);
      }
    }
    return result;
  }

  public getUsageByUser(tenantId: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const r of this.records) {
      if (r.tenantId === tenantId && r.userId) {
        result[r.userId] = (result[r.userId] ?? 0) + Math.round(r.totalCost * 100);
      }
    }
    return result;
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      totalRecords: this.records.length,
      uniqueTenants: new Set(this.records.map(r => r.tenantId)).size,
      totalCostCents: this.records.reduce((sum, r) => sum + Math.round(r.totalCost * 100), 0),
    };
  }
}

export const usageMeteringEngine = UsageMeteringEngine.getInstance();
export default usageMeteringEngine;
