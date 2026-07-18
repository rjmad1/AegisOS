// extensions/com.aegisos.ext.logger/index.js
// CommonJS implementation of the Security Activity Logger Extension.

class SecurityActivityLoggerExtension {
  constructor() {
    this.subIds = [];
  }

  async initialize(context) {
    context.logger.info("Security Activity Logger extension initialized.");

    // Subscribe to platform lifecycle events
    try {
      const subId1 = context.eventBus.subscribe("ExtensionActivated", (event) => {
        context.logger.info(`[Audit Log] Extension activated at timestamp: ${event.timestamp}. Details: ${JSON.stringify(event.payload)}`);
      });
      this.subIds.push(subId1);

      const subId2 = context.eventBus.subscribe("ToolExecuted", (event) => {
        context.logger.info(`[Audit Log] Tool Execution detected. Payload: ${JSON.stringify(event.payload)}`);
      });
      this.subIds.push(subId2);
    } catch (err) {
      context.logger.error("Failed to register event subscriptions in logger extension", err);
    }
  }

  async shutdown() {
    console.log("[com.aegisos.ext.logger] Shutting down. Cleaning up event subscriptions.");
    // In a fully loaded scenario, the context would offer unsubscribing
  }
}

module.exports = SecurityActivityLoggerExtension;
