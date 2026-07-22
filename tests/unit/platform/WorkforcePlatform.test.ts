import { describe, it, expect } from 'vitest';
import { digitalWorkerFramework } from '../../../src/platform/workforce/DigitalWorkerFramework';
import { organizationIntelligence } from '../../../src/platform/workforce/OrganizationIntelligence';
import { collaborativeMissionOrchestrator } from '../../../src/platform/workforce/CollaborativeMissionOrchestrator';
import { autonomousPlanner } from '../../../src/platform/workforce/AutonomousPlanner';
import { humanAICollaborationFramework } from '../../../src/platform/workforce/HumanAICollaborationFramework';
import { sharedCognitiveMemory } from '../../../src/platform/workforce/SharedCognitiveMemory';
import { autonomousLearningFramework } from '../../../src/platform/workforce/AutonomousLearningFramework';
import { workforceMarketplaceAdapter } from '../../../src/platform/workforce/WorkforceMarketplaceAdapter';
import { workforceCockpitAdapter } from '../../../src/platform/workforce/WorkforceCockpitAdapter';
import { workforceQualificationSuite } from '../../../src/platform/workforce/WorkforceQualificationSuite';

describe('Autonomous Digital Workforce Platform Transformation (Phase 10)', () => {
  
  it('Program 10.1: should register a Digital Worker', () => {
    digitalWorkerFramework.registerWorker({
      id: 'worker-ai-01',
      name: 'Optimus',
      persona: 'Logistics Analyst',
      skills: ['Data Analysis', 'Supply Chain'],
      capabilities: ['Report Generation'],
      responsibilities: ['Monitor Inventory'],
      goals: ['Reduce Stockouts'],
      delegationRules: {},
      memoryPolicies: {},
      toolAccess: ['BigQuery', 'ERP'],
      runtimeConstraints: {},
      governancePolicies: {},
      qualificationRequirements: []
    });

    const worker = digitalWorkerFramework.getWorker('worker-ai-01');
    expect(worker).toBeDefined();
    expect(worker?.name).toBe('Optimus');
  });

  it('Program 10.2: should create a Hybrid Team', () => {
    organizationIntelligence.createTeam({
      id: 'team-alpha',
      name: 'Supply Chain Optimizers',
      type: 'Squad',
      humanParticipants: ['user-01', 'user-02'],
      aiParticipants: ['worker-ai-01']
    });

    const team = organizationIntelligence.getTeam('team-alpha');
    expect(team).toBeDefined();
    expect(team?.humanParticipants.length).toBe(2);
  });

  it('Program 10.3: should register a Collaborative Mission', () => {
    collaborativeMissionOrchestrator.registerMission({
      id: 'mission-supply-01',
      name: 'Holiday Inventory Prep',
      delegations: { 'task-1': 'worker-ai-01' },
      parallelTasks: [['task-2', 'task-3']],
      consensusRequired: true
    });

    const mission = collaborativeMissionOrchestrator.getMission('mission-supply-01');
    expect(mission).toBeDefined();
    expect(mission?.consensusRequired).toBe(true);
  });

  it('Program 10.4: should store and retrieve Shared Cognitive Memory', () => {
    sharedCognitiveMemory.storeMemory('mission-supply-01', {
      id: 'mem-1',
      contextId: 'mission-supply-01',
      content: 'Stockouts happen in Q4.',
      type: 'LessonsLearned',
      version: 1
    });

    const memories = sharedCognitiveMemory.retrieveMemory('mission-supply-01', 'LessonsLearned');
    expect(memories.length).toBe(1);
    expect(memories[0].content).toContain('Stockouts');
  });

  it('Program 10.5: should simulate Autonomous Plan in Twin', () => {
    const plan = autonomousPlanner.simulatePlan('goal-reduce-stockout', ['Analyze', 'Order']);
    expect(plan.simulatedInTwin).toBe(true);
    expect(plan.riskScore).toBeLessThan(1);
  });

  it('Program 10.6: should register Human-AI Collaboration Contract', () => {
    humanAICollaborationFramework.registerContract({
      id: 'contract-hitl-01',
      type: 'HITL',
      humanApprovers: ['user-01'],
      aiActors: ['worker-ai-01'],
      autoExecute: false
    });

    const contract = humanAICollaborationFramework.getContract('contract-hitl-01');
    expect(contract).toBeDefined();
    expect(contract?.autoExecute).toBe(false);
  });

  it('Program 10.7: should generate and approve learning recommendations', () => {
    const rec = autonomousLearningFramework.generateRecommendation({
      id: 'rec-1',
      sourceContext: 'mission-supply-01',
      type: 'WorkflowRefinement',
      description: 'Run analysis before Q4 starts'
    });

    expect(rec.approved).toBe(false);
    const approved = autonomousLearningFramework.approveRecommendation('rec-1');
    expect(approved).toBe(true);
  });

  it('Program 10.8: should format workforce asset for marketplace (mock)', async () => {
    const success = await workforceMarketplaceAdapter.publishWorkforceAsset({ 
      id: 'mock-worker-pack-1',
      name: 'Optimus Worker Pack',
      version: '1.0.0',
      author: 'AegisOS',
      description: 'A mock workforce asset',
      assetType: 'digital-worker' 
    }, 'sig-123');
    expect(success).toBe(true);
  });

  it('Program 10.9: should register Executive Workforce Dashboard', () => {
    workforceCockpitAdapter.registerDashboard({
      id: 'dash-workforce',
      title: 'Digital Worker Utilization',
      metrics: ['Uptime', 'Tasks Completed']
    });

    const dashboards = workforceCockpitAdapter.getDashboards();
    expect(dashboards.length).toBeGreaterThan(0);
    expect(dashboards[0].metrics).toContain('Uptime');
  });

  it('Program 10.10: should qualify Digital Worker', () => {
    const result = workforceQualificationSuite.qualifyWorker('worker-ai-01');
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
