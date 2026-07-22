import { domainGovernanceLineage } from './DomainGovernanceLineage';

export interface DomainReport {
  id: string;
  title: string;
  type: string;
  data: any;
}

export class ExecutiveCockpitAdapter {
  private static instance: ExecutiveCockpitAdapter | null = null;
  private reports: Map<string, DomainReport[]> = new Map();

  private constructor() {}

  public static getInstance(): ExecutiveCockpitAdapter {
    if (!ExecutiveCockpitAdapter.instance) {
      ExecutiveCockpitAdapter.instance = new ExecutiveCockpitAdapter();
    }
    return ExecutiveCockpitAdapter.instance;
  }

  public registerDomainReport(domain: string, report: DomainReport): void {
    const existing = this.reports.get(domain) || [];
    existing.push(report);
    this.reports.set(domain, existing);

    domainGovernanceLineage.recordAction(domain, 'ReportRegistered', {
      reportId: report.id
    });
  }

  public getDomainReports(domain: string): DomainReport[] {
    return this.reports.get(domain) || [];
  }
}

export const executiveCockpitAdapter = ExecutiveCockpitAdapter.getInstance();
