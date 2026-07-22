import { PlatformCommand } from "./types";
import { CommandRegistry } from "./CommandRegistry";
import { ModelRuntime } from "../ai-runtime/ModelRuntime";

export interface SwitchModelRuntimePayload {
  policyId: string;
  tenantId: string;
}

export const SwitchModelRuntimeCommand: PlatformCommand<SwitchModelRuntimePayload, any> = {
  id: "cmd:platform:switch-model-runtime",
  title: "Switch Model Runtime Policy",
  description: "Dynamically switches the active routing policy in ModelRuntime (e.g., between Ollama and LiteLLM).",
  category: "platform",
  auditClassification: "SENSITIVE",

  validate: async (payload) => {
    if (!payload.policyId) {
      return "Missing required field: policyId.";
    }
    const runtime = ModelRuntime.getInstance();
    const policy = runtime.getPolicy(payload.policyId);
    if (!policy) {
      return `Policy with ID '${payload.policyId}' does not exist.`;
    }
    return true;
  },

  execute: async (payload, context) => {
    console.log(`[SwitchModelRuntime] Switching active default policy to '${payload.policyId}'`);
    
    const runtime = ModelRuntime.getInstance();
    const policy = runtime.getPolicy(payload.policyId);
    
    if (policy) {
      // Create a new default policy pointing to the same strategy and models
      runtime.registerPolicy({
        ...policy,
        id: "policy:default",
        name: "Standard Default Policy (Overridden)"
      });
    }

    return {
      outcome: "SUCCESS",
      data: {
        activePolicyId: payload.policyId,
        policyName: policy?.name
      },
      correlationId: `switch_runtime_${payload.policyId}_${Date.now()}`,
      executionDurationMs: 0
    };
  }
};

// Auto-register upon import
CommandRegistry.register(SwitchModelRuntimeCommand);
