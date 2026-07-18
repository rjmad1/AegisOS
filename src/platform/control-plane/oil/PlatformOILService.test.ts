// src/platform/control-plane/oil/PlatformOILService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { platformOILService } from './PlatformOILService';
import { platformDigitalTwin } from '../PlatformDigitalTwin';
import { platformWorkflowEngine } from '../PlatformWorkflowEngine';

// Mock Prisma
vi.mock('../../../infrastructure/db/prisma', () => ({
  default: {
    auditEvent: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'test-db-evt-1',
          timestamp: new Date().toISOString(),
          eventType: 'Security Sweep Passed',
          details: JSON.stringify({ source: 'test', payload: { message: 'Security sweep successfully resolved.' } })
        }
      ])
    }
  }
}));

describe('PlatformOILService reasoning capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should assess platform situation and calculate confidence score', async () => {
    const report = await platformOILService.assessSituation();
    expect(report).toBeDefined();
    expect(report.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(report.confidenceScore).toBeLessThanOrEqual(100);
    expect(report.dimensions.health.status).toBeDefined();
    expect(report.dimensions.stability.status).toBeDefined();
    expect(report.dimensions.resourcePressure.status).toBeDefined();
  });

  it('should run root cause analysis on specific problem keywords', async () => {
    const rcaSlow = await platformOILService.getRCAReport('inference slow');
    expect(rcaSlow.target).toBe('AI Inference Subsystem');
    expect(rcaSlow.mostLikelyRootCause).toMatch(/VRAM|threads/);
    expect(rcaSlow.recommendedActions.length).toBeGreaterThan(0);

    const rcaWorkflow = await platformOILService.getRCAReport('workflow failed');
    expect(rcaWorkflow.target).toBe('Platform Workflow Engine');
    expect(rcaWorkflow.mostLikelyRootCause).toContain('ChromaDB');
  });

  it('should calculate resource predictions and estimated timelines', async () => {
    const predictions = await platformOILService.getPredictions();
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].estimatedTimeline).toBeDefined();
    expect(predictions[0].probability).toBeGreaterThan(0);
  });

  it('should list recommendations and prioritize them', async () => {
    const recs = await platformOILService.getRecommendations();
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].title).toBeDefined();
    expect(recs[0].priority).toBeDefined();
    expect(recs[0].explanation.evidence).toBeDefined();
  });

  it('should execute remediation and output SRE step logs', async () => {
    const res = await platformOILService.executeRemediation('purge-vram-cache');
    expect(res.success).toBe(true);
    expect(res.log).toContain('[Diagnose]');
    expect(res.log).toContain('[Plan]');
    expect(res.log).toContain('[Simulate]');
    expect(res.log).toContain('[Execute]');
  });

  it('should fetch unified timeline', async () => {
    const timeline = await platformOILService.getTimeline();
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0].category).toBeDefined();
    expect(timeline[0].title).toBeDefined();
  });

  it('should translate natural language command via NLO engine', async () => {
    const chatSlow = await platformOILService.handleNLCommand('Why is inference slow?');
    expect(chatSlow.intent).toBe('troubleshoot');
    expect(chatSlow.structuredActions.length).toBeGreaterThan(0);

    const chatVram = await platformOILService.handleNLCommand('optimize vram');
    expect(chatVram.intent).toBe('optimize_vram');
    expect(chatVram.structuredActions[0].target).toBe('purge-vram-cache');
  });

  it('should generate executive daily brief', async () => {
    const brief = await platformOILService.generateDailyBrief();
    expect(brief.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(brief.overallStatus).toBeDefined();
    expect(brief.summary).toBeDefined();
    expect(brief.primaryRecommendations.length).toBeGreaterThan(0);
  });
});
