import prisma from "../../infrastructure/db/prisma";

export class AuditEngine {
  private static instance: AuditEngine | null = null;

  private constructor() {}

  public static getInstance(): AuditEngine {
    if (!AuditEngine.instance) {
      AuditEngine.instance = new AuditEngine();
    }
    return AuditEngine.instance;
  }

  /**
   * Logs a generic command audit action
   */
  public async logEvent(
    commandId: string,
    action: string,
    category: string,
    details: string,
    user?: { id: string; email: string } | null,
    ipAddress: string = "127.0.0.1"
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const formattedDetails = `[CommandID: ${commandId}] ${details}`;

    try {
      // 1. Log to AuditEvent
      await prisma.auditEvent.create({
        data: {
          timestamp,
          eventType: `Command ${action}`,
          userId: user?.id || "system",
          userEmail: user?.email || "system@aegis-os.local",
          ipAddress,
          details: formattedDetails,
        },
      });

      // 2. Log to AuditLogEntry
      await prisma.auditLogEntry.create({
        data: {
          id: `${action.toLowerCase()}-${commandId}-${Date.now()}`,
          timestamp,
          userId: user?.id || "system",
          action: `COMMAND_${action.toUpperCase()}`,
          category,
          details: formattedDetails,
          ipAddress,
        },
      });
    } catch (e: any) {
      console.error("[AuditEngine] Failed to write audit logs:", e.message);
    }
  }

  public async logCommandInitiation(
    commandId: string,
    type: string,
    risk: string,
    user?: { id: string; email: string } | null,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent(
      commandId,
      "initiated",
      "configuration",
      `Command initiated of type '${type}' with risk level '${risk}'.`,
      user,
      ipAddress
    );
  }

  public async logCommandExecutionStart(
    commandId: string,
    type: string,
    user?: { id: string; email: string } | null,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent(
      commandId,
      "execution_started",
      "runtime",
      `Execution worker started processing command '${type}'.`,
      user,
      ipAddress
    );
  }

  public async logCommandCompletion(
    commandId: string,
    type: string,
    durationMs: number,
    user?: { id: string; email: string } | null,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent(
      commandId,
      "completed",
      "runtime",
      `Command '${type}' successfully executed in ${durationMs}ms.`,
      user,
      ipAddress
    );
  }

  public async logCommandFailure(
    commandId: string,
    type: string,
    error: string,
    user?: { id: string; email: string } | null,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent(
      commandId,
      "failed",
      "runtime",
      `Command '${type}' failed. Error: ${error}`,
      user,
      ipAddress
    );
  }

  public async logRollback(
    commandId: string,
    type: string,
    details: string,
    user?: { id: string; email: string } | null,
    ipAddress?: string
  ): Promise<void> {
    await this.logEvent(
      commandId,
      "rollback",
      "reliability",
      `Rollback triggered for command '${type}': ${details}`,
      user,
      ipAddress
    );
  }
}

export const auditEngine = AuditEngine.getInstance();
export default auditEngine;
