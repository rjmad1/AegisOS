import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OptimizationService } from './OptimizationService';

describe('Platform Advisor & Optimization Service (PAOS)', () => {
  let paos: OptimizationService;

  beforeEach(() => {
    paos = new OptimizationService();
  });

  it('should observe metrics without error', () => {
    expect(() => {
      paos.observe('system.cpu.load', 45, { core: '0' });
    }).not.toThrow();
  });

  it('should generate recommendations based on heuristics', () => {
    paos.observe('system.memory.usage_percent', 95); // High memory triggers default heuristic
    
    const recs = paos.getRecommendations();
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].confidence).toBe(0.9);
    expect(recs[0].reason).toContain('Memory usage is critically high');
  });

  it('should execute safe optimizations and clear observations', async () => {
    let executed = false;

    // Register a custom high-confidence heuristic
    paos.registerHeuristic((obs) => {
      if (obs.some(o => o.metric === 'custom.trigger')) {
        return [{
          id: 'test-opt',
          reason: 'Testing execution',
          benefit: 'Proves execute works',
          confidence: 0.95, // High confidence (>= 0.8)
          execute: () => { executed = true; }
        }];
      }
      return [];
    });

    paos.observe('custom.trigger', 1);
    
    await paos.executeSafeOptimizations();
    
    expect(executed).toBe(true);

    // Observations should be cleared after execution
    const newRecs = paos.getRecommendations();
    expect(newRecs.length).toBe(0); // Because observations array is empty
  });

  it('should ignore unsafe optimizations during automatic execution', async () => {
    let executed = false;

    paos.registerHeuristic((obs) => {
      if (obs.some(o => o.metric === 'custom.trigger')) {
        return [{
          id: 'test-opt-unsafe',
          reason: 'Testing execution',
          benefit: 'Proves execute ignores low confidence',
          confidence: 0.5, // Low confidence (< 0.8)
          execute: () => { executed = true; }
        }];
      }
      return [];
    });

    paos.observe('custom.trigger', 1);
    
    await paos.executeSafeOptimizations();
    
    expect(executed).toBe(false); // Should not execute
  });
});
