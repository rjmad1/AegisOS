import { randomUUID } from 'crypto';
import type { IOptimizationService, OptimizationAction } from './types';

interface Observation {
  metric: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export class OptimizationService implements IOptimizationService {
  private observations: Observation[] = [];
  private actions: OptimizationAction[] = [];
  
  // Rules that generate optimization actions based on observations
  private heuristics: Array<(observations: Observation[]) => OptimizationAction[]> = [];

  constructor() {
    this.registerDefaultHeuristics();
  }

  observe(metric: string, value: number, tags?: Record<string, string>): void {
    this.observations.push({
      metric,
      value,
      tags,
      timestamp: Date.now()
    });

    // Simple bounded retention
    if (this.observations.length > 1000) {
      this.observations.shift();
    }
  }

  getRecommendations(): OptimizationAction[] {
    // Generate new recommendations based on current observations
    const newActions = this.heuristics.flatMap(h => h(this.observations));
    
    // Combine with existing pending actions, deduplicating by some signature if needed
    // For now, just return the newly generated ones for simplicity
    return newActions;
  }

  async executeSafeOptimizations(): Promise<void> {
    const actions = this.getRecommendations();
    
    // Only execute actions with high confidence
    const safeActions = actions.filter(a => a.confidence >= 0.8);
    
    for (const action of safeActions) {
      try {
        await action.execute();
      } catch (err) {
        console.error(`[PAOS] Failed to execute optimization ${action.id}:`, err);
      }
    }
    
    // Clear observations that have been acted upon (simplified approach)
    this.clearObservations();
  }

  private clearObservations(): void {
    this.observations = [];
  }

  registerHeuristic(heuristic: (observations: Observation[]) => OptimizationAction[]): void {
    this.heuristics.push(heuristic);
  }

  private registerDefaultHeuristics(): void {
    // Example heuristic: if memory > 90%, recommend GC
    this.registerHeuristic((obs) => {
      const memObs = obs.filter(o => o.metric === 'system.memory.usage_percent');
      if (memObs.length === 0) return [];
      
      const latest = memObs[memObs.length - 1];
      if (latest.value > 90) {
        return [{
          id: randomUUID(),
          reason: `Memory usage is critically high (${latest.value}%)`,
          benefit: 'Free up unused memory to prevent OOM',
          confidence: 0.9,
          execute: () => {
            if (global.gc) {
              global.gc();
            } else {
              console.warn('[PAOS] Garbage collection triggered, but global.gc is not exposed.');
            }
          }
        }];
      }
      return [];
    });
  }
}

// Singleton export
export const optimizationService = new OptimizationService();
