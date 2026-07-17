// tests/product-intelligence.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { platformStateEngine } from '../src/platform/control/PlatformStateEngine';
import { policyExecutionEngine } from '../src/platform/control/PolicyExecutionEngine';
import { engineeringOperationsCenter } from '../src/platform/control/EngineeringOperationsCenter';
import { productIntelligenceEngine } from '../src/platform/control/ProductIntelligenceEngine';
import { feedbackCorrelationEngine } from '../src/platform/control/FeedbackCorrelationEngine';
import { adaptiveRoadmapEngine } from '../src/platform/control/AdaptiveRoadmapEngine';
import { executiveDecisionCenter } from '../src/platform/control/ExecutiveDecisionCenter';
import { platformTransformationOffice } from '../src/platform/control/PlatformTransformationOffice';

describe('Product Intelligence & Adaptive Roadmap Suite', () => {
  beforeAll(() => {
    process.env.OPS_DATABASES_DIR = path.resolve(process.cwd(), 'databases');
  });

  it('ProductIntelligenceEngine should compile health index, value index, and capability matrix', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    const productIntel = await productIntelligenceEngine.compileProductIntelligence(state, policyReport, metrics);

    expect(productIntel).toBeDefined();
    expect(productIntel.productHealthIndex).toBeGreaterThanOrEqual(10);
    expect(productIntel.productHealthIndex).toBeLessThanOrEqual(100);
    expect(productIntel.customerValueIndex).toBeGreaterThanOrEqual(10);
    expect(productIntel.customerValueIndex).toBeLessThanOrEqual(100);
    expect(productIntel.workflowSuccessRate).toBeGreaterThanOrEqual(0);
    expect(productIntel.automationSavingsMonthly).toBeGreaterThan(0);
    
    // Check capability matrix structure
    expect(productIntel.capabilityValueMatrix.length).toBeGreaterThan(0);
    const pairingCap = productIntel.capabilityValueMatrix.find(c => c.capabilityId === 'cap-pairing');
    expect(pairingCap).toBeDefined();
    expect(pairingCap?.intendedOutcome).toBeDefined();
    expect(pairingCap?.measurableKpi).toBeDefined();
    expect(pairingCap?.valueClassification).toBeDefined();
    
    // Check ROI lists
    expect(productIntel.roiByCapability.length).toBeGreaterThan(0);
    expect(productIntel.topValueOpportunities.length).toBeGreaterThan(0);
    expect(productIntel.topValueRisks.length).toBeGreaterThan(0);
  });

  it('FeedbackCorrelationEngine should execute multi-domain event correlation', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    const recs = executiveDecisionCenter.loadRecommendations();

    const findings = await feedbackCorrelationEngine.analyzeFeedbackCorrelations(state, policyReport, metrics, recs);

    expect(findings).toBeDefined();
    expect(findings.length).toBeGreaterThan(0);
    
    const finding = findings[0];
    expect(finding.id).toBeDefined();
    expect(finding.title).toBeDefined();
    expect(finding.sentiment).toBeDefined();
    expect(finding.recommendedRoadmapAdjustment).toBeDefined();
    expect(finding.evidence).toBeDefined();
  });

  it('AdaptiveRoadmapEngine should dynamically reprioritize roadmap items based on evidence', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);
    const recs = executiveDecisionCenter.loadRecommendations();
    const findings = await feedbackCorrelationEngine.analyzeFeedbackCorrelations(state, policyReport, metrics, recs);

    const adaptiveRoadmap = await adaptiveRoadmapEngine.calculateAdaptiveRoadmap(state, metrics, findings);

    expect(adaptiveRoadmap).toBeDefined();
    expect(adaptiveRoadmap.items.length).toBe(6);
    expect(adaptiveRoadmap.items[0].newRank).toBe(1);
    expect(adaptiveRoadmap.items[5].newRank).toBe(6);
    expect(adaptiveRoadmap.explanation).toBeDefined();

    // Verify properties are populated correctly
    const firstItem = adaptiveRoadmap.items[0];
    expect(firstItem.id).toBeDefined();
    expect(firstItem.priorityScore).toBeGreaterThan(0);
    expect(firstItem.repositionNotes).toBeDefined();
  });

  it('PlatformTransformationOffice compileState should consolidate Product Intelligence data', async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    const ptoState = await platformTransformationOffice.compileState(state, policyReport, metrics);

    expect(ptoState.productIntelligence).toBeDefined();
    expect(ptoState.correlationFindings).toBeDefined();
    expect(ptoState.adaptiveRoadmap).toBeDefined();

    expect(ptoState.productIntelligence?.productHealthIndex).toBeGreaterThan(0);
    expect(ptoState.correlationFindings?.length).toBeGreaterThan(0);
    expect(ptoState.adaptiveRoadmap?.items.length).toBe(6);
  });
});
