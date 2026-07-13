import { describe, it, expect, beforeEach, vi } from "vitest";
import { srePlatform } from "./SREPlatform";
import { chaosPlatform } from "./ChaosPlatform";
import { disasterRecovery } from "./DisasterRecovery";
import { autonomousController } from "./AutonomousController";
import { reliabilityStore } from "./store";

describe("Autonomous Reliability & SRE Platform", () => {
  beforeEach(() => {
    // Reset state in memory
    reliabilityStore.update((state) => {
      state.incidents = [];
      state.chaosRuns = [];
      state.backups = [];
      state.sloMetrics = {
        availabilitySlo: 99.9,
        latencySloMs: 200,
        uptimeMinutes: 1000,
        downtimeMinutes: 0,
        errorCount: 0,
        totalRequestsCount: 100
      };
    });
  });

  it("should record requests and compute correct availability SLO compliance", () => {
    srePlatform.recordRequest("litellm", 150, false);
    srePlatform.recordRequest("litellm", 300, true);

    const report = srePlatform.getSloReport();
    // 1 error out of 102 requests on litellm means litellm (99.02% < 99.95%) breaches SLO.
    // 3 of 6 services meet their SLOs (database, redis, workers), giving exactly 50%.
    expect(report.overallSloCompliance).toBe(50);
  });

  it("should inject and recover chaos faults successfully", async () => {
    const list = chaosPlatform.getFaults();
    const targetFault = list[0];

    const injected = await chaosPlatform.injectFault(targetFault.id);
    expect(injected).toBe(true);

    const state = reliabilityStore.getState();
    const activeRun = state.chaosRuns.find(r => r.testName === targetFault.name);
    expect(activeRun).toBeDefined();
    expect(activeRun?.status).toBe("running");

    const recovered = await chaosPlatform.recoverFault(targetFault.id);
    expect(recovered).toBe(true);
    expect(chaosPlatform.getResilienceScore()).toBe(100);
  });

  it("should perform backups and verify recovery integrity logs", async () => {
    const success = await disasterRecovery.performBackup("configs");
    expect(success).toBe(true);

    const state = reliabilityStore.getState();
    const backup = state.backups[0];
    expect(backup).toBeDefined();
    expect(backup.status).toBe("healthy");
    expect(backup.verificationLogs).toContain("integrity checked");
  });

  it("should evaluate platform health and generate recommendations in the Platform Controller", async () => {
    const report = await autonomousController.evaluatePlatform();
    expect(report.status).toBeDefined();
    expect(report.recommendations).toBeInstanceOf(Array);
  });
});
