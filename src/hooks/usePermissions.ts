import { PermissionService } from '@/platform/permissions/PermissionService';

export function usePermissions() {
  return {
    can: PermissionService.can.bind(PermissionService),
    getCurrentRole: PermissionService.getCurrentRole.bind(PermissionService),
    setCurrentRole: PermissionService.setCurrentRole.bind(PermissionService),
  };
}
