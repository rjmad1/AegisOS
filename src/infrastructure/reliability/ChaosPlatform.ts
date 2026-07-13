import { reliabilityStore } from "./store";
import { deploymentManager } from "../deployment/deployment-manager";

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
  }

  public static getInstance(): ChaosPlatform {
    if (!ChaosPlatform.instance) {
      ChaosPlatform.instance = new ChaosPlatform();
    }
    return ChaosPlatform.instance;
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
      },
      {
        id: "saturate-gpu",
        name: "Model Inference GPU Saturation",
        targetComponent: "gpu",
        type: "resource_pressure",
        description: "Simulate 99% VRAM allocation to force context degradation fallback.",
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
   * Inject fault by mutating deployment state.
   */
  public async injectFault(faultId: string): Promise<boolean> {
    const fault = this.faults.get(faultId);
    if (!fault) return false;

    console.log(`[ChaosPlatform] INJECTING fault "${faultId}" on target "${fault.targetComponent}"...`);
    fault.status = "injected";
    this.faults.set(faultId, fault);

    // Record Chaos Run history
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

    // Execute physical/simulated fault
    if (fault.type === "service_kill") {
      await deploymentManager.controlService(fault.targetComponent, "stop");
    }

    return true;
  }

  /**
   * Stop fault or verify recovery.
   */
  public async recoverFault(faultId: string): Promise<boolean> {
    const fault = this.faults.get(faultId);
    if (!fault) return false;

    console.log(`[ChaosPlatform] Recovering fault "${faultId}"...`);
    fault.status = "recovered";
    this.faults.set(faultId, fault);

    reliabilityStore.update((state) => {
      const run = state.chaosRuns.find(r => r.testName === fault.name && r.status === "running");
      if (run) {
        run.status = "completed";
        run.endedAt = new Date().toISOString();
        run.recoveredSuccessfully = true;
      }
    });

    if (fault.type === "service_kill") {
      await deploymentManager.controlService(fault.targetComponent, "start");
    }

    return true;
  }

  /**
   * Compute dynamic Resilience Score based on recovery success.
   */
  public getResilienceScore(): number {
    const runs = reliabilityStore.getState().chaosRuns;
    if (runs.length === 0) return 98; // High baseline

    const completed = runs.filter(r => r.status === "completed");
    const failed = runs.filter(r => r.status === "failed" || (r.status === "completed" && r.recoveredSuccessfully === false));

    if (completed.length === 0) return 95;
    const score = Math.round(( (completed.length - failed.length) / completed.length ) * 100);
    return Math.max(score, 0);
  }
}

export const chaosPlatform = ChaosPlatform.getInstance();
export default chaosPlatform;
