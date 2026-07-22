const { ModelRuntime } = require('../../src/platform/ai-runtime/ModelRuntime');

class OpenAIProviderPack {
  async initialize(context) {
    context.logger.info("Initializing OpenAI Provider Pack...");
    
    const runtime = ModelRuntime.getInstance();
    
    const openaiModels = [
      {
        id: "openai:o1-preview",
        name: "o1-preview",
        displayName: "OpenAI o1 Preview (Cloud)",
        provider: "openai",
        family: "o1",
        contextLength: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.060,
        latencyAvgMs: 3400,
        reliabilityScore: 0.99,
        capabilities: ["reasoning", "tool-use"],
        status: "online",
        version: "latest"
      }
    ];

    for (const m of openaiModels) {
      runtime.registerModel(m);
      context.logger.info(`Registered OpenAI model: ${m.displayName}`);
    }
  }

  async shutdown() {
    console.log("[OpenAIProviderPack] Shutting down OpenAI integration.");
  }
}

module.exports = OpenAIProviderPack;
