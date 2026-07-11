// ============================================================================
// Permission Framework — Types (Architecture only)
// ============================================================================

export type PermissionRole =
  | 'anonymous'
  | 'authenticated'
  | 'developer'
  | 'operator'
  | 'administrator';

export const ROLE_HIERARCHY: Record<PermissionRole, number> = {
  anonymous: 0,
  authenticated: 1,
  developer: 2,
  operator: 3,
  administrator: 4,
};

export type PermissionAction = 'read' | 'write' | 'delete' | 'execute' | 'admin' | string;

export interface Permission {
  resource: string;
  action: PermissionAction;
  minimumRole: PermissionRole;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}
