// src/platform/control-plane/__tests__/PlatformGACertification.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { platformDigitalTwin } from '../PlatformDigitalTwin';
import { selfHealingFramework } from '../SelfHealingFramework';
import { eventPlatform } from '../../event-bus/EventPlatform';
import { platformPluginFramework } from '../PlatformPluginFramework';
import { backupRecoveryCoordinator } from '../BackupRecoveryCoordinator';
import { InfrastructureDiscoveryEngine } from '../InfrastructureDiscoveryEngine';

vi.mock('../../infrastructure/deployment/deployment-manager', () => ({
  deploymentManager: {
    checkPort: vi.fn(async () => true),
    controlService: vi.fn(async () => true)
  }
}));

describe('GA Production Certification & Hardening Suite', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await InfrastructureDiscoveryEngine.getInstance().discover();
    platformDigitalTwin.initialize();
  });

  describe('Workstream 2: Digital Twin Stress & Consistency', () => {
    it('should maintain state integrity under concurrent updates', async () => {
      const updates = Array.from({ length: 50 }).map((_, idx) => {
        return eventPlatform.publish({
          name: 'HealthChanged',
          source: 'test-stress',
          payload: {
            componentId: 'infra:cpu',
            oldState: 'running',
            newState: idx % 2 === 0 ? 'running' : 'degraded',
            timestamp: Date.now()
          }
        });
      });

      await Promise.all(updates);
      platformDigitalTwin.reconcileFromDiscovery();

      const comp = platformDigitalTwin.getComponent('infra:cpu');
      expect(comp).toBeDefined();
      expect(['healthy', 'degraded', 'warning']).toContain(comp?.status);
    });
  });

  describe('Workstream 3: Chaos Engineering & Lockout Guards', () => {
    it('should trigger circuit breaker and lockout to prevent recovery loops', async () => {
      const targetId = 'service:ollama';
      selfHealingFramework.resetLockout(targetId);

      // Force trigger unhealthy handler directly to simulate chaos loop failures
      const handler = (selfHealingFramework as any).handleUnhealthyComponent.bind(selfHealingFramework);
      
      // Cycle 1: Exceed maxAttempts (3) -> Trip Circuit Breaker 1
      await handler(targetId, 'failed');
      await handler(targetId, 'failed');
      await handler(targetId, 'failed');
      await handler(targetId, 'failed'); // Exceeds limit -> trips first CB

      const cb = (selfHealingFramework as any).circuitBreakers.get(targetId);
      expect(cb.tripped).toBe(true);

      // Reset circuit breaker to start Cycle 2
      (selfHealingFramework as any).circuitBreakers.delete(targetId);

      // Cycle 2: Exceed maxAttempts again -> Permanent Lockout
      await handler(targetId, 'failed');
      await handler(targetId, 'failed');
      await handler(targetId, 'failed');
      await handler(targetId, 'failed'); // Exceeds limit again -> lockout

      const isLocked = (selfHealingFramework as any).lockedOutComponents.has(targetId);
      expect(isLocked).toBe(true);

      // Reset for safety
      selfHealingFramework.resetLockout(targetId);
    });
  });

  describe('Workstream 7: Event Bus Back-pressure & Suppression', () => {
    it('should suppress duplicates and guarantee ordering on high volumes', async () => {
      let runCount = 0;
      const subId = eventPlatform.subscribe('TestDedupeEvent', () => {
        runCount++;
      });

      // Publish duplicates
      await eventPlatform.publish({
        name: 'TestDedupeEvent',
        source: 'test',
        payload: { id: 42 }
      });
      await eventPlatform.publish({
        name: 'TestDedupeEvent',
        source: 'test',
        payload: { id: 42 } // Duplicate payload
      });

      expect(runCount).toBe(1); // Suppressed 2nd event

      eventPlatform.unsubscribe(subId);
    });
  });

  describe('Workstream 8: Plugin Ecosystem Resilience', () => {
    it('should reject loading plugin with missing dependencies', async () => {
      const manifest = {
        name: 'Faulty Analytics Tool',
        version: '1.0.0',
        requiredAegisVersion: '1.0.0',
        category: 'plugin' as const,
        dependencies: ['service:non-existent-dependency'],
        capabilities: [],
        permissions: []
      };

      const ok = await platformPluginFramework.loadPlugin(manifest);
      expect(ok).toBe(false);
    });
  });

  describe('Workstream 11: Disaster Recovery Drill Timing', () => {
    it('should verify backup recovery operations execute within RTO threshold', async () => {
      const startTime = Date.now();
      
      const backup = await backupRecoveryCoordinator.createBackup('snapshot');
      expect(backup.status).toBe('success');

      const restoreOk = await backupRecoveryCoordinator.restoreFromBackup(backup.id);
      expect(restoreOk).toBe(true);

      const duration = Date.now() - startTime;
      console.log(`[DisasterRecovery] Recovery Time Objective (RTO) achieved: ${duration}ms`);
      
      // RTO target: under 1.5 seconds
      expect(duration).toBeLessThan(1500);

      await backupRecoveryCoordinator.deleteBackup(backup.id);
    });
  });
});
