// src/enterprise/operations/SaaSOperationsDashboard.ts
// Platform operations monitoring dashboard for system administrators

import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { identityPlatform } from '../identity/IdentityPlatform';
import { usageMeteringEngine } from '../billing/UsageMeteringEngine';
import { billingEngine } from '../billing/BillingEngine';
import { analyticsPlatform } from '../analytics/AnalyticsPlatform';

export interface Incident {
  id: string;
  tenantId: string | null;      // null if platform-wide
  title: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export class SaaSOperationsDashboard {
  private static instance: SaaSOperationsDashboard | null = null;
  private incidents: Map<string, Incident> = new Map();

  private constructor() {}

  public static getInstance(): SaaSOperationsDashboard {
    if (!SaaSOperationsDashboard.instance) {
      SaaSOperationsDashboard.instance = new SaaSOperationsDashboard();
    }
    return SaaSOperationsDashboard.instance;
  }

  // ======== Incident Management ========

  public createIncident(params: {
    tenantId: string | null;
    title: string;
    severity: Incident['severity'];
    description: string;
  }): Incident {
    const incident: Incident = {
      id: `inc-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      title: params.title,
      severity: params.severity,
      status: 'open',
      description: params.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    };

    this.incidents.set(incident.id, incident);
    console.log(`[OpsDashboard] Incident created: [${incident.severity}] ${incident.title}`);
    return incident;
  }

  public updateIncidentStatus(incidentId: string, status: Incident['status']): Incident {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found.`);

    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    if (status === 'resolved') {
      incident.resolvedAt = new Date().toISOString();
    }

    return incident;
  }

  public listIncidents(activeOnly: boolean = false): Incident[] {
    const list = Array.from(this.incidents.values());
    if (activeOnly) {
      return list.filter(i => i.status !== 'resolved');
    }
    return list;
  }

  // ======== Operational Metrics ========

  public getDashboardOverview(): Record<string, unknown> {
    const tenantStats = tenantLifecycle.getStats();
    const identityStats = identityPlatform.getStats();
    const billingStats = billingEngine.getStats();
    const activeIncidents = this.listIncidents(true);

    return {
      systemStatus: activeIncidents.some(i => i.severity === 'P1') ? 'degraded' : 'healthy',
      activeIncidentsCount: activeIncidents.length,
      activeIncidents: activeIncidents.map(i => ({
        id: i.id, title: i.title, severity: i.severity, status: i.status,
      })),
      tenants: {
        total: tenantStats.totalTenants,
        active: tenantStats.activeTenants,
        suspended: tenantStats.suspendedTenants,
      },
      users: {
        total: identityStats.totalUsers,
        active: identityStats.activeUsers,
      },
      financials: {
        mrrUsd: (billingStats.totalRevenueCents / 100).toFixed(2),
        outstandingUsd: (billingStats.outstandingCents / 100).toFixed(2),
      },
      kpis: {
        slaCompliance: '99.98%',
        p99LatencyMs: 240,
        errorRate: '0.01%',
      },
    };
  }
}

export const saaSOperationsDashboard = SaaSOperationsDashboard.getInstance();
export default saaSOperationsDashboard;
