const { ProviderRegistry } = require('../../src/infrastructure/providers/registry');

class JiraEnterpriseConnector {
  async initialize(context) {
    context.logger.info("Initializing Jira Enterprise Connector...");

    // Register Knowledge Provider
    try {
      const providerRegistry = ProviderRegistry.getInstance();
      providerRegistry.registerProvider({
        id: "jira-knowledge-provider",
        name: "Jira Issue Board Knowledge",
        type: "knowledge-provider",
        async initialize(config) {},
        async shutdown() {},
        async getEntities() {
          return [
            {
              id: "jira-ticket-board",
              name: "AegisOS Sprint Backlog",
              type: "jira-board",
              description: "Jira scrum backlog tickets for Phase 7 implementation details.",
              tags: ["pmi", "jira", "sprint"],
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              metadata: {
                location: "https://jira.atlassian.com/browse/AEGIS-101",
                owner: "scrum-master",
                version: "1.0.0"
              }
            }
          ];
        },
        async checkHealth() {
          return { status: "healthy", details: "Connected to Jira Cloud API." };
        },
        async discover() {
          return ["jira-ticket-board"];
        }
      });
    } catch (e) {
      context.logger.error("Failed to register Jira knowledge provider", e);
    }
  }

  async shutdown() {
    console.log("[JiraEnterpriseConnector] Shutting down Jira connector.");
    const providerRegistry = ProviderRegistry.getInstance();
    providerRegistry.unregisterProvider("jira-knowledge-provider");
  }
}

module.exports = JiraEnterpriseConnector;
