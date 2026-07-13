// src/enterprise/tenant/types.ts
// Enterprise Multi-Tenant Type Definitions

// ============================================================================
// Organization — Top-level commercial entity (the "customer")
// ============================================================================

export type OrganizationStatus = 'active' | 'suspended' | 'archived' | 'pending' | 'deleted';
export type TenantStatus = 'active' | 'provisioning' | 'suspended' | 'archived' | 'migrating' | 'deleted';
export type WorkspaceStatus = 'active' | 'suspended' | 'archived' | 'deleted';
export type EnvironmentType = 'development' | 'staging' | 'production' | 'sandbox' | 'disaster-recovery';
export type RegionCode = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'eu-central-1' | 'ap-southeast-1' | 'ap-northeast-1' | string;
export type IsolationLevel = 'shared' | 'dedicated-schema' | 'dedicated-database' | 'dedicated-cluster';
export type TenantTier = 'free' | 'professional' | 'business' | 'enterprise' | 'custom';

export interface Organization {
  id: string;
  name: string;
  slug: string;                    // URL-friendly identifier (e.g., "acme-corp")
  displayName: string;
  status: OrganizationStatus;
  tier: TenantTier;
  domain: string | null;           // Verified email domain for auto-join
  customDomain: string | null;     // White-label custom domain
  logoUrl: string | null;
  primaryRegion: RegionCode;
  settings: OrganizationSettings;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrganizationSettings {
  maxTenants: number;
  maxUsersPerTenant: number;
  maxWorkspacesPerTenant: number;
  ssoEnabled: boolean;
  ssoProvider: string | null;       // SAML/OIDC provider URL
  mfaRequired: boolean;
  ipAllowlist: string[];
  dataRetentionDays: number;
  auditRetentionDays: number;
  aiPolicyEnabled: boolean;
  marketplaceEnabled: boolean;
  customBrandingEnabled: boolean;
}

// ============================================================================
// Tenant — Isolated logical deployment within an organization
// ============================================================================

export interface Tenant {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  displayName: string;
  status: TenantStatus;
  environment: EnvironmentType;
  region: RegionCode;
  isolationLevel: IsolationLevel;
  tier: TenantTier;
  settings: TenantSettings;
  resourceQuotas: ResourceQuotas;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
}

export interface TenantSettings {
  maxWorkspaces: number;
  maxUsers: number;
  maxApiKeysPerUser: number;
  maxStorageGb: number;
  maxAiRequestsPerDay: number;
  customEncryptionKey: string | null;
  backupEnabled: boolean;
  backupFrequencyHours: number;
  crossRegionReplication: boolean;
  replicationRegions: RegionCode[];
}

export interface ResourceQuotas {
  maxStorageBytes: number;
  maxAiTokensPerMonth: number;
  maxApiCallsPerMinute: number;
  maxConcurrentWorkflows: number;
  maxAgents: number;
  maxKnowledgeBases: number;
  maxPlugins: number;
  maxCustomModels: number;
}

// ============================================================================
// Workspace — Project-level container within a tenant
// ============================================================================

export interface Workspace {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  status: WorkspaceStatus;
  departmentId: string | null;
  businessUnitId: string | null;
  projectId: string | null;
  settings: WorkspaceSettings;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WorkspaceSettings {
  defaultAiModel: string | null;
  knowledgeBaseIds: string[];
  enabledFeatures: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionDays: number;
  notificationChannels: string[];
}

// ============================================================================
// Department & Business Unit — Organizational hierarchy
// ============================================================================

export interface Department {
  id: string;
  organizationId: string;
  tenantId: string;
  name: string;
  code: string;
  parentId: string | null;
  headUserId: string | null;
  costCenterId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnit {
  id: string;
  organizationId: string;
  tenantId: string;
  name: string;
  code: string;
  parentId: string | null;
  region: RegionCode | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Region — Data residency configuration
// ============================================================================

export interface Region {
  code: RegionCode;
  name: string;
  provider: string;             // 'aws' | 'azure' | 'gcp' | 'on-premises'
  available: boolean;
  complianceFrameworks: string[]; // ['GDPR', 'SOC2', 'HIPAA', etc.]
  endpoints: RegionEndpoints;
}

export interface RegionEndpoints {
  api: string;
  storage: string;
  ai: string;
  websocket: string;
}

// ============================================================================
// Tenant Lifecycle Events
// ============================================================================

export type TenantLifecycleAction =
  | 'provision'
  | 'activate'
  | 'suspend'
  | 'resume'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'migrate'
  | 'clone'
  | 'backup'
  | 'scale-up'
  | 'scale-down';

export interface TenantLifecycleEvent {
  id: string;
  tenantId: string;
  organizationId: string;
  action: TenantLifecycleAction;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  initiatedBy: string;
  details: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

// ============================================================================
// Tenant Context — Request-scoped multi-tenant identity
// ============================================================================

export interface TenantContextData {
  organizationId: string;
  tenantId: string;
  workspaceId: string | null;
  userId: string;
  roles: string[];
  tier: TenantTier;
  region: RegionCode;
  isolationLevel: IsolationLevel;
  permissions: string[];
  featureFlags: Record<string, boolean>;
  quotas: ResourceQuotas;
}

// ============================================================================
// Tenant Discovery
// ============================================================================

export interface TenantDiscoveryResult {
  tenantId: string;
  organizationId: string;
  resolvedBy: 'subdomain' | 'custom-domain' | 'header' | 'jwt' | 'api-key' | 'path';
  region: RegionCode;
  tier: TenantTier;
  status: TenantStatus;
}

// ============================================================================
// Tenant Migration
// ============================================================================

export interface TenantMigrationPlan {
  id: string;
  sourceTenantId: string;
  targetTenantId: string;
  sourceRegion: RegionCode;
  targetRegion: RegionCode;
  strategy: 'live' | 'offline' | 'blue-green';
  includeData: boolean;
  includeConfigurations: boolean;
  includeUsers: boolean;
  scheduledAt: string | null;
  status: 'planned' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  progress: number;              // 0-100
  checkpoints: MigrationCheckpoint[];
  createdAt: string;
  completedAt: string | null;
}

export interface MigrationCheckpoint {
  name: string;
  status: 'pending' | 'completed' | 'failed';
  dataSize: number;
  recordCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

// ============================================================================
// Tenant Backup
// ============================================================================

export interface TenantBackup {
  id: string;
  tenantId: string;
  organizationId: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'expired';
  sizeBytes: number;
  storageLocation: string;
  region: RegionCode;
  encryptionKeyId: string | null;
  retentionDays: number;
  expiresAt: string;
  createdAt: string;
  completedAt: string | null;
  restoredAt: string | null;
}

// ============================================================================
// Cross-Tenant Protection
// ============================================================================

export interface CrossTenantAccessRule {
  id: string;
  sourceTenantId: string;
  targetTenantId: string;
  resourceType: string;
  resourceId: string;
  permission: 'read' | 'write' | 'execute';
  grantedBy: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface TenantIsolationViolation {
  id: string;
  tenantId: string;
  violationType: 'data-leak' | 'unauthorized-access' | 'quota-exceeded' | 'policy-breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  resourceType: string;
  resourceId: string;
  detectedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}
