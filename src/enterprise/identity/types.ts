// src/enterprise/identity/types.ts
// Enterprise Identity Type Definitions

// ============================================================================
// Identity Roles — Hierarchical enterprise role model
// ============================================================================

export type EnterpriseRole =
  | 'platform-admin'        // AegisOS platform operators
  | 'organization-owner'    // Organization creator/billing owner
  | 'organization-admin'    // Organization-level administrator
  | 'tenant-admin'          // Tenant-level administrator
  | 'workspace-admin'       // Workspace-level administrator
  | 'team-admin'            // Team lead within a workspace
  | 'member'                // Standard authenticated user
  | 'guest'                 // Limited access guest user
  | 'external'              // Cross-organization federated user
  | 'service-account'       // Machine-to-machine identity
  | 'api-client';           // API key-based access

export type IdentityType = 'user' | 'service-account' | 'api-client' | 'federated';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
export type MembershipStatus = 'active' | 'suspended' | 'inactive' | 'removed';

// ============================================================================
// Enterprise User — Extended user with multi-tenant memberships
// ============================================================================

export interface EnterpriseUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  identityType: IdentityType;
  identityProvider: string;       // 'google' | 'saml' | 'oidc' | 'local' | 'api-key'
  externalId: string | null;      // IdP subject ID
  status: 'active' | 'suspended' | 'deactivated';
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  memberships: OrganizationMembership[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  role: EnterpriseRole;
  status: MembershipStatus;
  tenantMemberships: TenantMembership[];
  joinedAt: string;
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  role: EnterpriseRole;
  workspaceMemberships: WorkspaceMembership[];
  status: MembershipStatus;
  joinedAt: string;
}

export interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  role: EnterpriseRole;
  teamIds: string[];
  status: MembershipStatus;
  joinedAt: string;
}

// ============================================================================
// Service Account — Machine identity for automation
// ============================================================================

export interface ServiceAccount {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  tenantId: string;
  role: EnterpriseRole;
  apiKeyHash: string;
  scopes: string[];
  ipAllowlist: string[];
  rateLimitPerMinute: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'suspended' | 'expired' | 'revoked';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Client — Third-party integration identity
// ============================================================================

export interface ApiClient {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  tenantId: string;
  clientId: string;
  clientSecretHash: string;
  grantTypes: ('client_credentials' | 'authorization_code' | 'refresh_token')[];
  redirectUris: string[];
  scopes: string[];
  rateLimitPerMinute: number;
  status: 'active' | 'suspended' | 'revoked';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Organization Invitation
// ============================================================================

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: EnterpriseRole;
  tenantIds: string[];             // Pre-assign to specific tenants
  workspaceIds: string[];          // Pre-assign to specific workspaces
  invitedBy: string;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

// ============================================================================
// Organization Policy
// ============================================================================

export interface OrganizationPolicy {
  id: string;
  organizationId: string;
  name: string;
  type: OrganizationPolicyType;
  enabled: boolean;
  configuration: Record<string, unknown>;
  enforcementLevel: 'advisory' | 'enforced' | 'strict';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type OrganizationPolicyType =
  | 'authentication'      // Password complexity, MFA, session duration
  | 'authorization'       // Default roles, permission boundaries
  | 'network'             // IP allowlists, VPN requirements
  | 'data-classification' // Data handling requirements
  | 'ai-usage'            // Model access, prompt restrictions
  | 'compliance'          // Regulatory framework requirements
  | 'retention'           // Data retention periods
  | 'security'            // Encryption, key rotation
  | 'marketplace'         // Extension approval requirements
  | 'audit';              // Audit logging requirements

// ============================================================================
// Federation — Cross-organization trust
// ============================================================================

export interface FederationTrust {
  id: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  protocol: 'saml' | 'oidc' | 'scim';
  status: 'active' | 'suspended' | 'revoked';
  sharedResources: string[];
  permissionMapping: Record<string, string>;
  createdAt: string;
  expiresAt: string | null;
}

// ============================================================================
// Team — Workspace-level grouping
// ============================================================================

export interface Team {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  description: string;
  leadUserId: string | null;
  memberIds: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}
