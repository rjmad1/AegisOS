// src/platform/control-plane/PlatformRBAC.ts
import { UserContext, PlatformPermission, UserRole } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';

export class PlatformRBAC {
  private static instance: PlatformRBAC | null = null;
  private activeContext: UserContext = { id: 'default-user', role: 'Administrator' }; // Default context

  // Role to permissions mapping matrix
  private static readonly rolePermissions: Record<UserRole, PlatformPermission[]> = {
    Administrator: [
      'platform:start',
      'platform:stop',
      'platform:restart',
      'platform:maintenance',
      'service:control',
      'service:logs',
      'config:modify',
      'security:audit',
      'backup:create',
      'backup:restore',
      'workflow:trigger',
      'obs:read',
      'node:modify'
    ],
    Operator: [
      'platform:start',
      'platform:stop',
      'platform:restart',
      'platform:maintenance',
      'service:control',
      'service:logs',
      'backup:create',
      'backup:restore',
      'workflow:trigger',
      'obs:read'
    ],
    Developer: [
      'service:control',
      'service:logs',
      'config:modify',
      'obs:read'
    ],
    Auditor: [
      'security:audit',
      'obs:read'
    ],
    Observer: [
      'obs:read'
    ],
    Automation: [
      'service:control',
      'backup:create',
      'workflow:trigger',
      'obs:read'
    ],
    'API Client': [
      'workflow:trigger',
      'obs:read'
    ]
  };

  private constructor() {}

  public static getInstance(): PlatformRBAC {
    if (!PlatformRBAC.instance) {
      PlatformRBAC.instance = new PlatformRBAC();
    }
    return PlatformRBAC.instance;
  }

  public getActiveContext(): UserContext {
    return { ...this.activeContext };
  }

  public setActiveRole(role: UserRole): void {
    this.activeContext.role = role;
    console.log(`[RBAC] Security context set to role: ${role}`);
  }

  /**
   * Evaluates permissions on a requested action for a user context.
   */
  public verify(user: UserContext, action: PlatformPermission): boolean {
    const list = PlatformRBAC.rolePermissions[user.role] || [];
    const ok = list.includes(action);

    if (!ok) {
      console.warn(`[RBAC:AccessRefused] Context "${user.id}" (Role: ${user.role}) attempted restricted operation "${action}"`);
      // Publish event
      eventPlatform.publish({
        name: 'SecurityViolationDetected',
        source: 'rbac-manager',
        priority: 'high',
        payload: {
          userId: user.id,
          role: user.role,
          attemptedAction: action,
          timestamp: Date.now()
        }
      });
    }

    return ok;
  }
}
export const platformRBAC = PlatformRBAC.getInstance();
export default platformRBAC;
