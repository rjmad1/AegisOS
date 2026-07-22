import { domainGovernanceLineage } from './DomainGovernanceLineage';

export interface KnowledgePack {
  id: string;
  prompts: string[];
  nodes: any[];
}

export class KnowledgePackLoader {
  private static instance: KnowledgePackLoader | null = null;
  private knowledgePacks: Map<string, KnowledgePack[]> = new Map();

  private constructor() {}

  public static getInstance(): KnowledgePackLoader {
    if (!KnowledgePackLoader.instance) {
      KnowledgePackLoader.instance = new KnowledgePackLoader();
    }
    return KnowledgePackLoader.instance;
  }

  public loadKnowledgePack(domain: string, pack: KnowledgePack): void {
    const existing = this.knowledgePacks.get(domain) || [];
    existing.push(pack);
    this.knowledgePacks.set(domain, existing);

    domainGovernanceLineage.recordAction(domain, 'KnowledgePackLoaded', {
      packId: pack.id
    });
  }

  public getKnowledgePacks(domain: string): KnowledgePack[] {
    return this.knowledgePacks.get(domain) || [];
  }
}

export const knowledgePackLoader = KnowledgePackLoader.getInstance();
