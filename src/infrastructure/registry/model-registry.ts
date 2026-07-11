import * as fs from "fs";
import * as path from "path";

export interface ModelProfile {
  name: string;
  size: string;
  parameters: string;
  alias: string;
  role: string;
  status?: "loaded" | "unloaded" | "loading";
  vramUsageBytes?: number;
}

export class ModelRegistry {
  private static instance: ModelRegistry | null = null;
  private manifestPath: string;
  private loadedModels: Map<string, ModelProfile> = new Map();

  private constructor() {
    this.manifestPath = path.resolve(process.cwd(), "ModelManifest.json");
    // Pre-populate some loaded models in-memory as "loaded" based on running services
    this.loadedModels.set("smollm:135m", {
      name: "smollm:135m",
      size: "91 MB",
      parameters: "135M",
      alias: "smollm",
      role: "Ultra-lightweight terminal fallback",
      status: "loaded"
    });
    this.loadedModels.set("gemma2:9b", {
      name: "gemma2:9b",
      size: "9.6 GB",
      parameters: "9B",
      alias: "chat",
      role: "Lightweight chat",
      status: "loaded"
    });
  }

  public static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  public listModels(): ModelProfile[] {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, "utf-8");
        const list = JSON.parse(raw) as ModelProfile[];
        return list.map((m) => {
          const loaded = this.loadedModels.get(m.name);
          return {
            ...m,
            status: loaded ? loaded.status : "unloaded",
            vramUsageBytes: loaded?.vramUsageBytes || 0
          };
        });
      }
    } catch (err) {
      console.error("[ModelRegistry] Failed to read ModelManifest.json:", err);
    }
    return [];
  }

  public getModelInfo(name: string): ModelProfile | null {
    const list = this.listModels();
    return list.find((m) => m.name === name || m.alias === name) || null;
  }

  public registerModel(profile: ModelProfile): void {
    const list = this.listModels();
    const existingIndex = list.findIndex((m) => m.name === profile.name);
    
    if (existingIndex >= 0) {
      list[existingIndex] = profile;
    } else {
      list.push(profile);
    }

    try {
      fs.writeFileSync(this.manifestPath, JSON.stringify(list, null, 2), "utf-8");
      console.log(`[ModelRegistry] Registered model in manifest: ${profile.name}`);
    } catch (err) {
      console.error("[ModelRegistry] Failed to save updated manifest:", err);
    }
  }

  public loadModel(name: string): boolean {
    const model = this.getModelInfo(name);
    if (!model) return false;

    // Simulate loading VRAM allocations (roughly parsing size to bytes)
    const gigabytes = parseFloat(model.size) || 0.1;
    const vramBytes = gigabytes * 1024 * 1024 * 1024;

    this.loadedModels.set(model.name, {
      ...model,
      status: "loaded",
      vramUsageBytes: vramBytes
    });
    console.log(`[ModelRegistry] Loaded model into VRAM: ${model.name} (${model.size})`);
    return true;
  }

  public unloadModel(name: string): boolean {
    const model = this.getModelInfo(name);
    if (!model) return false;

    if (this.loadedModels.has(model.name)) {
      this.loadedModels.delete(model.name);
      console.log(`[ModelRegistry] Unloaded model from VRAM: ${model.name}`);
      return true;
    }
    return false;
  }

  public getLoadedModels(): ModelProfile[] {
    return Array.from(this.loadedModels.values());
  }
}

export const modelRegistry = ModelRegistry.getInstance();
export default modelRegistry;
