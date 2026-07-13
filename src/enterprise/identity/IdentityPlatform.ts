// src/enterprise/identity/IdentityPlatform.ts
// Enterprise Identity Management — Users, Service Accounts, API Clients, Federation

import type {
  EnterpriseUser, EnterpriseRole, ServiceAccount, ApiClient,
  OrganizationInvitation, OrganizationMembership, TenantMembership,
  WorkspaceMembership, FederationTrust, Team, InvitationStatus,
} from './types';
import { RoleHierarchyService } from './RoleHierarchy';

// ============================================================================
// Enterprise Identity Platform
// ============================================================================

export class IdentityPlatform {
  private static instance: IdentityPlatform | null = null;

  private users: Map<string, EnterpriseUser> = new Map();
  private serviceAccounts: Map<string, ServiceAccount> = new Map();
  private apiClients: Map<string, ApiClient> = new Map();
  private invitations: Map<string, OrganizationInvitation> = new Map();
  private federationTrusts: Map<string, FederationTrust> = new Map();
  private teams: Map<string, Team> = new Map();

  private constructor() {}

  public static getInstance(): IdentityPlatform {
    if (!IdentityPlatform.instance) {
      IdentityPlatform.instance = new IdentityPlatform();
    }
    return IdentityPlatform.instance;
  }

  // ======== User Management ========

  public createUser(params: {
    email: string;
    displayName: string;
    identityProvider: string;
    externalId?: string;
    organizationId: string;
    organizationName: string;
    role: EnterpriseRole;
  }): EnterpriseUser {
    // Check for existing user by email
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      // Add organization membership to existing user
      return this.addOrganizationMembership(existing.id, {
        organizationId: params.organizationId,
        organizationName: params.organizationName,
        role: params.role,
      });
    }

    const user: EnterpriseUser = {
      id: `usr-${crypto.randomUUID()}`,
      email: params.email,
      displayName: params.displayName,
      avatarUrl: null,
      identityType: 'user',
      identityProvider: params.identityProvider,
      externalId: params.externalId ?? null,
      status: 'active',
      mfaEnabled: false,
      lastLoginAt: null,
      memberships: [{
        organizationId: params.organizationId,
        organizationName: params.organizationName,
        role: params.role,
        status: 'active',
        tenantMemberships: [],
        joinedAt: new Date().toISOString(),
      }],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    console.log(`[IdentityPlatform] Created user: ${user.email} (${user.id})`);
    return user;
  }

  public getUser(id: string): EnterpriseUser | null {
    return this.users.get(id) ?? null;
  }

  public getUserByEmail(email: string): EnterpriseUser | null {
    for (const user of this.users.values()) {
      if (user.email === email && user.status !== 'deactivated') return user;
    }
    return null;
  }

  public listUsersByOrganization(organizationId: string): EnterpriseUser[] {
    return Array.from(this.users.values()).filter(u =>
      u.status !== 'deactivated' &&
      u.memberships.some(m => m.organizationId === organizationId && m.status === 'active')
    );
  }

  public listUsersByTenant(tenantId: string): EnterpriseUser[] {
    return Array.from(this.users.values()).filter(u =>
      u.status !== 'deactivated' &&
      u.memberships.some(m =>
        m.status === 'active' &&
        m.tenantMemberships.some(tm => tm.tenantId === tenantId && tm.status === 'active')
      )
    );
  }

  public addOrganizationMembership(userId: string, membership: {
    organizationId: string;
    organizationName: string;
    role: EnterpriseRole;
  }): EnterpriseUser {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found.`);

    const existing = user.memberships.find(m => m.organizationId === membership.organizationId);
    if (existing) {
      existing.role = membership.role;
      existing.status = 'active';
    } else {
      user.memberships.push({
        organizationId: membership.organizationId,
        organizationName: membership.organizationName,
        role: membership.role,
        status: 'active',
        tenantMemberships: [],
        joinedAt: new Date().toISOString(),
      });
    }

    user.updatedAt = new Date().toISOString();
    return user;
  }

  public addTenantMembership(userId: string, organizationId: string, membership: {
    tenantId: string;
    tenantName: string;
    role: EnterpriseRole;
  }): EnterpriseUser {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found.`);

    const orgMembership = user.memberships.find(m => m.organizationId === organizationId);
    if (!orgMembership) throw new Error(`User ${userId} is not a member of organization ${organizationId}.`);

    const existing = orgMembership.tenantMemberships.find(tm => tm.tenantId === membership.tenantId);
    if (existing) {
      existing.role = membership.role;
      existing.status = 'active';
    } else {
      orgMembership.tenantMemberships.push({
        tenantId: membership.tenantId,
        tenantName: membership.tenantName,
        role: membership.role,
        workspaceMemberships: [],
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
    }

    user.updatedAt = new Date().toISOString();
    return user;
  }

  public addWorkspaceMembership(userId: string, organizationId: string, tenantId: string, membership: {
    workspaceId: string;
    workspaceName: string;
    role: EnterpriseRole;
    teamIds?: string[];
  }): EnterpriseUser {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found.`);

    const orgMembership = user.memberships.find(m => m.organizationId === organizationId);
    if (!orgMembership) throw new Error(`User is not a member of organization ${organizationId}.`);

    const tenantMembership = orgMembership.tenantMemberships.find(tm => tm.tenantId === tenantId);
    if (!tenantMembership) throw new Error(`User is not a member of tenant ${tenantId}.`);

    const existing = tenantMembership.workspaceMemberships.find(wm => wm.workspaceId === membership.workspaceId);
    if (existing) {
      existing.role = membership.role;
      existing.status = 'active';
    } else {
      tenantMembership.workspaceMemberships.push({
        workspaceId: membership.workspaceId,
        workspaceName: membership.workspaceName,
        role: membership.role,
        teamIds: membership.teamIds ?? [],
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
    }

    user.updatedAt = new Date().toISOString();
    return user;
  }

  public suspendUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found.`);
    user.status = 'suspended';
    user.updatedAt = new Date().toISOString();
    console.log(`[IdentityPlatform] Suspended user: ${user.email}`);
  }

  public deactivateUser(userId: string): void {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User ${userId} not found.`);
    user.status = 'deactivated';
    user.memberships.forEach(m => { m.status = 'removed'; });
    user.updatedAt = new Date().toISOString();
    console.log(`[IdentityPlatform] Deactivated user: ${user.email}`);
  }

  /**
   * Get the effective role for a user within a specific scope.
   */
  public getUserRole(userId: string, organizationId: string, tenantId?: string, workspaceId?: string): EnterpriseRole {
    const user = this.users.get(userId);
    if (!user) return 'guest';

    const orgMembership = user.memberships.find(m => m.organizationId === organizationId && m.status === 'active');
    if (!orgMembership) return 'guest';

    if (!tenantId) return orgMembership.role;

    const tenantMembership = orgMembership.tenantMemberships.find(tm => tm.tenantId === tenantId && tm.status === 'active');
    if (!tenantMembership) return orgMembership.role; // Fall back to org role

    if (!workspaceId) return RoleHierarchyService.getHighestRole([orgMembership.role, tenantMembership.role]);

    const wsMembership = tenantMembership.workspaceMemberships.find(wm => wm.workspaceId === workspaceId && wm.status === 'active');
    if (!wsMembership) return RoleHierarchyService.getHighestRole([orgMembership.role, tenantMembership.role]);

    return RoleHierarchyService.getHighestRole([orgMembership.role, tenantMembership.role, wsMembership.role]);
  }

  // ======== Service Account Management ========

  public createServiceAccount(params: {
    name: string;
    description: string;
    organizationId: string;
    tenantId: string;
    role: EnterpriseRole;
    scopes: string[];
    createdBy: string;
    expiresAt?: string;
  }): ServiceAccount & { apiKey: string } {
    const apiKey = `sk-${crypto.randomUUID().replace(/-/g, '')}`;
    const sa: ServiceAccount = {
      id: `sa-${crypto.randomUUID()}`,
      name: params.name,
      description: params.description,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      role: params.role,
      apiKeyHash: this.hashKey(apiKey),
      scopes: params.scopes,
      ipAllowlist: [],
      rateLimitPerMinute: 600,
      lastUsedAt: null,
      expiresAt: params.expiresAt ?? null,
      status: 'active',
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.serviceAccounts.set(sa.id, sa);
    console.log(`[IdentityPlatform] Created service account: ${sa.name} (${sa.id})`);
    return { ...sa, apiKey }; // Return raw key only on creation
  }

  public getServiceAccount(id: string): ServiceAccount | null {
    return this.serviceAccounts.get(id) ?? null;
  }

  public listServiceAccounts(tenantId: string): ServiceAccount[] {
    return Array.from(this.serviceAccounts.values()).filter(
      sa => sa.tenantId === tenantId && sa.status !== 'revoked'
    );
  }

  public revokeServiceAccount(id: string): void {
    const sa = this.serviceAccounts.get(id);
    if (!sa) throw new Error(`Service account ${id} not found.`);
    sa.status = 'revoked';
    sa.updatedAt = new Date().toISOString();
    console.log(`[IdentityPlatform] Revoked service account: ${sa.name}`);
  }

  // ======== API Client Management ========

  public createApiClient(params: {
    name: string;
    description: string;
    organizationId: string;
    tenantId: string;
    grantTypes: ('client_credentials' | 'authorization_code' | 'refresh_token')[];
    redirectUris: string[];
    scopes: string[];
    createdBy: string;
  }): ApiClient & { clientSecret: string } {
    const clientId = `oc_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const clientSecret = `ocs_${crypto.randomUUID().replace(/-/g, '')}`;

    const client: ApiClient = {
      id: `ac-${crypto.randomUUID()}`,
      name: params.name,
      description: params.description,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      clientId,
      clientSecretHash: this.hashKey(clientSecret),
      grantTypes: params.grantTypes,
      redirectUris: params.redirectUris,
      scopes: params.scopes,
      rateLimitPerMinute: 300,
      status: 'active',
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.apiClients.set(client.id, client);
    console.log(`[IdentityPlatform] Created API client: ${client.name} (${client.clientId})`);
    return { ...client, clientSecret };
  }

  public listApiClients(tenantId: string): ApiClient[] {
    return Array.from(this.apiClients.values()).filter(
      c => c.tenantId === tenantId && c.status !== 'revoked'
    );
  }

  // ======== Organization Invitations ========

  public createInvitation(params: {
    organizationId: string;
    email: string;
    role: EnterpriseRole;
    tenantIds: string[];
    workspaceIds: string[];
    invitedBy: string;
  }): OrganizationInvitation {
    const invitation: OrganizationInvitation = {
      id: `inv-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      email: params.email,
      role: params.role,
      tenantIds: params.tenantIds,
      workspaceIds: params.workspaceIds,
      invitedBy: params.invitedBy,
      status: 'pending',
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      acceptedAt: null,
      createdAt: new Date().toISOString(),
    };

    this.invitations.set(invitation.id, invitation);
    console.log(`[IdentityPlatform] Created invitation for ${params.email} to org ${params.organizationId}`);
    return invitation;
  }

  public acceptInvitation(invitationId: string, userId: string): OrganizationInvitation {
    const invitation = this.invitations.get(invitationId);
    if (!invitation) throw new Error(`Invitation ${invitationId} not found.`);
    if (invitation.status !== 'pending') throw new Error(`Invitation is no longer pending.`);
    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      throw new Error(`Invitation has expired.`);
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date().toISOString();
    console.log(`[IdentityPlatform] Invitation ${invitationId} accepted by user ${userId}`);
    return invitation;
  }

  public listInvitations(organizationId: string, status?: InvitationStatus): OrganizationInvitation[] {
    return Array.from(this.invitations.values()).filter(i =>
      i.organizationId === organizationId && (!status || i.status === status)
    );
  }

  // ======== Federation ========

  public createFederationTrust(params: {
    sourceOrganizationId: string;
    targetOrganizationId: string;
    protocol: 'saml' | 'oidc' | 'scim';
    sharedResources: string[];
    permissionMapping: Record<string, string>;
    expiresAt?: string;
  }): FederationTrust {
    const trust: FederationTrust = {
      id: `fed-${crypto.randomUUID()}`,
      sourceOrganizationId: params.sourceOrganizationId,
      targetOrganizationId: params.targetOrganizationId,
      protocol: params.protocol,
      status: 'active',
      sharedResources: params.sharedResources,
      permissionMapping: params.permissionMapping,
      createdAt: new Date().toISOString(),
      expiresAt: params.expiresAt ?? null,
    };

    this.federationTrusts.set(trust.id, trust);
    console.log(`[IdentityPlatform] Created federation trust: ${trust.sourceOrganizationId} -> ${trust.targetOrganizationId}`);
    return trust;
  }

  public listFederationTrusts(organizationId: string): FederationTrust[] {
    return Array.from(this.federationTrusts.values()).filter(
      t => (t.sourceOrganizationId === organizationId || t.targetOrganizationId === organizationId) && t.status === 'active'
    );
  }

  // ======== Team Management ========

  public createTeam(params: {
    tenantId: string;
    workspaceId: string;
    name: string;
    description: string;
    leadUserId?: string;
    memberIds?: string[];
  }): Team {
    const team: Team = {
      id: `team-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description,
      leadUserId: params.leadUserId ?? null,
      memberIds: params.memberIds ?? [],
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.teams.set(team.id, team);
    console.log(`[IdentityPlatform] Created team: ${team.name} (${team.id})`);
    return team;
  }

  public listTeams(workspaceId: string): Team[] {
    return Array.from(this.teams.values()).filter(t => t.workspaceId === workspaceId);
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.status === 'active').length,
      serviceAccounts: Array.from(this.serviceAccounts.values()).filter(sa => sa.status === 'active').length,
      apiClients: Array.from(this.apiClients.values()).filter(c => c.status === 'active').length,
      pendingInvitations: Array.from(this.invitations.values()).filter(i => i.status === 'pending').length,
      federationTrusts: Array.from(this.federationTrusts.values()).filter(t => t.status === 'active').length,
      teams: this.teams.size,
    };
  }

  // ======== Internal Helpers ========

  private hashKey(key: string): string {
    // Simple hash for in-memory storage; production should use bcrypt/argon2
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const chr = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }
}

export const identityPlatform = IdentityPlatform.getInstance();
export default identityPlatform;
