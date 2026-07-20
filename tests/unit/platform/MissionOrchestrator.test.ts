// tests/unit/platform/MissionOrchestrator.test.ts
// Unit tests for the Engineering Mission Orchestrator (EMO)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { missionOrchestrator } from '@/platform/mission/MissionOrchestrator';
import { missionRegistry } from '@/platform/mission/registry';
import prisma from '@/infrastructure/db/prisma';

describe('Engineering Mission Orchestrator (EMO) Unit Tests', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Clean up EMO mission records before tests
    await prisma.mission.deleteMany({});
    missionRegistry.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully create an Engineering Mission in REQUESTED state', async () => {
    const objective = 'Refactor litellm router interface configuration';
    const mission = await missionOrchestrator.createMission({
      objective,
      type: 'refactor',
      priority: 'HIGH'
    });

    expect(mission.id).toBeDefined();
    expect(mission.objective).toBe(objective);
    expect(mission.type).toBe('refactor');
    expect(mission.priority).toBe('HIGH');
    expect(mission.lifecycleState).toBe('REQUESTED');
    expect(mission.approvalState).toBe('PENDING');

    // Verify REQUESTED evidence was recorded
    expect(mission.evidence.REQUESTED).toBeDefined();
    expect(mission.evidence.REQUESTED.hash).toBeDefined();
    expect(mission.evidence.REQUESTED.timestamp).toBeDefined();

    // Verify it is persistent in database
    const dbRecord = await missionOrchestrator.getMission(mission.id);
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.id).toBe(mission.id);
    expect(dbRecord?.objective).toBe(objective);
  });

  it('should transition correctly through lifecycle stages and record signed evidence', async () => {
    const mission = await missionOrchestrator.createMission({
      objective: 'Modernize database schemas to Postgres compatibility',
      type: 'modernization'
    });

    // Move to DISCOVERED
    const step1 = await missionOrchestrator.executeTransition(mission.id, 'DISCOVERED', { foundAssetsCount: 12 });
    expect(step1.lifecycleState).toBe('DISCOVERED');
    expect(step1.evidence.DISCOVERED).toBeDefined();
    expect(step1.evidence.DISCOVERED.data.foundAssetsCount).toBe(12);

    // Move to ANALYZED
    const step2 = await missionOrchestrator.executeTransition(mission.id, 'ANALYZED');
    expect(step2.lifecycleState).toBe('ANALYZED');
    expect(step2.evidence.ANALYZED).toBeDefined();

    // Check retrieved database copy
    const dbRecord = await missionOrchestrator.getMission(mission.id);
    expect(dbRecord?.lifecycleState).toBe('ANALYZED');
    expect(dbRecord?.evidence.DISCOVERED).toBeDefined();
  }, 60000);

  it('should support dynamic plugin registrations for mission types, policies, and executors', async () => {
    let policyEvaluated = false;
    let executorExecuted = false;

    const mockPolicy = {
      policyId: 'mock-policy',
      evaluate: async () => {
        policyEvaluated = true;
        return { allowed: true };
      }
    };

    const mockExecutor = {
      executorId: 'mock-executor',
      execute: async () => {
        executorExecuted = true;
        return { success: true };
      }
    };

    missionRegistry.registerPlugin({
      pluginId: 'test-custom-plugin',
      missionTypes: ['custom-evolution-type'],
      policies: [mockPolicy],
      executors: [mockExecutor]
    });

    expect(missionRegistry.getCustomMissionTypes()).toContain('custom-evolution-type');
    expect(missionRegistry.getPolicies().length).toBe(1);
    expect(missionRegistry.getExecutors().length).toBe(1);

    // Trigger mocked evaluations
    const polRes = await missionRegistry.getPolicies()[0].evaluate({});
    expect(polRes.allowed).toBe(true);
    expect(policyEvaluated).toBe(true);

    const execRes = await missionRegistry.getExecutors()[0].execute({});
    expect(execRes.success).toBe(true);
    expect(executorExecuted).toBe(true);
  });
});
