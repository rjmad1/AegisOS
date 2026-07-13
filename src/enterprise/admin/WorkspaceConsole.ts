// src/enterprise/admin/WorkspaceConsole.ts
// Workspace-level administration console

import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { identityPlatform } from '../identity/IdentityPlatform';
import type { WorkspaceSettings } from '../tenant/types';
import type { EnterpriseUser, Team } from '../identity/types';

// ============================================================================
// Workspace Console — Project-level administration
// ============================================================================

export class WorkspaceConsole {
  private static instance: WorkspaceConsole | null = null;

  private constructor() {}

  public static getInstance(): WorkspaceConsole {
    if (!WorkspaceConsole.instance) {
      WorkspaceConsole.instance = new WorkspaceConsole();
    }
    return WorkspaceConsole.instance;
  }

  public getDashboard(workspaceId: string): Record<string, unknown> {
    const workspace = tenantLifecycle.getWorkspace(workspaceId);
    if (!workspace) throw new Error(`Workspace ${workspaceId} not found.`);

    const teams = identityPlatform.listTeams(workspaceId);

    return {
      workspace: {
        id: workspace.id, name: workspace.name, status: workspace.status,
        description: workspace.description, dataClassification: workspace.settings.dataClassification,
      },
      settings: workspace.settings,
      teams: teams.map(t => ({
        id: t.id, name: t.name, memberCount: t.memberIds.length, lead: t.leadUserId,
      })),
      features: workspace.settings.enabledFeatures,
    };
  }

  public updateSettings(workspaceId: string, updates: Partial<WorkspaceSettings>): void {
    const workspace = tenantLifecycle.getWorkspace(workspaceId);
    if (!workspace) throw new Error(`Workspace ${workspaceId} not found.`);
    Object.assign(workspace.settings, updates);
    workspace.updatedAt = new Date().toISOString();
    console.log(`[WorkspaceConsole] Updated settings for workspace ${workspaceId}`);
  }

  public createTeam(workspaceId: string, params: {
    name: string; description: string; leadUserId?: string; memberIds?: string[];
  }): Team {
    const workspace = tenantLifecycle.getWorkspace(workspaceId);
    if (!workspace) throw new Error(`Workspace ${workspaceId} not found.`);
    return identityPlatform.createTeam({ tenantId: workspace.tenantId, workspaceId, ...params });
  }

  public archiveWorkspace(workspaceId: string): void {
    const workspace = tenantLifecycle.getWorkspace(workspaceId);
    if (!workspace) throw new Error(`Workspace ${workspaceId} not found.`);
    workspace.status = 'archived';
    workspace.updatedAt = new Date().toISOString();
    console.log(`[WorkspaceConsole] Archived workspace: ${workspace.name}`);
  }
}

export const workspaceConsole = WorkspaceConsole.getInstance();
export default workspaceConsole;
