// tests/mission-control.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { platformStateEngine } from '../src/platform/control/PlatformStateEngine';
import { policyExecutionEngine } from '../src/platform/control/PolicyExecutionEngine';
import { engineeringOperationsCenter } from '../src/platform/control/EngineeringOperationsCenter';
import { executiveDecisionCenter } from '../src/platform/control/ExecutiveDecisionCenter';
import { automatedGovernanceEngine } from '../src/platform/control/AutomatedGovernanceEngine';
import { platformTransformationOffice } from '../src/platform/control/PlatformTransformationOffice';


describe('Mission Control Capability Suite', () => {
  beforeAll(() => {
    // Setup environment variables for test runs
    process.env.OPS_DATABASES_DIR = path.resolve(process.cwd(), 'databases');
  });

  it('PlatformStateEngine should aggregate health and telemetry metrics', async () => {
    const state = await platformStateEngine.getPlatformState();
    
    expect(state).toBeDefined();
    expect(state.timestamp).toBeDefined();
    expect(state.overallStatus).toBeDefined();
    expect(state.health.database).toBeDefined();
    expect(state.health.ports.length).toBeGreaterThan(0);
    expect(state.topology.nodes.length).toBeGreaterThan(0);
    expect(state.risks).toBeDefined();
    expect(state.objectives.roadmapProgress).toBeGreaterThanOrEqual(0);
  });

  it('PolicyExecutionEngine should run validation rules on aggregated state', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    
    expect(policyReport).toBeDefined();
    expect(policyReport.evaluations.length).toBeGreaterThanOrEqual(4);
    expect(policyReport.evaluations.map(e => e.policyId)).toContain('POL-ARC-01');
    expect(policyReport.evaluations.map(e => e.policyId)).toContain('POL-SEC-02');
  });

  it('EngineeringOperationsCenter should scan codebase for technical debt and compute EOC KPIs', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    expect(metrics).toBeDefined();
    expect(metrics.technicalDebtTodoCount).toBeGreaterThanOrEqual(0);
    expect(metrics.releaseReadinessScore).toBeGreaterThanOrEqual(0);
    expect(metrics.releaseReadinessScore).toBeLessThanOrEqual(100);
    expect(metrics.operationalHealthIndex).toBeGreaterThanOrEqual(0);
  });

  it('ExecutiveDecisionCenter should generate actionable evidence-based recommendations', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    
    const recs = await executiveDecisionCenter.generateRecommendations(state, metrics);
    expect(recs).toBeDefined();
    expect(recs.length).toBeGreaterThanOrEqual(0);

    // If there are recommendations generated, test approving one
    if (recs.length > 0) {
      const targetId = recs[0].id;
      const updatedRecs = executiveDecisionCenter.actionRecommendation(targetId, 'approved');
      const actioned = updatedRecs.find(r => r.id === targetId);
      expect(actioned?.status).toBe('executed');
      expect(actioned?.actionedDate).toBeDefined();
    }
  });

  it('AutomatedGovernanceEngine should run complete automation cycle and sync Digital Twin', async () => {
    const report = await automatedGovernanceEngine.runAutomation();
    
    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(report.state).toBeDefined();
    expect(report.policies).toBeDefined();
    expect(report.engineering).toBeDefined();
    expect(report.recommendations).toBeDefined();

    // Verify digital twin state json is written to file
    const twinPath = path.resolve(process.cwd(), 'databases', 'mission_control.json');
    expect(fs.existsSync(twinPath)).toBe(true);

    const savedContent = JSON.parse(fs.readFileSync(twinPath, 'utf-8'));
    expect(savedContent.timestamp).toBeDefined();
    expect(savedContent.state.overallStatus).toBeDefined();
    expect(savedContent.pto).toBeDefined();
    expect(savedContent.pto.initiatives.length).toBeGreaterThan(0);
    expect(savedContent.pto.readinessReview).toBeDefined();
  });

  it('PlatformTransformationOffice should calculate rank scores and prioritized portfolio', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    const ptoState = await platformTransformationOffice.compileState(state, policyReport, metrics);

    expect(ptoState.portfolioRanking).toBeDefined();
    expect(ptoState.portfolioRanking.length).toBe(6);
    expect(ptoState.portfolioRanking[0].rank).toBe(1);
    expect(ptoState.portfolioRanking[0].rankScore).toBeGreaterThan(ptoState.portfolioRanking[5].rankScore);
  });

  it('PlatformTransformationOffice should calculate platform economics showing positive ROI', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    const ptoState = await platformTransformationOffice.compileState(state, policyReport, metrics);

    expect(ptoState.economics).toBeDefined();
    expect(ptoState.economics.platformRoiPercent).toBeGreaterThan(0);
    expect(ptoState.economics.modelSovereigntySavingsMonthly).toBe(3500);
  });

  it('PlatformTransformationOffice should evaluate Platform Readiness Review checks', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    const ptoState = await platformTransformationOffice.compileState(state, policyReport, metrics);

    expect(ptoState.readinessReview).toBeDefined();
    expect(ptoState.readinessReview.checks.length).toBe(5);
    expect(ptoState.readinessReview.readinessScore).toBeGreaterThanOrEqual(0);
    expect(ptoState.readinessReview.readinessScore).toBeLessThanOrEqual(100);
  });
});

