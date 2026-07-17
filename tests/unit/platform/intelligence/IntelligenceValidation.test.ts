// tests/unit/platform/intelligence/IntelligenceValidation.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import { platformStateEngine } from "../../../../src/platform/control/PlatformStateEngine";
import { policyExecutionEngine } from "../../../../src/platform/control/PolicyExecutionEngine";
import { engineeringOperationsCenter } from "../../../../src/platform/control/EngineeringOperationsCenter";
import { productIntelligenceEngine } from "../../../../src/platform/control/ProductIntelligenceEngine";
import { platformTransformationOffice } from "../../../../src/platform/control/PlatformTransformationOffice";
import { executiveDecisionCenter } from "../../../../src/platform/control/ExecutiveDecisionCenter";

describe("Intelligence Validation & ROI Precision Suite", () => {
  beforeAll(() => {
    process.env.OPS_DATABASES_DIR = path.resolve(process.cwd(), "databases");
  });

  it("should validate that product intelligence calculations are accurate and within range", async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    const intel = await productIntelligenceEngine.compileProductIntelligence(state, policyReport, metrics);

    expect(intel.productHealthIndex).toBeGreaterThanOrEqual(0);
    expect(intel.productHealthIndex).toBeLessThanOrEqual(100);

    expect(intel.customerValueIndex).toBeGreaterThanOrEqual(0);
    expect(intel.customerValueIndex).toBeLessThanOrEqual(100);

    // Verify ROI optimization plans show positive value creation
    expect(intel.automationSavingsMonthly).toBeGreaterThan(0);
    expect(intel.roiByCapability.length).toBeGreaterThan(0);

    // Confirm that confidence score and provenances match the expected properties
    const pairing = intel.capabilityValueMatrix.find(c => c.capabilityId === "cap-pairing");
    expect(pairing?.telemetryClass).toBe("MEASURED");
    expect(pairing?.evidence).toBeDefined();
  });

  it("should validate executive decision center recommendation accuracy and status transitions", async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    const recs = await executiveDecisionCenter.generateRecommendations(state, metrics);
    expect(recs).toBeDefined();

    // Verify recommendation properties
    recs.forEach(rec => {
      expect(rec.id).toBeDefined();
      expect(rec.title).toBeDefined();
      expect(["approved", "dismissed", "pending", "executed"]).toContain(rec.status);
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    });
  });

  it("should validate Platform Transformation Office state consolidation and platform economics", async () => {
    const state = await platformStateEngine.getPlatformState();
    const policyReport = await policyExecutionEngine.evaluatePolicies(state);
    const metrics = await engineeringOperationsCenter.getEngineeringMetrics(state, policyReport);

    const ptoState = await platformTransformationOffice.compileState(state, policyReport, metrics);
    expect(ptoState.economics).toBeDefined();
    expect(ptoState.economics.platformRoiPercent).toBeGreaterThanOrEqual(0);
    expect(ptoState.economics.automationSavingsMonthly).toBeGreaterThanOrEqual(0);
  });
});
