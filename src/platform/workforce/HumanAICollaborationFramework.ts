export interface CollaborationContract {
  id: string;
  type: 'HITL' | 'HOTL' | 'AI-Assisted' | 'AI-Led' | 'Consensus';
  humanApprovers: string[];
  aiActors: string[];
  autoExecute: boolean;
}

export class HumanAICollaborationFramework {
  private static instance: HumanAICollaborationFramework | null = null;
  private contracts: Map<string, CollaborationContract> = new Map();

  private constructor() {}

  public static getInstance(): HumanAICollaborationFramework {
    if (!HumanAICollaborationFramework.instance) {
      HumanAICollaborationFramework.instance = new HumanAICollaborationFramework();
    }
    return HumanAICollaborationFramework.instance;
  }

  public registerContract(contract: CollaborationContract): void {
    this.contracts.set(contract.id, contract);
  }

  public getContract(id: string): CollaborationContract | undefined {
    return this.contracts.get(id);
  }
}

export const humanAICollaborationFramework = HumanAICollaborationFramework.getInstance();
