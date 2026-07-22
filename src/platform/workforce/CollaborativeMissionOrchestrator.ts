export interface CollaborativeMission {
  id: string;
  name: string;
  delegations: Record<string, string>; // taskId -> workerId
  parallelTasks: string[][];
  consensusRequired: boolean;
}

export class CollaborativeMissionOrchestrator {
  private static instance: CollaborativeMissionOrchestrator | null = null;
  private missions: Map<string, CollaborativeMission> = new Map();

  private constructor() {}

  public static getInstance(): CollaborativeMissionOrchestrator {
    if (!CollaborativeMissionOrchestrator.instance) {
      CollaborativeMissionOrchestrator.instance = new CollaborativeMissionOrchestrator();
    }
    return CollaborativeMissionOrchestrator.instance;
  }

  public registerMission(mission: CollaborativeMission): void {
    this.missions.set(mission.id, mission);
  }

  public getMission(id: string): CollaborativeMission | undefined {
    return this.missions.get(id);
  }
}

export const collaborativeMissionOrchestrator = CollaborativeMissionOrchestrator.getInstance();
