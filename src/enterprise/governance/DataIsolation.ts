// src/enterprise/governance/DataIsolation.ts
// Data isolation enforcement — Tenant database isolation, encryption, export/import

import { TenantContext, SYSTEM_TENANT_ID } from '../tenant/TenantContext';
import type { RegionCode } from '../tenant/types';

// ============================================================================
// Data Isolation Types
// ============================================================================

export interface TenantEncryptionConfig {
  tenantId: string;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'ChaCha20-Poly1305';
  keyId: string;
  keyVersion: number;
  rotationIntervalDays: number;
  lastRotatedAt: string;
  createdAt: string;
}

export interface DataExportManifest {
  id: string;
  tenantId: string;
  organizationId: string;
  format: 'json' | 'csv' | 'parquet';
  tables: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  sizeBytes: number;
  downloadUrl: string | null;
  encryptionKeyId: string | null;
  requestedBy: string;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
}

export interface DataImportJob {
  id: string;
  tenantId: string;
  sourceFormat: 'json' | 'csv' | 'parquet' | 'openclaw-export';
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  recordsTotal: number;
  recordsImported: number;
  errors: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface ReplicationConfig {
  tenantId: string;
  primaryRegion: RegionCode;
  replicaRegions: RegionCode[];
  replicationMode: 'async' | 'sync' | 'semi-sync';
  lagThresholdMs: number;
  status: 'active' | 'degraded' | 'inactive';
  lastSyncAt: string;
}

// ============================================================================
// Data Isolation Service
// ============================================================================

export class DataIsolation {
  private static instance: DataIsolation | null = null;

  private encryptionConfigs: Map<string, TenantEncryptionConfig> = new Map();
  private exports: Map<string, DataExportManifest> = new Map();
  private imports: Map<string, DataImportJob> = new Map();
  private replicationConfigs: Map<string, ReplicationConfig> = new Map();

  private constructor() {}

  public static getInstance(): DataIsolation {
    if (!DataIsolation.instance) {
      DataIsolation.instance = new DataIsolation();
    }
    return DataIsolation.instance;
  }

  // ======== Tenant Data Isolation Verification ========

  /**
   * Verify that the current request is properly isolated to its tenant scope.
   */
  public verifyIsolation(): { isolated: boolean; tenantId: string; violations: string[] } {
    const ctx = TenantContext.current();
    const violations: string[] = [];

    if (!ctx) {
      violations.push('No tenant context found — request is not scoped to any tenant.');
      return { isolated: false, tenantId: 'none', violations };
    }

    if (ctx.tenantId === SYSTEM_TENANT_ID) {
      return { isolated: true, tenantId: ctx.tenantId, violations: [] };
    }

    // Verify tenant context has required fields
    if (!ctx.organizationId) violations.push('Missing organizationId in tenant context.');
    if (!ctx.tenantId) violations.push('Missing tenantId in tenant context.');
    if (!ctx.userId) violations.push('Missing userId in tenant context.');

    return {
      isolated: violations.length === 0,
      tenantId: ctx.tenantId,
      violations,
    };
  }

  // ======== Row-Level Security ========

  /**
   * Generate a row-level security policy for a Prisma model.
   * This is the SQL that would be executed on PostgreSQL to enforce RLS.
   */
  public generateRLSPolicy(tableName: string, tenantIdColumn: string = 'tenant_id'): string {
    return [
      `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS tenant_isolation ON "${tableName}";`,
      `CREATE POLICY tenant_isolation ON "${tableName}"`,
      `  USING ("${tenantIdColumn}" = current_setting('app.current_tenant_id')::TEXT)`,
      `  WITH CHECK ("${tenantIdColumn}" = current_setting('app.current_tenant_id')::TEXT);`,
    ].join('\n');
  }

  /**
   * Generate RLS policies for all tenant-scoped tables.
   */
  public generateAllRLSPolicies(): string {
    const tables = [
      'User', 'Artifact', 'Workflow', 'WorkflowTemplate', 'WorkflowExecution',
      'WorkflowSchedule', 'WorkflowApproval', 'WorkflowHistory',
      'AuditLogEntry', 'AuditEvent', 'Config', 'ConfigHistory',
      'FeatureFlag', 'Secret', 'SchedulerJob', 'Job', 'JobCheckpoint', 'Session',
    ];

    return tables.map(t => this.generateRLSPolicy(t)).join('\n\n');
  }

  // ======== Encryption Key Management ========

  public configureEncryption(tenantId: string, params?: {
    algorithm?: TenantEncryptionConfig['algorithm'];
    rotationIntervalDays?: number;
  }): TenantEncryptionConfig {
    const config: TenantEncryptionConfig = {
      tenantId,
      algorithm: params?.algorithm ?? 'AES-256-GCM',
      keyId: `kek-${crypto.randomUUID()}`,
      keyVersion: 1,
      rotationIntervalDays: params?.rotationIntervalDays ?? 90,
      lastRotatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.encryptionConfigs.set(tenantId, config);
    console.log(`[DataIsolation] Configured encryption for tenant ${tenantId}: ${config.algorithm}`);
    return config;
  }

  public rotateEncryptionKey(tenantId: string): TenantEncryptionConfig {
    const config = this.encryptionConfigs.get(tenantId);
    if (!config) throw new Error(`No encryption config for tenant ${tenantId}.`);

    config.keyId = `kek-${crypto.randomUUID()}`;
    config.keyVersion++;
    config.lastRotatedAt = new Date().toISOString();

    console.log(`[DataIsolation] Rotated encryption key for tenant ${tenantId}: v${config.keyVersion}`);
    return config;
  }

  public getEncryptionConfig(tenantId: string): TenantEncryptionConfig | null {
    return this.encryptionConfigs.get(tenantId) ?? null;
  }

  // ======== Tenant Data Export (GDPR Portability) ========

  public requestExport(params: {
    tenantId: string;
    organizationId: string;
    format: 'json' | 'csv' | 'parquet';
    tables?: string[];
    requestedBy: string;
  }): DataExportManifest {
    const manifest: DataExportManifest = {
      id: `exp-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      format: params.format,
      tables: params.tables ?? ['all'],
      status: 'pending',
      sizeBytes: 0,
      downloadUrl: null,
      encryptionKeyId: this.encryptionConfigs.get(params.tenantId)?.keyId ?? null,
      requestedBy: params.requestedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    // Simulate export completion
    manifest.status = 'completed';
    manifest.sizeBytes = Math.floor(Math.random() * 100_000_000);
    manifest.downloadUrl = `https://exports.openclaw.io/${manifest.id}/download`;
    manifest.completedAt = new Date().toISOString();

    this.exports.set(manifest.id, manifest);
    console.log(`[DataIsolation] Data export completed: ${manifest.id} (${manifest.sizeBytes} bytes)`);
    return manifest;
  }

  public listExports(tenantId: string): DataExportManifest[] {
    return Array.from(this.exports.values()).filter(e => e.tenantId === tenantId);
  }

  // ======== Tenant Data Import ========

  public requestImport(params: {
    tenantId: string;
    sourceFormat: DataImportJob['sourceFormat'];
  }): DataImportJob {
    const job: DataImportJob = {
      id: `imp-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      sourceFormat: params.sourceFormat,
      status: 'pending',
      recordsTotal: 0,
      recordsImported: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.imports.set(job.id, job);
    console.log(`[DataIsolation] Import job created: ${job.id}`);
    return job;
  }

  // ======== Cross-Region Replication ========

  public configureReplication(tenantId: string, params: {
    primaryRegion: RegionCode;
    replicaRegions: RegionCode[];
    mode?: 'async' | 'sync' | 'semi-sync';
  }): ReplicationConfig {
    const config: ReplicationConfig = {
      tenantId,
      primaryRegion: params.primaryRegion,
      replicaRegions: params.replicaRegions,
      replicationMode: params.mode ?? 'async',
      lagThresholdMs: 1000,
      status: 'active',
      lastSyncAt: new Date().toISOString(),
    };

    this.replicationConfigs.set(tenantId, config);
    console.log(`[DataIsolation] Replication configured: ${params.primaryRegion} -> ${params.replicaRegions.join(', ')}`);
    return config;
  }

  public getReplicationStatus(tenantId: string): ReplicationConfig | null {
    return this.replicationConfigs.get(tenantId) ?? null;
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      tenantsWithEncryption: this.encryptionConfigs.size,
      totalExports: this.exports.size,
      totalImports: this.imports.size,
      replicatedTenants: this.replicationConfigs.size,
    };
  }
}

export const dataIsolation = DataIsolation.getInstance();
export default dataIsolation;
