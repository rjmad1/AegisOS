const { ModelRuntime } = require('../../src/platform/ai-runtime/ModelRuntime');

class LiteLLMProviderPack {
  async initialize(context) {
    context.logger.info("Initializing LiteLLM Provider Pack...");
    
    const runtime = ModelRuntime.getInstance();
    
    const litellmModels = [
      {
        id: "litellm:deepseek-coder",
        name: "deepseek-coder",
        displayName: "DeepSeek Coder V2 (LiteLLM)",
        provider: "litellm",
        family: "deepseek",
        parameterCount: "unknown",
        contextLength: 128000,
        costPer1kInput: 0.00014,
        costPer1kOutput: 0.00028,
        latencyAvgMs: 750,
        reliabilityScore: 0.98,
        capabilities: ["tool-use", "reasoning"],
        status: "online",
        version: "v2.0"
      }
    ];

    for (const m of litellmModels) {
      runtime.registerModel(m);
      context.logger.info(`Registered LiteLLM model: ${m.displayName}`);
    }
  }

  async shutdown() {
    console.log("[LiteLLMProviderPack] Shutting down LiteLLM integration.");
  }
}

module.exports = LiteLLMProviderPack;
