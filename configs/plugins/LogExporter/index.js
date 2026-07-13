// LogExporter Plugin entrypoint
export default class LogExporterPlugin {
  constructor(context) {
    this.context = context;
  }

  async initialize() {
    this.context.logger.info("Initializing LogExporter plugin...");
    this.context.eventBus.subscribe("onExecute", (evt) => {
      this.context.logger.info("Processing execution event: " + evt.id);
    });
  }

  async shutdown() {
    this.context.logger.info("Shutting down LogExporter plugin.");
  }
}
