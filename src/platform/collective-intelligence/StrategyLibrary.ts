import { randomUUID } from "node:crypto";
import { ReusableStrategy } from "./types";

/**
 * Strategy Library
 * 
 * Persists and retrieves reusable strategies for planning, research, 
 * document analysis, debugging, etc.
 * 
 * Strategies become reusable planning assets.
 */
export interface IStrategyStorage {
  getStrategy(id: string): Promise<ReusableStrategy | null>;
  saveStrategy(strategy: ReusableStrategy): Promise<void>;
  findStrategies(domain: string): Promise<ReusableStrategy[]>;
}

export class StrategyLibrary {
  constructor(private storage: IStrategyStorage) {}

  public async getStrategy(id: string): Promise<ReusableStrategy | null> {
    return this.storage.getStrategy(id);
  }

  public async saveStrategy(strategy: ReusableStrategy): Promise<void> {
    // Basic validation before saving
    if (!strategy.name || strategy.steps.length === 0) {
      throw new Error("StrategyLibrary: Strategy must have a name and steps.");
    }
    strategy.lastUpdated = new Date().toISOString();
    await this.storage.saveStrategy(strategy);
  }

  public async findStrategies(domain: ReusableStrategy["domain"]): Promise<ReusableStrategy[]> {
    return this.storage.findStrategies(domain);
  }
}

/**
 * In-memory adapter for early CIL testing and boundaries.
 */
export class InMemoryStrategyStorage implements IStrategyStorage {
  private strategies: Map<string, ReusableStrategy> = new Map();

  public async getStrategy(id: string): Promise<ReusableStrategy | null> {
    return this.strategies.get(id) || null;
  }

  public async saveStrategy(strategy: ReusableStrategy): Promise<void> {
    this.strategies.set(strategy.id, strategy);
  }

  public async findStrategies(domain: string): Promise<ReusableStrategy[]> {
    return Array.from(this.strategies.values()).filter(s => s.domain === domain);
  }
}
