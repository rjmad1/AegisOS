import { modelRegistry } from "../registry/model-registry";

export interface ScheduledRequest {
  requestId: string;
  modelName: string;
  priority: "interactive" | "background";
  addedAt: number;
}

export class ResourceScheduler {
  private static instance: ResourceScheduler | null = null;
  private maxVramBytes: number = 16 * 1024 * 1024 * 1024; // 16GB VRAM standard (RTX 5080)
  private interactiveQueue: ScheduledRequest[] = [];
  private backgroundQueue: ScheduledRequest[] = [];

  private constructor() {}

  public static getInstance(): ResourceScheduler {
    if (!ResourceScheduler.instance) {
      ResourceScheduler.instance = new ResourceScheduler();
    }
    return ResourceScheduler.instance;
  }

  // ponytail: schedule request by priority aging
  public scheduleRequest(modelName: string, priority: "interactive" | "background"): { allowed: boolean; reason: string } {
    const model = modelRegistry.getModelInfo(modelName);
    if (!model) {
      return { allowed: false, reason: `Model ${modelName} not found in manifest` };
    }

    const reqId = "req-" + Math.random().toString(36).substring(2, 9);
    const req: ScheduledRequest = {
      requestId: reqId,
      modelName: model.name,
      priority,
      addedAt: Date.now()
    };

    if (priority === "interactive") {
      this.interactiveQueue.push(req);
    } else {
      this.backgroundQueue.push(req);
    }

    // Allocate resources and check for model eviction
    const allocated = this.allocateVramForModel(modelName);
    if (!allocated) {
      return { allowed: false, reason: "Insufficient VRAM. Model warm eviction failed to free required memory block." };
    }

    return { allowed: true, reason: `Request enqueued and scheduled for model: ${modelName}` };
  }

  private allocateVramForModel(modelName: string): boolean {
    const targetModel = modelRegistry.getModelInfo(modelName);
    if (!targetModel) return false;

    // Check currently loaded VRAM size
    const loaded = modelRegistry.getLoadedModels();
    let currentVramUsed = loaded.reduce((acc, m) => acc + (m.vramUsageBytes || 0), 0);

    const gigabytes = parseFloat(targetModel.size) || 2.0;
    const requiredBytes = gigabytes * 1024 * 1024 * 1024;

    const isLoaded = loaded.some((m) => m.name === targetModel.name);
    if (isLoaded) return true; // Already warm in pool

    // Eviction loop (LRU simulation)
    let safetyLimit = 0;
    while (currentVramUsed + requiredBytes > this.maxVramBytes && loaded.length > 0 && safetyLimit < 10) {
      safetyLimit++;
      // Evict least recently loaded model (LRU)
      const toEvict = loaded.shift();
      if (toEvict) {
        console.log(`[Scheduler:Eviction] Evicting model "${toEvict.name}" to free ${toEvict.size} VRAM bytes.`);
        modelRegistry.unloadModel(toEvict.name);
        currentVramUsed -= toEvict.vramUsageBytes || 0;
      }
    }

    if (currentVramUsed + requiredBytes <= this.maxVramBytes) {
      modelRegistry.loadModel(targetModel.name);
      return true;
    }

    return false; // Out of VRAM
  }

  public getQueueStats() {
    return {
      interactiveBacklog: this.interactiveQueue.length,
      backgroundBacklog: this.backgroundQueue.length,
      maxVramGb: 16.0,
      vramUsedGb: parseFloat((modelRegistry.getLoadedModels().reduce((acc, m) => acc + (m.vramUsageBytes || 0), 0) / (1024 * 1024 * 1024)).toFixed(2))
    };
  }
}

export const resourceScheduler = ResourceScheduler.getInstance();
export default resourceScheduler;
