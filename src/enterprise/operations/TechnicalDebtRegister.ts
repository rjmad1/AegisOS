// src/enterprise/operations/TechnicalDebtRegister.ts
// Operational register of single-tenancy remnants, refactoring requirements, and migrations

export interface DebtItem {
  id: string;
  category: 'architecture' | 'database' | 'security' | 'observability' | 'billing';
  title: string;
  description: string;
  remediationAction: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'scheduled' | 'remediated' | 'deferred';
  resolvedAt: string | null;
}

export class TechnicalDebtRegister {
  private static instance: TechnicalDebtRegister | null = null;
  private debtItems: DebtItem[] = [];

  private constructor() {
    this.seedDefaultDebt();
  }

  public static getInstance(): TechnicalDebtRegister {
    if (!TechnicalDebtRegister.instance) {
      TechnicalDebtRegister.instance = new TechnicalDebtRegister();
    }
    return TechnicalDebtRegister.instance;
  }

  public listDebt(status?: DebtItem['status']): DebtItem[] {
    if (status) {
      return this.debtItems.filter(d => d.status === status);
    }
    return [...this.debtItems];
  }

  public recordDebt(item: Omit<DebtItem, 'id' | 'resolvedAt'>): DebtItem {
    const newItem: DebtItem = {
      ...item,
      id: `DEBT-${String(this.debtItems.length + 1).padStart(3, '0')}`,
      resolvedAt: null,
    };
    this.debtItems.push(newItem);
    return newItem;
  }

  public resolveDebt(id: string): DebtItem {
    const item = this.debtItems.find(d => d.id === id);
    if (!item) throw new Error(`Debt item ${id} not found.`);
    item.status = 'remediated';
    item.resolvedAt = new Date().toISOString();
    return item;
  }

  private seedDefaultDebt(): void {
    this.debtItems.push(
      {
        id: 'DEBT-001',
        category: 'database',
        title: 'SQLite Database Provider in Production',
        description: 'SQLite is used for local workstation dev. Commercial SaaS deployment requires PostgreSQL for schema separation, concurrent writes, and native Row-Level Security (RLS).',
        remediationAction: 'Switch Prisma provider to "postgresql" in schema.prisma and execute prisma db push on target environments.',
        effort: 'medium',
        impact: 'high',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'DEBT-002',
        category: 'security',
        title: 'Legacy PermissionService Singleton Remnant',
        description: 'The standard PermissionService is singleton-based and relies on local workstation roles. It must be bypassed or fully aligned with RoleHierarchyService.',
        remediationAction: 'Inject TenantContext roles into PermissionService.can checks.',
        effort: 'low',
        impact: 'medium',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'DEBT-003',
        category: 'billing',
        title: 'In-Memory Usage Metering Storage',
        description: 'UsageMeteringEngine maintains usage records in-memory, which will reset on server restarts.',
        remediationAction: 'Persist UsageRecord objects into a persistent PostgreSQL table via Prisma.',
        effort: 'medium',
        impact: 'high',
        status: 'identified',
        resolvedAt: null,
      },
      {
        id: 'DEBT-004',
        category: 'architecture',
        title: 'Local File System Storage for Multi-Tenant Artifacts',
        description: 'File uploads and exports currently rely on local directories (uploadsDir, exportsDir) configured in Config.',
        remediationAction: 'Implement an S3/GCS bucket wrapper for multi-tenant storage with prefix-based isolation.',
        effort: 'high',
        impact: 'high',
        status: 'identified',
        resolvedAt: null,
      }
    );
  }
}

export const technicalDebtRegister = TechnicalDebtRegister.getInstance();
export default technicalDebtRegister;
