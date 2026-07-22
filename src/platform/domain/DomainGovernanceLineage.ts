export interface LineageRecord {
  id: string;
  domain: string;
  action: string;
  timestamp: string;
  details: any;
}

export class DomainGovernanceLineage {
  private static instance: DomainGovernanceLineage | null = null;
  private records: LineageRecord[] = [];

  private constructor() {}

  public static getInstance(): DomainGovernanceLineage {
    if (!DomainGovernanceLineage.instance) {
      DomainGovernanceLineage.instance = new DomainGovernanceLineage();
    }
    return DomainGovernanceLineage.instance;
  }

  public recordAction(domain: string, action: string, details: any): void {
    const record: LineageRecord = {
      id: Math.random().toString(36).substring(7),
      domain,
      action,
      timestamp: new Date().toISOString(),
      details
    };
    this.records.push(record);
  }

  public getRecords(domain?: string): LineageRecord[] {
    if (domain) {
      return this.records.filter(r => r.domain === domain);
    }
    return this.records;
  }
}

export const domainGovernanceLineage = DomainGovernanceLineage.getInstance();
