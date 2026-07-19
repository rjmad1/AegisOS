// src/platform/control-plane/ModelLifecycleManager.ts
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

export interface ModelStatus {
  name: string;
  status: "healthy" | "missing" | "corrupt" | "warming";
  checksum?: string;
  vramUsageGb?: number;
}

export class ModelLifecycleManager {
  private static instance: ModelLifecycleManager | null = null;
  private configPath = path.resolve(process.cwd(), "configs", "litellm", "config.yaml");

  private constructor() {}

  public static getInstance(): ModelLifecycleManager {
    if (!ModelLifecycleManager.instance) {
      ModelLifecycleManager.instance = new ModelLifecycleManager();
    }
    return ModelLifecycleManager.instance;
  }

  /**
   * Scans configured models and compares them against Ollama's active tags.
   */
  public async getModelStatuses(): Promise<ModelStatus[]> {
    const statuses: ModelStatus[] = [];
    const configuredModels = this.getConfiguredModels();

    let ollamaModels: any[] = [];
    try {
      const res = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = await res.json();
        ollamaModels = data.models || [];
      }
    } catch {
      // Ollama is offline, return all as offline/missing
      return configuredModels.map(name => ({ name, status: "missing" }));
    }

    for (const name of configuredModels) {
      const matched = ollamaModels.find((m: any) => m.name === name || m.name.startsWith(name));
      if (matched) {
        statuses.push({
          name,
          status: "healthy",
          checksum: matched.digest || "verified",
          vramUsageGb: matched.size ? parseFloat((matched.size / (1024 * 1024 * 1024)).toFixed(2)) : 0
        });
      } else {
        statuses.push({
          name,
          status: "missing"
        });
      }
    }

    return statuses;
  }

  /**
   * Warm up primary models in VRAM by running a simple test generation query.
   */
  public async warmModels(): Promise<string[]> {
    const warmed: string[] = [];
    const models = await this.getModelStatuses();
    const healthy = models.filter(m => m.status === "healthy");

    for (const model of healthy) {
      try {
        console.log(`[ModelLifecycleManager] Warming up model weights for "${model.name}"...`);
        const res = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model.name,
            prompt: "system: ping",
            stream: false,
            options: { num_predict: 1 }
          }),
          signal: AbortSignal.timeout(15000) // 15s timeout
        });
        
        if (res.ok) {
          warmed.push(model.name);
        }
      } catch (err: any) {
        console.warn(`[ModelLifecycleManager] Failed to warm model "${model.name}": ${err.message}`);
      }
    }
    return warmed;
  }

  /**
   * Repair LiteLLM configuration fallbacks when models are missing.
   */
  public async repairRoutingAndAliases(): Promise<boolean> {
    const statuses = await this.getModelStatuses();
    const missing = statuses.filter(m => m.status === "missing");

    if (missing.length === 0) return true;

    console.log("[ModelLifecycleManager] Missing models detected. Injecting routing fallback rules...");
    try {
      if (!fs.existsSync(this.configPath)) return false;
      const content = fs.readFileSync(this.configPath, "utf-8");

      // Simple YAML manipulation: locate litellm_settings block and append fallback routing rules
      if (!content.includes("fallbacks:")) {
        const lines = content.split("\n");
        const idx = lines.findIndex(l => l.trim().startsWith("litellm_settings:"));
        
        if (idx !== -1) {
          const fallbackYaml = `\n  fallbacks:\n` + missing.map(m => `    - [${m.name}, smollm:135m]`).join("\n");
          lines.splice(idx + 1, 0, fallbackYaml);
          fs.writeFileSync(this.configPath, lines.join("\n"), "utf-8");
          console.log("[ModelLifecycleManager] Successfully injected LiteLLM routing fallbacks.");
          return true;
        }
      }
    } catch (err: any) {
      console.error("[ModelLifecycleManager] Failed to update LiteLLM fallbacks:", err.message);
    }
    return false;
  }

  /**
   * Trigger background download/pull of missing models.
   */
  public async autoRepairModels(): Promise<void> {
    const statuses = await this.getModelStatuses();
    const missing = statuses.filter(m => m.status === "missing");

    for (const model of missing) {
      console.log(`[ModelLifecycleManager] Triggering background pull for missing model: ${model.name}`);
      exec(`ollama pull ${model.name}`, (err) => {
        if (err) {
          console.error(`[ModelLifecycleManager:BackgroundPull] Failed to pull "${model.name}":`, err.message);
        } else {
          console.log(`[ModelLifecycleManager:BackgroundPull] Model "${model.name}" pulled successfully.`);
          // Trigger warm-up after pulling weights
          this.warmModels().catch(() => {});
        }
      });
    }
  }

  private getConfiguredModels(): string[] {
    try {
      if (!fs.existsSync(this.configPath)) return [];
      const content = fs.readFileSync(this.configPath, "utf-8");
      const matches = content.match(/model_name:\s+(\S+)/g);
      if (matches) {
        return matches.map(m => m.replace("model_name:", "").trim());
      }
    } catch {}
    return ["smollm:135m", "gemma4:latest", "deepseek-r1:32b"]; // Fallback defaults
  }
}

export const modelLifecycleManager = ModelLifecycleManager.getInstance();
export default modelLifecycleManager;
