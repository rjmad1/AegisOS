export interface WorkforceDashboard {
  id: string;
  title: string;
  metrics: string[];
}

export class WorkforceCockpitAdapter {
  private static instance: WorkforceCockpitAdapter | null = null;
  private dashboards: Map<string, WorkforceDashboard> = new Map();

  private constructor() {}

  public static getInstance(): WorkforceCockpitAdapter {
    if (!WorkforceCockpitAdapter.instance) {
      WorkforceCockpitAdapter.instance = new WorkforceCockpitAdapter();
    }
    return WorkforceCockpitAdapter.instance;
  }

  public registerDashboard(dashboard: WorkforceDashboard): void {
    this.dashboards.set(dashboard.id, dashboard);
  }

  public getDashboards(): WorkforceDashboard[] {
    return Array.from(this.dashboards.values());
  }
}

export const workforceCockpitAdapter = WorkforceCockpitAdapter.getInstance();
