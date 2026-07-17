// src/platform/control-plane/__tests__/PlatformOperationsControlPlane.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lifecycleStateMachine } from '../LifecycleStateMachine';
import { platformDigitalTwin } from '../PlatformDigitalTwin';
import { platformConfigurationManager } from '../PlatformConfigurationManager';
import { platformWorkflowEngine } from '../PlatformWorkflowEngine';
import { platformJobScheduler } from '../PlatformJobScheduler';
import { platformRBAC } from '../PlatformRBAC';
import { multiNodeCoordinator } from '../MultiNodeCoordinator';
import { platformPluginFramework } from '../PlatformPluginFramework';
import { eventPlatform } from '../../event-bus/EventPlatform';
import { InfrastructureDiscoveryEngine } from '../InfrastructureDiscoveryEngine';

// Mock system components
vi.mock('../../infrastructure/deployment/deployment-manager', () => ({
  deploymentManager: {
    checkPort: vi.fn(async (port) => port === 11434 || port === 4000),
    controlService: vi.fn(async () => true),
    getSystemMetrics: vi.fn(() => ({
      gpu: { name: 'NVIDIA RTX 5080', totalVramBytes: 16000000000, usedVramBytes: 8000000000 }
    })),
    getContainers: vi.fn(async () => [])
  }
}));

describe('Evolved Control Plane GA validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Lifecycle Finite State Machine (FSM)', () => {
    it('should validate legal transitions and prevent illegal pathways', async () => {
      lifecycleStateMachine.registerComponentState('test-service', 'stopped');
      
      // Legal: stopped -> starting
      const ok1 = await lifecycleStateMachine.transition('test-service', 'starting');
      expect(ok1).toBe(true);
      expect(lifecycleStateMachine.getState('test-service')).toBe('starting');

      // Illegal: starting -> paused (must go through running first)
      const ok2 = await lifecycleStateMachine.transition('test-service', 'paused');
      expect(ok2).toBe(false);
      expect(lifecycleStateMachine.getState('test-service')).toBe('starting');
    });
  });

  describe('Infrastructure Digital Twin', () => {
    it('should maintain authoritative state and sync from discovery engine', async () => {
      await InfrastructureDiscoveryEngine.getInstance().discover();
      platformDigitalTwin.initialize();
      const comp = platformDigitalTwin.getComponent('infra:cpu');
      expect(comp).toBeDefined();
      expect(comp?.category).toBe('cpu');
    });
  });

  describe('Platform Configuration Manager', () => {
    it('should validate schemas, encrypt credentials, and perform drift audits', async () => {
      const config = {
        aiRoutingStrategy: 'consensus',
        autoHealEnabled: false,
        secureBoundOnly: true
      };

      const revision = await platformConfigurationManager.commitConfiguration(config, 'Update strategy.');
      expect(revision).toBeGreaterThan(1);

      // Encryption check
      const encrypted = platformConfigurationManager.encryptValue('secret-api-key');
      expect(encrypted).toContain(':');
      const decrypted = platformConfigurationManager.decryptValue(encrypted);
      expect(decrypted).toBe('secret-api-key');

      // Drift check
      const drift = platformConfigurationManager.checkConfigurationDrift({
        aiRoutingStrategy: 'cost-optimized' // Drifted
      });
      expect(drift.hasDrift).toBe(true);
      expect(drift.driftedParameters[0].parameter).toBe('aiRoutingStrategy');
    });
  });

  describe('Platform Workflow Engine', () => {
    it('should execute parallel steps, resolve dependencies, and track history', async () => {
      const step1Action = vi.fn(async () => {});
      const step2Action = vi.fn(async () => {});

      const steps = [
        { id: 's1', name: 'Task 1', action: step1Action, status: 'pending' as const },
        { id: 's2', name: 'Task 2', dependsOn: ['s1'], action: step2Action, status: 'pending' as const }
      ];

      const wfId = await platformWorkflowEngine.executeWorkflow('Test Workflow', steps);
      expect(wfId).toContain('wf-test-workflow');

      // Wait for loop execution
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(step1Action).toHaveBeenCalled();
      expect(step2Action).toHaveBeenCalled();
    });
  });

  describe('Persistent Job Scheduler', () => {
    it('should enqueue and monitor cron background tasks', async () => {
      const jobAction = vi.fn(async (log) => { log('Executing test job...'); });
      
      platformJobScheduler.registerJob({
        id: 'job-test-cron',
        name: 'Test Persistent Job',
        schedule: 'once',
        priority: 'high',
        maxRetries: 1,
        timeoutMs: 3000,
        owner: 'SystemTester'
      }, jobAction);

      const ok = await platformJobScheduler.triggerJob('job-test-cron', jobAction);
      expect(ok).toBe(true);
      
      const job = platformJobScheduler.getJob('job-test-cron');
      expect(job?.status).toBe('completed');
      expect(job?.executionLogs.length).toBeGreaterThan(0);
      
      platformJobScheduler.unregisterJob('job-test-cron');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should verify context privileges and reject unauthorized commands', () => {
      const devContext = { id: 'dev-user', role: 'Developer' as const };

      // Developer can control services
      const allowed = platformRBAC.verify(devContext, 'service:control');
      expect(allowed).toBe(true);

      // Developer cannot stop or start complete platform (Administrator/Operator only)
      const denied = platformRBAC.verify(devContext, 'platform:stop');
      expect(denied).toBe(false);
    });
  });

  describe('Multi-Node Cluster Coordinator', () => {
    it('should register workstations and update heartbeats', async () => {
      const remoteNode = {
        nodeId: 'worker-node-1',
        hostname: 'node-worker-alpha',
        ipAddress: '192.168.1.45',
        status: 'online' as const,
        role: 'worker' as const,
        cpuCores: 8,
        totalRamBytes: 32000000000
      };

      await multiNodeCoordinator.registerNode(remoteNode);
      const list = multiNodeCoordinator.getClusterNodes();
      expect(list.some(n => n.nodeId === 'worker-node-1')).toBe(true);

      const pingOk = await multiNodeCoordinator.pingNode('worker-node-1', 'degraded');
      expect(pingOk).toBe(true);
    });
  });

  describe('Plugin Extensibility Framework', () => {
    it('should verify compatibility, load plugin manifest and run hooks', async () => {
      const loadHook = vi.fn();
      const startHook = vi.fn();

      const manifest = {
        name: 'Mock Analytics Tool',
        version: '1.2.0',
        requiredAegisVersion: '*',
        category: 'plugin' as const,
        dependencies: [],
        capabilities: ['telemetry'],
        permissions: ['obs:read'],
        onLoad: loadHook,
        onStart: startHook
      };

      const ok = await platformPluginFramework.loadPlugin(manifest);
      expect(ok).toBe(true);
      expect(loadHook).toHaveBeenCalled();

      // Unload check
      const unloadOk = await platformPluginFramework.unloadPlugin('Mock Analytics Tool');
      expect(unloadOk).toBe(true);
    });
  });
});
