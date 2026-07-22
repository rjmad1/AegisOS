const { ModelRuntime } = require('../../src/platform/ai-runtime/ModelRuntime');

class GeminiProviderPack {
  async initialize(context) {
    context.logger.info("Initializing Google Gemini Provider Pack...");
    
    const runtime = ModelRuntime.getInstance();
    
    const geminiModels = [
      {
        id: "gemini:gemini-1.5-pro",
        name: "gemini-1.5-pro",
        displayName: "Gemini 1.5 Pro (Cloud)",
        provider: "gemini",
        family: "gemini",
        contextLength: 2097152,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.00375,
        latencyAvgMs: 890,
        reliabilityScore: 0.99,
        capabilities: ["tool-use", "vision", "reasoning"],
        status: "online",
        version: "latest"
      }
    ];

    for (const m of geminiModels) {
      runtime.registerModel(m);
      context.logger.info(`Registered Gemini model: ${m.displayName}`);
    }
  }

  async shutdown() {
    console.log("[GeminiProviderPack] Shutting down Gemini integration.");
  }
}

module.exports = GeminiProviderPack;
