export interface MemoryBlock {
  id: string;
  contextId: string; // e.g. missionId, teamId
  content: string;
  type: 'Working' | 'LongTerm' | 'Semantic' | 'LessonsLearned';
  version: number;
}

export class SharedCognitiveMemory {
  private static instance: SharedCognitiveMemory | null = null;
  private memories: Map<string, MemoryBlock[]> = new Map();

  private constructor() {}

  public static getInstance(): SharedCognitiveMemory {
    if (!SharedCognitiveMemory.instance) {
      SharedCognitiveMemory.instance = new SharedCognitiveMemory();
    }
    return SharedCognitiveMemory.instance;
  }

  public storeMemory(contextId: string, memory: MemoryBlock): void {
    const existing = this.memories.get(contextId) || [];
    existing.push(memory);
    this.memories.set(contextId, existing);
  }

  public retrieveMemory(contextId: string, type?: string): MemoryBlock[] {
    const blocks = this.memories.get(contextId) || [];
    if (type) {
      return blocks.filter(b => b.type === type);
    }
    return blocks;
  }
}

export const sharedCognitiveMemory = SharedCognitiveMemory.getInstance();
