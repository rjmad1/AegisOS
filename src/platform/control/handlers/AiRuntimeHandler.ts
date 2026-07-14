import { ModelRuntime } from "../../ai-runtime/ModelRuntime";
import { rollbackEngine } from "../RollbackEngine";

export class AiRuntimeHandler {
  public async execute(type: string, payload: Record<string, any>, commandId: string): Promise<any> {
    const runtime = ModelRuntime.getInstance();
    const modelId = payload.modelId || payload.id || "";
    
    if (!modelId && type !== "ai:benchmark_model") {
      throw new Error("Model identifier (modelId) is required.");
    }

    switch (type) {
      case "ai:load_model": {
        const model = runtime.getModel(modelId);
        if (!model) throw new Error(`Model ${modelId} not registered in catalog.`);
        
        const previousStatus = model.status;
        model.status = "online";
        
        // Register rollback: Restore status
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          model.status = previousStatus;
        });

        return { status: "online", modelId, displayName: model.displayName };
      }

      case "ai:unload_model": {
        const model = runtime.getModel(modelId);
        if (!model) throw new Error(`Model ${modelId} not registered in catalog.`);
        
        const previousStatus = model.status;
        model.status = "offline";
        
        // Register rollback: Restore status
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          model.status = previousStatus;
        });

        return { status: "offline", modelId, displayName: model.displayName };
      }

      case "ai:download_model": {
        // Simulate downloading a new model
        const name = payload.name || "custom-model";
        const newModelId = `ollama:${name}:latest`;
        
        // Register in catalog if not existing
        const exists = runtime.getModel(newModelId);
        if (!exists) {
          runtime.registerModel({
            id: newModelId,
            name,
            displayName: `${name} (Downloaded)`,
            provider: "ollama",
            family: "custom",
            contextLength: 4096,
            status: "online",
            version: "latest",
          });
        }
        
        // Register rollback: Remove the model from catalog
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          // ModelRuntime does not have an unregister in its standard API, 
          // but we can set its status to offline or delete
          const m = runtime.getModel(newModelId);
          if (m) m.status = "offline";
        });

        return { status: "downloaded", modelId: newModelId, progress: 100 };
      }

      case "ai:delete_model": {
        const model = runtime.getModel(modelId);
        if (!model) throw new Error(`Model ${modelId} not found.`);
        
        const previousStatus = model.status;
        model.status = "offline"; // Simulate deletion by making it unavailable
        
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          model.status = previousStatus;
        });

        return { status: "deleted", modelId };
      }

      case "ai:switch_default_model": {
        const policy = runtime.getPolicy("policy:default");
        if (!policy) throw new Error("Standard Default Policy ('policy:default') not found.");
        
        const previousPrimary = policy.primaryModel;
        policy.primaryModel = modelId;

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          policy.primaryModel = previousPrimary;
        });

        return { success: true, defaultModel: modelId, previousDefault: previousPrimary };
      }

      case "ai:benchmark_model": {
        const benchmarkModelId = modelId || "ollama:gemma2:9b";
        const model = runtime.getModel(benchmarkModelId);
        if (!model) throw new Error(`Model ${benchmarkModelId} not found.`);

        // Simulate a standard prompt latency benchmarking execution
        return {
          modelId: benchmarkModelId,
          tokensPerSecond: 38.4 + Math.random() * 5.0,
          firstTokenLatencyMs: 120 + Math.round(Math.random() * 40),
          totalExecutionTimeMs: 1420 + Math.round(Math.random() * 200),
          vramPeakAllocBytes: (model.vramRequiredGb || 4) * 1024 * 1024 * 1024,
          status: "benchmarked",
        };
      }

      default:
        throw new Error(`Unsupported AI runtime command type: ${type}`);
    }
  }
}

export const aiRuntimeHandler = new AiRuntimeHandler();
