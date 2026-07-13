// src/enterprise/identity/RoleHierarchy.ts
// Hierarchical role model with scope-based permission resolution

import type { EnterpriseRole } from './types';

// ============================================================================
// Role Weight Hierarchy
// ============================================================================
// Higher weight = more authority. Each role inherits permissions from lower roles.

export const ENTERPRISE_ROLE_HIERARCHY: Record<EnterpriseRole, number> = {
  'platform-admin':       100,
  'organization-owner':   90,
  'organization-admin':   80,
  'tenant-admin':         70,
  'workspace-admin':      60,
  'team-admin':           50,
  'member':               40,
  'guest':                20,
  'external':             15,
  'service-account':      30,  // Between guest and member — scoped by API permissions
  'api-client':           25,
};

// ============================================================================
// Scope Types
// ============================================================================

export type PermissionScope = 'platform' | 'organization' | 'tenant' | 'workspace' | 'team';

export interface ScopedRole {
  role: EnterpriseRole;
  scope: PermissionScope;
  scopeId: string;           // The ID of the scoped entity (org, tenant, workspace, team)
}

// ============================================================================
// Permission Definitions
// ============================================================================

export type EnterprisePermission =
  // Organization-level
  | 'org:read'              | 'org:write'             | 'org:delete'
  | 'org:manage-members'    | 'org:manage-billing'    | 'org:manage-policies'
  | 'org:manage-tenants'    | 'org:manage-sso'        | 'org:manage-branding'
  | 'org:view-audit'        | 'org:manage-marketplace'
  // Tenant-level
  | 'tenant:read'           | 'tenant:write'          | 'tenant:delete'
  | 'tenant:manage-users'   | 'tenant:manage-settings'| 'tenant:manage-features'
  | 'tenant:manage-workspaces' | 'tenant:view-usage'  | 'tenant:manage-integrations'
  // Workspace-level
  | 'workspace:read'        | 'workspace:write'       | 'workspace:delete'
  | 'workspace:manage-members' | 'workspace:manage-settings'
  // Resource-level
  | 'artifacts:read'        | 'artifacts:write'       | 'artifacts:delete'  | 'artifacts:download'
  | 'workflows:read'        | 'workflows:write'       | 'workflows:execute' | 'workflows:delete'
  | 'agents:read'           | 'agents:write'          | 'agents:execute'    | 'agents:delete'
  | 'knowledge:read'        | 'knowledge:write'       | 'knowledge:delete'
  | 'models:read'           | 'models:write'          | 'models:deploy'
  | 'plugins:read'          | 'plugins:install'       | 'plugins:publish'
  | 'ai:execute'            | 'ai:configure'          | 'ai:view-usage'
  // Admin-level
  | 'admin:platform'        | 'admin:support'         | 'admin:health'
  | 'admin:licensing'       | 'admin:billing'         | 'admin:governance';

// ============================================================================
// Role → Permission Mapping
// ============================================================================

const ROLE_PERMISSIONS: Record<EnterpriseRole, EnterprisePermission[]> = {
  'platform-admin': [
    'admin:platform', 'admin:support', 'admin:health', 'admin:licensing',
    'admin:billing', 'admin:governance',
    'org:read', 'org:write', 'org:delete', 'org:manage-members', 'org:manage-billing',
    'org:manage-policies', 'org:manage-tenants', 'org:manage-sso', 'org:manage-branding',
    'org:view-audit', 'org:manage-marketplace',
    'tenant:read', 'tenant:write', 'tenant:delete', 'tenant:manage-users',
    'tenant:manage-settings', 'tenant:manage-features', 'tenant:manage-workspaces',
    'tenant:view-usage', 'tenant:manage-integrations',
    'workspace:read', 'workspace:write', 'workspace:delete',
    'workspace:manage-members', 'workspace:manage-settings',
    'artifacts:read', 'artifacts:write', 'artifacts:delete', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute', 'workflows:delete',
    'agents:read', 'agents:write', 'agents:execute', 'agents:delete',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'models:read', 'models:write', 'models:deploy',
    'plugins:read', 'plugins:install', 'plugins:publish',
    'ai:execute', 'ai:configure', 'ai:view-usage',
  ],
  'organization-owner': [
    'org:read', 'org:write', 'org:delete', 'org:manage-members', 'org:manage-billing',
    'org:manage-policies', 'org:manage-tenants', 'org:manage-sso', 'org:manage-branding',
    'org:view-audit', 'org:manage-marketplace',
    'tenant:read', 'tenant:write', 'tenant:delete', 'tenant:manage-users',
    'tenant:manage-settings', 'tenant:manage-features', 'tenant:manage-workspaces',
    'tenant:view-usage', 'tenant:manage-integrations',
    'workspace:read', 'workspace:write', 'workspace:delete',
    'workspace:manage-members', 'workspace:manage-settings',
    'artifacts:read', 'artifacts:write', 'artifacts:delete', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute', 'workflows:delete',
    'agents:read', 'agents:write', 'agents:execute', 'agents:delete',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'models:read', 'models:write', 'models:deploy',
    'plugins:read', 'plugins:install', 'plugins:publish',
    'ai:execute', 'ai:configure', 'ai:view-usage',
  ],
  'organization-admin': [
    'org:read', 'org:write', 'org:manage-members', 'org:manage-policies',
    'org:manage-tenants', 'org:manage-sso', 'org:manage-branding', 'org:view-audit',
    'tenant:read', 'tenant:write', 'tenant:manage-users', 'tenant:manage-settings',
    'tenant:manage-features', 'tenant:manage-workspaces', 'tenant:view-usage',
    'tenant:manage-integrations',
    'workspace:read', 'workspace:write', 'workspace:manage-members', 'workspace:manage-settings',
    'artifacts:read', 'artifacts:write', 'artifacts:delete', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute', 'workflows:delete',
    'agents:read', 'agents:write', 'agents:execute',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'models:read', 'models:write',
    'plugins:read', 'plugins:install',
    'ai:execute', 'ai:configure', 'ai:view-usage',
  ],
  'tenant-admin': [
    'tenant:read', 'tenant:write', 'tenant:manage-users', 'tenant:manage-settings',
    'tenant:manage-features', 'tenant:manage-workspaces', 'tenant:view-usage',
    'workspace:read', 'workspace:write', 'workspace:delete',
    'workspace:manage-members', 'workspace:manage-settings',
    'artifacts:read', 'artifacts:write', 'artifacts:delete', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute', 'workflows:delete',
    'agents:read', 'agents:write', 'agents:execute',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'models:read', 'models:write',
    'plugins:read', 'plugins:install',
    'ai:execute', 'ai:configure', 'ai:view-usage',
  ],
  'workspace-admin': [
    'workspace:read', 'workspace:write', 'workspace:manage-members', 'workspace:manage-settings',
    'artifacts:read', 'artifacts:write', 'artifacts:delete', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute',
    'agents:read', 'agents:write', 'agents:execute',
    'knowledge:read', 'knowledge:write',
    'models:read',
    'plugins:read', 'plugins:install',
    'ai:execute', 'ai:view-usage',
  ],
  'team-admin': [
    'workspace:read',
    'artifacts:read', 'artifacts:write', 'artifacts:download',
    'workflows:read', 'workflows:write', 'workflows:execute',
    'agents:read', 'agents:write', 'agents:execute',
    'knowledge:read', 'knowledge:write',
    'models:read',
    'plugins:read',
    'ai:execute',
  ],
  'member': [
    'workspace:read',
    'artifacts:read', 'artifacts:write', 'artifacts:download',
    'workflows:read', 'workflows:execute',
    'agents:read', 'agents:execute',
    'knowledge:read',
    'models:read',
    'plugins:read',
    'ai:execute',
  ],
  'guest': [
    'workspace:read',
    'artifacts:read',
    'workflows:read',
    'knowledge:read',
  ],
  'external': [
    'workspace:read',
    'artifacts:read',
  ],
  'service-account': [
    'artifacts:read', 'artifacts:write',
    'workflows:read', 'workflows:execute',
    'agents:execute',
    'knowledge:read', 'knowledge:write',
    'ai:execute',
  ],
  'api-client': [
    'artifacts:read', 'artifacts:write',
    'workflows:read', 'workflows:execute',
    'ai:execute',
  ],
};

// ============================================================================
// Role Hierarchy Service
// ============================================================================

export class RoleHierarchyService {
  /**
   * Check if roleA has equal or higher authority than roleB.
   */
  static isRoleAtLeast(roleA: EnterpriseRole, roleB: EnterpriseRole): boolean {
    return (ENTERPRISE_ROLE_HIERARCHY[roleA] ?? 0) >= (ENTERPRISE_ROLE_HIERARCHY[roleB] ?? 0);
  }

  /**
   * Get all permissions for a given role.
   */
  static getPermissions(role: EnterpriseRole): EnterprisePermission[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  /**
   * Check if a role has a specific permission.
   */
  static hasPermission(role: EnterpriseRole, permission: EnterprisePermission): boolean {
    const perms = ROLE_PERMISSIONS[role];
    return perms?.includes(permission) ?? false;
  }

  /**
   * Resolve the effective permissions for a user given their scoped roles.
   * A user may have different roles in different scopes.
   */
  static resolveEffectivePermissions(scopedRoles: ScopedRole[]): Set<EnterprisePermission> {
    const effective = new Set<EnterprisePermission>();
    for (const sr of scopedRoles) {
      const perms = ROLE_PERMISSIONS[sr.role];
      if (perms) {
        for (const p of perms) effective.add(p);
      }
    }
    return effective;
  }

  /**
   * Get the highest role from a list of scoped roles.
   */
  static getHighestRole(roles: EnterpriseRole[]): EnterpriseRole {
    if (roles.length === 0) return 'guest';
    return roles.reduce((highest, current) =>
      (ENTERPRISE_ROLE_HIERARCHY[current] ?? 0) > (ENTERPRISE_ROLE_HIERARCHY[highest] ?? 0) ? current : highest
    );
  }

  /**
   * Validate that a user with `actorRole` can assign `targetRole`.
   * You can only assign roles lower than your own.
   */
  static canAssignRole(actorRole: EnterpriseRole, targetRole: EnterpriseRole): boolean {
    return (ENTERPRISE_ROLE_HIERARCHY[actorRole] ?? 0) > (ENTERPRISE_ROLE_HIERARCHY[targetRole] ?? 0);
  }

  /**
   * List all roles available at a given scope.
   */
  static getRolesForScope(scope: PermissionScope): EnterpriseRole[] {
    const scopeRoles: Record<PermissionScope, EnterpriseRole[]> = {
      platform: ['platform-admin'],
      organization: ['organization-owner', 'organization-admin'],
      tenant: ['tenant-admin', 'member', 'guest', 'external', 'service-account', 'api-client'],
      workspace: ['workspace-admin', 'member', 'guest'],
      team: ['team-admin', 'member'],
    };
    return scopeRoles[scope] ?? [];
  }
}

export default RoleHierarchyService;
