import { describe, it, expect, beforeEach, vi } from "vitest";
import { srePlatform } from "./SREPlatform";
import { disasterRecovery } from "./DisasterRecovery";
import { reliabilityStore } from "./store";

// Mock modules that perform real OS operations (port scanning, process killing, docker exec)
vi.mock("../deployment/deployment-manager", () => ({
  deploymentManager: {
    resolvePortCollision: vi.fn().mockResolvedValue(11434),
    startService: vi.fn().mockResolvedValue(true),
    stopService: vi.fn().mockResolvedValue(true),
    getServiceStatuses: vi.fn().mockReturnValue([]),
    checkPort: vi.fn().mockResolvedValue(false),
  },
  DeploymentManager: { getInstance: vi.fn() }
}));

vi.mock("../../platform/control-plane/DependencyManager", () => ({
  dependencyManager: {
    detectDrift: vi.fn().mockResolvedValue({ hasDrift: false, issues: [] }),
    reconcileDependencies: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock("../../platform/control-plane/ModelLifecycleManager", () => ({
  modelLifecycleManager: {
    getModelStatuses: vi.fn().mockResolvedValue([]),
    autoRepairModels: vi.fn().mockResolvedValue(undefined),
    repairRoutingAndAliases: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock("./SelfHealingFramework", () => ({
  selfHealingFramework: {
    executeHealingCycle: vi.fn().mockResolvedValue({
      issuesDetected: [],
      remediations: [],
      cycleDurationMs: 50,
    }),
  }
}));

vi.mock("./DiagnosticsEngine", () => ({
  diagnosticsEngine: {
    runDeepDiagnostics: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock("./ReliabilityAutomation", () => ({
  reliabilityAutomation: {
    runContinuousValidations: vi.fn().mockResolvedValue({ ready: true }),
  }
}));

vi.mock("./CapacityEngine", () => ({
  capacityEngine: {
    getCapacityForecasts: vi.fn().mockResolvedValue([]),
  }
}));

// Mock the chaos orchestrator to avoid real fault injection
vi.mock("../../platform/validation/chaos/orchestrator", () => ({
  chaosOrchestrator: {
    execute: vi.fn().mockResolvedValue({ status: "PASS" }),
    getAvailableProfiles: vi.fn().mockReturnValue(["kill-ollama"]),
    registerSpec: vi.fn(),
  }
}));

// Mock fault providers to prevent real service interactions
vi.mock("../../platform/validation/chaos/provider-registry", () => ({
  faultProviderRegistry: {
    register: vi.fn(),
    getProvider: vi.fn().mockReturnValue({
      inject: vi.fn().mockResolvedValue(true),
      recover: vi.fn().mockResolvedValue(true),
    }),
  }
}));

vi.mock("../chaos/service-fault-provider", () => {
  return { ServiceFaultProvider: class { providerId = "service-fault-provider"; inject = vi.fn().mockResolvedValue(true); recover = vi.fn().mockResolvedValue(true); } };
});

vi.mock("../chaos/latency-fault-provider", () => {
  return { LatencyFaultProvider: class { providerId = "latency-fault-provider"; inject = vi.fn().mockResolvedValue(true); recover = vi.fn().mockResolvedValue(true); } };
});

vi.mock("../chaos/resource-fault-provider", () => {
  return { ResourceFaultProvider: class { providerId = "resource-fault-provider"; inject = vi.fn().mockResolvedValue(true); recover = vi.fn().mockResolvedValue(true); } };
});

vi.mock("../chaos/application-fault-provider", () => {
  return { ApplicationFaultProvider: class { providerId = "application-fault-provider"; inject = vi.fn().mockResolvedValue(true); recover = vi.fn().mockResolvedValue(true); } };
});

vi.mock("../chaos/corruption-fault-provider", () => {
  return { CorruptionFaultProvider: class { providerId = "corruption-fault-provider"; inject = vi.fn().mockResolvedValue(true); recover = vi.fn().mockResolvedValue(true); } };
});

// Now import subjects under test (AFTER vi.mock declarations)
import { chaosPlatform } from "./ChaosPlatform";
import { autonomousController } from "./AutonomousController";

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

    // After injectFault resolves, the orchestrator has completed execution,
    // so the chaos run status is "completed" (not "running").
    const state = reliabilityStore.getState();
    const activeRun = state.chaosRuns.find(r => r.testName === targetFault.name);
    expect(activeRun).toBeDefined();
    expect(activeRun?.status).toBe("completed");

    const recovered = await chaosPlatform.recoverFault(targetFault.id);
    expect(recovered).toBe(true);

    // getResilienceScore returns 98 when orchestrator profiles exist
    expect(chaosPlatform.getResilienceScore()).toBe(98);
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
    // With all dependencies mocked healthy, status should be "running"
    expect(report.status).toBe("running");
  });
});
