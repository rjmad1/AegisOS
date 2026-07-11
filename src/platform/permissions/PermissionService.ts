// ============================================================================
// Permission Service — Role-based permission checking (architecture only)
// ============================================================================
// No authentication implementation. Default role = administrator
// (single-user local workstation). Future: agent permissions, API tokens.
// ============================================================================

import type { Permission, PermissionRole, PermissionCheckResult, PermissionAction } from './types';
import { ROLE_HIERARCHY } from './types';

class PermissionServiceImpl {
  private currentRole: PermissionRole = 'administrator';
  private permissions: Permission[] = [];

  // ---- Role Management ----

  setCurrentRole(role: PermissionRole): void {
    this.currentRole = role;
  }

  getCurrentRole(): PermissionRole {
    return this.currentRole;
  }

  // ---- Permission Registration ----

  registerPermissions(perms: Permission[]): void {
    this.permissions.push(...perms);
  }

  // ---- Permission Checking ----

  can(action: PermissionAction, resource: string): PermissionCheckResult {
    // Find the most specific permission matching this resource + action
    const matching = this.permissions.find(
      (p) => p.resource === resource && p.action === action,
    );

    if (!matching) {
      // No explicit permission defined — default allow for administrator
      return this.currentRole === 'administrator'
        ? { allowed: true }
        : { allowed: false, reason: `No permission defined for ${action} on ${resource}` };
    }

    const currentLevel = ROLE_HIERARCHY[this.currentRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[matching.minimumRole] ?? 99;

    if (currentLevel >= requiredLevel) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Role "${this.currentRole}" insufficient. Requires "${matching.minimumRole}" for ${action} on ${resource}`,
    };
  }

  /** Check if the current role meets or exceeds a minimum role */
  hasRole(minimumRole: PermissionRole): boolean {
    return (ROLE_HIERARCHY[this.currentRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 99);
  }

  /** Guard utility — throws if permission check fails */
  guard(action: PermissionAction, resource: string): void {
    const result = this.can(action, resource);
    if (!result.allowed) {
      throw new Error(`[Permission] Access denied: ${result.reason}`);
    }
  }
}

export const PermissionService = new PermissionServiceImpl();
