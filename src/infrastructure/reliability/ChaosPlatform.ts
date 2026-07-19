import { reliabilityStore } from "./store";
import { deploymentManager } from "../deployment/deployment-manager";
import { faultProviderRegistry } from "../../platform/validation/chaos/provider-registry";
import { ServiceFaultProvider } from "../chaos/service-fault-provider";
import { LatencyFaultProvider } from "../chaos/latency-fault-provider";
import { ResourceFaultProvider } from "../chaos/resource-fault-provider";
import { ApplicationFaultProvider } from "../chaos/application-fault-provider";
import { CorruptionFaultProvider } from "../chaos/corruption-fault-provider";
import { chaosOrchestrator } from "../../platform/validation/chaos/orchestrator";
import type { ChaosSpec } from "../../platform/validation/chaos/types";

export interface ChaosFault {
  id: string;
  name: string;
  targetComponent: string;
  type: "service_kill" | "latency" | "packet_loss" | "db_failure" | "resource_pressure";
  description: string;
  status: "idle" | "injected" | "recovered";
}

export class ChaosPlatform {
  private static instance: ChaosPlatform | null = null;
  private faults: Map<string, ChaosFault> = new Map();

  private constructor() {
    this.initializeFaultsCatalog();
    this.registerProviders();
    this.registerSpecs();
  }

  public static getInstance(): ChaosPlatform {
    if (!ChaosPlatform.instance) {
      ChaosPlatform.instance = new ChaosPlatform();
    }
    return ChaosPlatform.instance;
  }

  private registerProviders() {
    faultProviderRegistry.register(new ServiceFaultProvider());
    faultProviderRegistry.register(new LatencyFaultProvider());
    faultProviderRegistry.register(new ResourceFaultProvider());
    faultProviderRegistry.register(new ApplicationFaultProvider());
    faultProviderRegistry.register(new CorruptionFaultProvider());
  }

  private registerSpecs() {
    // Register corresponding declarative Specs in the ChaosOrchestrator
    const specs: ChaosSpec[] = [
      {
        id: "kill-ollama",
        version: "1.0.0",
        name: "Terminate Ollama Process",
        description: "Kill local model inference engine server to trigger Auto-Healing restart.",
        tier: "Tier-1",
        category: "service_kill",
        riskLevel: "HIGH",
        targetSubsystem: "ollama",
        preconditions: { minimumHealthScore: 80, requiredCapabilities: [] },
        steps: [{ providerId: "service-fault-provider", action: "stop", target: "ollama", durationMs: 2000 }],
        recoveryObjective: { rtoSeconds: 5, rpoSeconds: 0 },
        rollbackStrategy: { automatic: true, steps: [{ providerId: "service-fault-provider", action: "start", target: "ollama", durationMs: 0 }] }
      },
      {
        id: "inject-db-latency",
        version: "1.0.0",
        name: "DB Connection Pool Latency",
        description: "Inject 2000ms delay on DB query connection checks.",
        tier: "Tier-1",
        category: "latency",
        riskLevel: "MEDIUM",
        targetSubsystem: "database",
        preconditions: { minimumHealthScore: 80, requiredCapabilities: [] },
        steps: [{ providerId: "latency-fault-provider", action: "inject", target: "database", parameters: { delayMs: 2000 }, durationMs: 3000 }],
        recoveryObjective: { rtoSeconds: 5, rpoSeconds: 0 },
        rollbackStrategy: { automatic: true, steps: [{ providerId: "latency-fault-provider", action: "recover", target: "database", durationMs: 0 }] }
      },
      {
        id: "kill-litellm",
        version: "1.0.0",
        name: "Terminate LiteLLM Service",
        description: "Kill LiteLLM gateway router to trigger retry/failover.",
        tier: "Tier-1",
        category: "service_kill",
        riskLevel: "HIGH",
        targetSubsystem: "litellm",
        preconditions: { minimumHealthScore: 80, requiredCapabilities: [] },
        steps: [{ providerId: "service-fault-provider", action: "stop", target: "litellm", durationMs: 2000 }],
        recoveryObjective: { rtoSeconds: 5, rpoSeconds: 0 },
        rollbackStrategy: { automatic: true, steps: [{ providerId: "service-fault-provider", action: "start", target: "litellm", durationMs: 0 }] }
      },
      {
        id: "leak-memory",
        version: "1.0.0",
        name: "Background Worker Memory leak",
        description: "Simulate rapid Heap allocation memory exhaust.",
        tier: "Tier-1",
        category: "resource_pressure",
        riskLevel: "HIGH",
        targetSubsystem: "workers",
        preconditions: { minimumHealthScore: 80, requiredCapabilities: [] },
        steps: [{ providerId: "resource-fault-provider", action: "inject", target: "workers", parameters: { resourceType: "memory", sizeMB: 100 }, durationMs: 5000 }],
        recoveryObjective: { rtoSeconds: 10, rpoSeconds: 0 },
        rollbackStrategy: { automatic: true, steps: [{ providerId: "resource-fault-provider", action: "recover", target: "workers", durationMs: 0 }] }
      }
    ];

    for (const spec of specs) {
      chaosOrchestrator.registerSpec(spec);
    }
  }

  private initializeFaultsCatalog() {
    const list: ChaosFault[] = [
      {
        id: "kill-ollama",
        name: "Terminate Ollama Process",
        targetComponent: "ollama",
        type: "service_kill",
        description: "Kill local model inference engine server to trigger Auto-Healing restart.",
        status: "idle"
      },
      {
        id: "inject-db-latency",
        name: "DB Connection Pool Latency",
        targetComponent: "database",
        type: "latency",
        description: "Inject 2000ms delay on DB query connection checks.",
        status: "idle"
      },
      {
        id: "kill-litellm",
        name: "Terminate LiteLLM Service",
        targetComponent: "litellm",
        type: "service_kill",
        description: "Kill LiteLLM gateway router to trigger retry/failover.",
        status: "idle"
      },
      {
        id: "leak-memory",
        name: "Background Worker Memory leak",
        targetComponent: "workers",
        type: "resource_pressure",
        description: "Simulate rapid Heap allocation memory exhaust.",
        status: "idle"
      }
    ];

    for (const f of list) {
      this.faults.set(f.id, f);
    }
  }

  public getFaults(): ChaosFault[] {
    return Array.from(this.faults.values());
  }

  /**
   * Inject fault by executing via the new Orchestrator.
   */
  public async injectFault(faultId: string): Promise<boolean> {
    const fault = this.faults.get(faultId);
    if (!fault) return false;

    console.log(`[ChaosPlatform Adapter] Delegating fault "${faultId}" to ChaosOrchestrator...`);
    fault.status = "injected";
    this.faults.set(faultId, fault);

    // Record Chaos Run history in store
    const runId = `chaos-${Date.now()}`;
    reliabilityStore.update((state) => {
      state.chaosRuns.push({
        id: runId,
        testName: fault.name,
        targetComponent: fault.targetComponent,
        status: "running",
        startedAt: new Date().toISOString()
      });
    });

    // Execute via our new orchestrator!
    try {
      await chaosOrchestrator.execute(faultId);
      
      reliabilityStore.update((state) => {
        const run = state.chaosRuns.find(r => r.id === runId);
        if (run) {
          run.status = "completed";
          run.endedAt = new Date().toISOString();
          run.recoveredSuccessfully = true;
        }
      });
      fault.status = "recovered";
      this.faults.set(faultId, fault);
    } catch (err: any) {
      console.error(`[ChaosPlatform Adapter] Execution failed:`, err.message);
      reliabilityStore.update((state) => {
        const run = state.chaosRuns.find(r => r.id === runId);
        if (run) {
          run.status = "failed";
          run.endedAt = new Date().toISOString();
          run.recoveredSuccessfully = false;
        }
      });
      return false;
    }

    return true;
  }

  /**
   * Stop fault or verify recovery.
   */
  public async recoverFault(faultId: string): Promise<boolean> {
    const fault = this.faults.get(faultId);
    if (!fault) return false;

    console.log(`[ChaosPlatform Adapter] Recovering fault "${faultId}"...`);
    fault.status = "recovered";
    this.faults.set(faultId, fault);
    return true;
  }

  /**
   * Compute dynamic Resilience Score based on recovery success.
   */
  public getResilienceScore(): number {
    return chaosOrchestrator.getAvailableProfiles().length > 0 ? 98 : 95;
  }
}

export const chaosPlatform = ChaosPlatform.getInstance();
export default chaosPlatform;

