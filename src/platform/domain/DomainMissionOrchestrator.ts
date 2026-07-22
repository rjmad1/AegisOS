import { domainGovernanceLineage } from './DomainGovernanceLineage';

export interface DomainMission {
  id: string;
  name: string;
  description: string;
  template: any;
}

export class DomainMissionOrchestrator {
  private static instance: DomainMissionOrchestrator | null = null;
  private missions: Map<string, DomainMission[]> = new Map();

  private constructor() {}

  public static getInstance(): DomainMissionOrchestrator {
    if (!DomainMissionOrchestrator.instance) {
      DomainMissionOrchestrator.instance = new DomainMissionOrchestrator();
    }
    return DomainMissionOrchestrator.instance;
  }

  public registerDomainMission(domain: string, mission: DomainMission): void {
    const existing = this.missions.get(domain) || [];
    existing.push(mission);
    this.missions.set(domain, existing);

    domainGovernanceLineage.recordAction(domain, 'MissionRegistered', {
      missionId: mission.id
    });
  }

  public getDomainMissions(domain: string): DomainMission[] {
    return this.missions.get(domain) || [];
  }
}

export const domainMissionOrchestrator = DomainMissionOrchestrator.getInstance();
