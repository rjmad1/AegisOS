import { LearningRecord } from "./types";

/**
 * Learning Repository
 * 
 * Stores successful plans, failed plans, reflections, critiques,
 * strategies, and consensus outcomes.
 * 
 * Does NOT store raw conversations unless explicitly required.
 */
export interface ILearningStorage {
  saveRecord(record: LearningRecord): Promise<void>;
  getRecordsByCategory(category: LearningRecord["category"]): Promise<LearningRecord[]>;
  searchRecordsByTags(tags: string[]): Promise<LearningRecord[]>;
}

export class LearningRepository {
  constructor(private storage: ILearningStorage) {}

  public async store(record: LearningRecord): Promise<void> {
    if (!record.id || !record.category) {
      throw new Error("LearningRepository: Invalid LearningRecord format.");
    }
    
    // Privacy and bounds check: ensure this is not a raw conversation payload
    if (record.content && typeof record.content === "object") {
      if ("messages" in record.content || "chat_history" in record.content) {
        throw new Error("LearningRepository: Raw conversations are not permitted in the learning repository.");
      }
    }

    await this.storage.saveRecord(record);
  }

  public async getByCategory(category: LearningRecord["category"]): Promise<LearningRecord[]> {
    return this.storage.getRecordsByCategory(category);
  }

  public async search(tags: string[]): Promise<LearningRecord[]> {
    return this.storage.searchRecordsByTags(tags);
  }
}

/**
 * In-memory adapter for early CIL testing and boundaries.
 */
export class InMemoryLearningStorage implements ILearningStorage {
  private records: Map<string, LearningRecord> = new Map();

  public async saveRecord(record: LearningRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  public async getRecordsByCategory(category: string): Promise<LearningRecord[]> {
    return Array.from(this.records.values()).filter(r => r.category === category);
  }

  public async searchRecordsByTags(tags: string[]): Promise<LearningRecord[]> {
    return Array.from(this.records.values()).filter(r => {
      return tags.some(tag => r.tags.includes(tag));
    });
  }
}
