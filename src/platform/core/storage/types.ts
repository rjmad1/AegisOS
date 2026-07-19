export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  agentId?: string;
  userId?: string;
  executionId?: string;
  correlationId?: string;
}

export enum StorageIsolationLevel {
  LEVEL_0_PLATFORM = 0,
  LEVEL_1_SHARED = 1,
  LEVEL_2_DEDICATED = 2,
  LEVEL_3_PARTITION = 3
}

export enum StoragePolicy {
  SHARED = 'SHARED',
  DEDICATED = 'DEDICATED',
  ENCRYPTED = 'ENCRYPTED',
  EPHEMERAL = 'EPHEMERAL'
}

export interface ICapabilityStorageProvider {
  initialize(): Promise<void>;
  getCapability(id: string, context: TenantContext): Promise<any>;
  saveCapability(capability: any, context: TenantContext): Promise<void>;
  listCapabilities(context: TenantContext): Promise<any[]>;
  shutdown(): Promise<void>;
}
