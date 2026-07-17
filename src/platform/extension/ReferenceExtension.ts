// src/platform/extension/ReferenceExtension.ts
import { INotificationProviderPlugin, IPluginContext } from "../../api/types/plugins";

export class ReferenceConsoleNotificationExtension implements INotificationProviderPlugin {
  id = "com.aegisos.extension.console-notification";
  name = "Console Notification Reference Extension";
  version = "1.0.0";
  description = "A reference extension that prints platform alerts and notifications to the console.";
  author = "Enterprise Platform Team";
  type = "notification-provider" as const;
  channelName = "console";
  signature = "0000000000000000000000000000000000000000000000000000000000000000"; // 64 chars

  private context: IPluginContext | null = null;

  async initialize(context: IPluginContext): Promise<void> {
    this.context = context;
    context.logger.info("Reference Console Notification Extension initialized.");
  }

  async shutdown(): Promise<void> {
    if (this.context) {
      this.context.logger.info("Reference Console Notification Extension shutting down.");
    }
  }

  async deliver(
    title: string,
    message: string,
    severity: "info" | "warning" | "error" | "success"
  ): Promise<boolean> {
    if (!this.context) return false;
    const logFn =
      severity === "error"
        ? this.context.logger.error.bind(this.context.logger)
        : severity === "warning"
        ? this.context.logger.warn.bind(this.context.logger)
        : this.context.logger.info.bind(this.context.logger);

    logFn(`[Notification Delivery] [${severity.toUpperCase()}] ${title}: ${message}`);
    return true;
  }
}
