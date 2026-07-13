export enum Role {
  Administrator = 'Administrator',
  Operator = 'Operator',
  Viewer = 'Viewer',
  Auditor = 'Auditor'
}

export enum Permission {
  ViewArtifacts = 'View Artifacts',
  DownloadArtifacts = 'Download Artifacts',
  ViewRuntime = 'View Runtime',
  ViewInfrastructure = 'View Infrastructure',
  ViewKnowledge = 'View Knowledge',
  ViewModels = 'View Models',
  ViewConversations = 'View Conversations',
  ViewLogs = 'View Logs',
  ViewSettings = 'View Settings',
  ViewHealth = 'View Health',
  ViewProviders = 'View Providers',
  Administration = 'Administration'
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.Administrator]: Object.values(Permission),
  [Role.Operator]: [
    Permission.ViewArtifacts, Permission.DownloadArtifacts, Permission.ViewRuntime,
    Permission.ViewInfrastructure, Permission.ViewKnowledge, Permission.ViewModels,
    Permission.ViewConversations, Permission.ViewLogs, Permission.ViewSettings,
    Permission.ViewHealth, Permission.ViewProviders
  ],
  [Role.Viewer]: [
    Permission.ViewArtifacts, Permission.ViewRuntime, Permission.ViewInfrastructure,
    Permission.ViewKnowledge, Permission.ViewModels, Permission.ViewConversations,
    Permission.ViewLogs, Permission.ViewSettings, Permission.ViewHealth, Permission.ViewProviders
  ],
  [Role.Auditor]: [
    Permission.ViewLogs, Permission.ViewSettings, Permission.ViewHealth, Permission.ViewProviders
  ]
};

export interface AuthorizedUser {
  id: string;
  googleSubjectId: string;
  email: string;
  displayName: string;
  role: Role;
  status: 'Enabled' | 'Disabled';
  createdDate: string;
  lastLogin: string | null;
  createdBy: string;
  permissions: Permission[];
  allowedNetworks: string[];
  notes: string;
}

export function hasPermission(user: AuthorizedUser, permission: Permission): boolean {
  if (user.status !== 'Enabled') return false;
  return user.permissions.includes(permission) || RolePermissions[user.role]?.includes(permission);
}
