export interface HybridTeam {
  id: string;
  name: string;
  type: 'Team' | 'Department' | 'Program' | 'Portfolio' | 'Squad' | 'CommunityOfPractice' | 'CenterOfExcellence';
  humanParticipants: string[];
  aiParticipants: string[];
}

export class OrganizationIntelligence {
  private static instance: OrganizationIntelligence | null = null;
  private teams: Map<string, HybridTeam> = new Map();

  private constructor() {}

  public static getInstance(): OrganizationIntelligence {
    if (!OrganizationIntelligence.instance) {
      OrganizationIntelligence.instance = new OrganizationIntelligence();
    }
    return OrganizationIntelligence.instance;
  }

  public createTeam(team: HybridTeam): void {
    this.teams.set(team.id, team);
  }

  public getTeam(id: string): HybridTeam | undefined {
    return this.teams.get(id);
  }
}

export const organizationIntelligence = OrganizationIntelligence.getInstance();
