export enum Role {
  SuperAdmin = 'Super Admin',
  Admin = 'Admin',
  Manager = 'Manager',
  Developer = 'Developer',
  Tester = 'Tester',
  Support = 'Support',
  StandardUser = 'Standard User',
  ReadOnly = 'Read Only',
  
  // Compatibility aliases
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
  [Role.SuperAdmin]: Object.values(Permission),
  [Role.Admin]: Object.values(Permission),
  [Role.Manager]: [
    Permission.ViewArtifacts, Permission.DownloadArtifacts, Permission.ViewRuntime,
    Permission.ViewInfrastructure, Permission.ViewKnowledge, Permission.ViewModels,
    Permission.ViewConversations, Permission.ViewLogs, Permission.ViewSettings,
    Permission.ViewHealth, Permission.ViewProviders
  ],
  [Role.Developer]: [
    Permission.ViewArtifacts, Permission.ViewRuntime, Permission.ViewInfrastructure,
    Permission.ViewKnowledge, Permission.ViewModels, Permission.ViewConversations,
    Permission.ViewLogs, Permission.ViewHealth
  ],
  [Role.Tester]: [
    Permission.ViewRuntime, Permission.ViewInfrastructure, Permission.ViewModels,
    Permission.ViewHealth, Permission.ViewProviders
  ],
  [Role.Support]: [
    Permission.ViewHealth, Permission.ViewLogs, Permission.ViewSettings, Permission.ViewProviders
  ],
  [Role.StandardUser]: [
    Permission.ViewArtifacts, Permission.ViewConversations, Permission.ViewModels
  ],
  [Role.ReadOnly]: [
    Permission.ViewHealth, Permission.ViewRuntime
  ],

  // Mappings for compatibility
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
