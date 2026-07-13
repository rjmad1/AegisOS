// src/enterprise/operations/PerformanceTechnicalDebtRegister.ts
// Performance Technical Debt Register — Operational ledger of system bottlenecks and remediation pathways

export interface PerformanceDebtItem {
  id: string;
  category: 'database' | 'gpu' | 'caching' | 'runtime' | 'retrieval';
  title: string;
  description: string;
  remediationAction: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  status: 'identified' | 'scheduled' | 'remediated' | 'deferred';
  resolvedAt: string | null;
}

export class PerformanceTechnicalDebtRegister {
  private static instance: PerformanceTechnicalDebtRegister | null = null;
  private debtItems: PerformanceDebtItem[] = [];

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): PerformanceTechnicalDebtRegister {
    if (!PerformanceTechnicalDebtRegister.instance) {
      PerformanceTechnicalDebtRegister.instance = new PerformanceTechnicalDebtRegister();
    }
    return PerformanceTechnicalDebtRegister.instance;
  }

  public listDebt(status?: PerformanceDebtItem['status']): PerformanceDebtItem[] {
    if (status) {
      return this.debtItems.filter(item => item.status === status);
    }
    return [...this.debtItems];
  }

  public recordDebt(item: Omit<PerformanceDebtItem, 'id' | 'resolvedAt'>): PerformanceDebtItem {
    const id = `PERF-DEBT-${String(this.debtItems.length + 1).padStart(3, '0')}`;
    const newItem: PerformanceDebtItem = {
      ...item,
      id,
      resolvedAt: null,
    };
    this.debtItems.push(newItem);
    return newItem;
  }

  public resolveDebt(id: string): PerformanceDebtItem {
    const item = this.debtItems.find(d => d.id === id);
    if (!item) {
      throw new Error(`Performance debt item ${id} not found.`);
    }
    item.status = 'remediated';
    item.resolvedAt = new Date().toISOString();
    return item;
  }

  private seedDefaults(): void {
    this.debtItems.push(
      {
        id: 'PERF-DEBT-001',
        category: 'database',
        title: 'Missing indexes on Workspace and Tenant tables',
        description: 'Prisma queries filtering by workspaceId and tenantId run full-table scans when foreign key indexes are absent in sqlite or early PG instances.',
        remediationAction: 'Run migrations to add explicit compound index on (tenantId, organizationId).',
        impact: 'high',
        effort: 'low',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'PERF-DEBT-002',
        category: 'gpu',
        title: 'Single-thread model queue serialization',
        description: 'Ollama local inference serialization limits model throughput to 1 execution concurrently, backing up agent execution pipeline queues.',
        remediationAction: 'Enable model multiplexing and queue pooling via GPUOptimizationPlatform.',
        impact: 'high',
        effort: 'high',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'PERF-DEBT-003',
        category: 'caching',
        title: 'Missing Semantic Cache for repetitive chat queries',
        description: 'Repetitive system prompts and greeting lookups hit local Ollama/LiteLLM models costing token fees and adding ~1200ms latency overhead.',
        remediationAction: 'Integrate Semantic Cache lookup check in multiLevelCacheFramework before routing requests.',
        impact: 'medium',
        effort: 'medium',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'PERF-DEBT-004',
        category: 'runtime',
        title: 'Synchronous execution of multi-agent plans',
        description: 'Plan compilation runs steps sequentially. Complex orchestrations with 5+ agents block event loop, exceeding 3.5s latency.',
        remediationAction: 'Optimize plan scheduler to execute non-dependent branches in Parallel.',
        impact: 'high',
        effort: 'medium',
        status: 'identified',
        resolvedAt: null,
      }
    );
  }
}

export const performanceTechnicalDebtRegister = PerformanceTechnicalDebtRegister.getInstance();
export default performanceTechnicalDebtRegister;
