import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chaosOrchestrator } from '../../../src/platform/validation/chaos/orchestrator';
import { enduranceOrchestrator } from '../../../src/platform/validation/endurance/orchestrator';
import { scalabilityOrchestrator } from '../../../src/platform/validation/scalability/orchestrator';
import { faultProviderRegistry } from '../../../src/platform/validation/chaos/provider-registry';
import { ChaosPlatform } from '../../../src/infrastructure/reliability/ChaosPlatform';
import { selfHealingFramework } from '../../../src/infrastructure/reliability/SelfHealingFramework';

describe('AegisOS Platform Validation Engines', () => {
  beforeEach(() => {
    // Mock healing cycle to avoid real service restarts/timeouts
    vi.spyOn(selfHealingFramework, 'executeHealingCycle').mockResolvedValue({
      timestamp: new Date().toISOString(),
      issuesDetected: [],
      remediations: [{ component: 'ollama', status: 'verified', action: 'restart' }]
    } as any);

    // Initialize ChaosPlatform to register specs
    ChaosPlatform.getInstance();

    // Register mock providers for testing to avoid actual docker/service calls
    faultProviderRegistry.register({
      providerId: 'service-fault-provider',
      supportedCategories: [],
      inject: async () => true,
      recover: async () => true
    } as any);
    faultProviderRegistry.register({
      providerId: 'latency-fault-provider',
      supportedCategories: [],
      inject: async () => true,
      recover: async () => true
    } as any);
  });

  describe('Chaos Experiment Engine', () => {
    it('should retrieve registered profiles', () => {
      const profiles = chaosOrchestrator.getAvailableProfiles();
      expect(profiles).toContain('kill-ollama');
      expect(profiles).toContain('inject-db-latency');
    });

    it('should successfully execute a core chaos experiment', async () => {
      const result = await chaosOrchestrator.execute('kill-ollama');
      expect(result.domain).toBe('chaos');
      expect(result.status).toBe('PASS');
      expect(result.score).toBe(100);
      expect(result.evidence.contentHash).toBeDefined();
    });
  });

  describe('Endurance Validation Engine', () => {
    it('should retrieve registered profiles', () => {
      const profiles = enduranceOrchestrator.getAvailableProfiles();
      expect(profiles).toContain('quick');
      expect(profiles).toContain('daily');
    });

    it('should execute Quick endurance validation soak', async () => {
      // Set test environment variable so duration is scaled down to 2s
      Object.assign(process.env, { NODE_ENV: 'test' });
      const result = await enduranceOrchestrator.execute('quick');
      expect(result.domain).toBe('endurance');
      expect(result.status).toBe('PASS');
      expect(result.score).toBe(100);
    });
  });

  describe('Scalability & Capacity Engine', () => {
    it('should retrieve registered profiles', () => {
      const profiles = scalabilityOrchestrator.getAvailableProfiles();
      expect(profiles).toContain('developer-workstation');
      expect(profiles).toContain('small-team');
    });

    it('should run scalability validation sweeps', async () => {
      const result = await scalabilityOrchestrator.execute('developer-workstation');
      expect(result.domain).toBe('scalability');
      expect(result.status).toBe('PASS');
      expect(result.score).toBe(100);
    });
  });
});
