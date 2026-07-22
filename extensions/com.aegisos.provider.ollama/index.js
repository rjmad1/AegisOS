const { ModelRuntime } = require('../../src/platform/ai-runtime/ModelRuntime');

class OllamaProviderPack {
  async initialize(context) {
    context.logger.info("Initializing Ollama Provider Pack...");
    
    const runtime = ModelRuntime.getInstance();
    
    const ollamaModels = [
      {
        id: "ollama:deepseek-r1:8b",
        name: "deepseek-r1:8b",
        displayName: "DeepSeek R1 8B (Local)",
        provider: "ollama",
        family: "deepseek",
        parameterCount: "8B",
        vramRequiredGb: 6,
        contextLength: 16384,
        costPer1kInput: 0.0,
        costPer1kOutput: 0.0,
        latencyAvgMs: 220,
        reliabilityScore: 0.94,
        capabilities: ["reasoning", "tool-use"],
        status: "online",
        version: "latest"
      },
      {
        id: "ollama:qwen2.5:14b",
        name: "qwen2.5:14b",
        displayName: "Qwen 2.5 14B (Local)",
        provider: "ollama",
        family: "qwen",
        parameterCount: "14B",
        vramRequiredGb: 10,
        contextLength: 32768,
        costPer1kInput: 0.0,
        costPer1kOutput: 0.0,
        latencyAvgMs: 290,
        reliabilityScore: 0.95,
        capabilities: ["tool-use"],
        status: "online",
        version: "latest"
      }
    ];

    for (const m of ollamaModels) {
      runtime.registerModel(m);
      context.logger.info(`Registered Ollama model: ${m.displayName}`);
    }

    context.eventBus.subscribe("VramOptimizationTriggered", (event) => {
      context.logger.info(`[Ollama Provider] Optimizing local VRAM. Active models: ${JSON.stringify(event.payload)}`);
    });
  }

  async shutdown() {
    console.log("[OllamaProviderPack] Shutting down Ollama integration.");
  }
}

module.exports = OllamaProviderPack;
