import prisma from "../../infrastructure/db/prisma";
import { auditEngine } from "./AuditEngine";

export class RollbackEngine {
  private static instance: RollbackEngine | null = null;
  private inMemoryRollbacks: Map<string, () => Promise<any> | any> = new Map();

  private constructor() {}

  public static getInstance(): RollbackEngine {
    if (!RollbackEngine.instance) {
      RollbackEngine.instance = new RollbackEngine();
    }
    return RollbackEngine.instance;
  }

  /**
   * Registers an in-memory rollback handler for the lifetime of the process execution
   */
  public registerInMemoryRollback(commandId: string, action: () => Promise<any> | any): void {
    this.inMemoryRollbacks.set(commandId, action);
  }

  /**
   * Executes rollback undo logic for a specific command
   */
  public async executeRollback(
    commandId: string,
    triggeredBy: string = "system"
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const cmd = await prisma.command.findUnique({
      where: { id: commandId },
    });

    if (!cmd) {
      return { success: false, message: `Command ${commandId} not found.` };
    }

    if (cmd.status !== "COMPLETED" && cmd.status !== "FAILED") {
      return { success: false, message: `Cannot rollback a command in status: ${cmd.status}` };
    }

    await auditEngine.logRollback(
      commandId,
      cmd.type,
      `Rollback execution started by ${triggeredBy}`,
      cmd.userId ? { id: cmd.userId, email: cmd.userEmail || "" } : null
    );

    try {
      // 1. Try running in-memory callback first
      const memHandler = this.inMemoryRollbacks.get(commandId);
      let memResult: any = null;
      if (memHandler) {
        memResult = await memHandler();
        this.inMemoryRollbacks.delete(commandId);
      }

      // 2. Parse and evaluate database payload rollback (reversing command)
      let payloadResult: any = null;
      if (cmd.rollbackPayload) {
        const rollbackInstruction = JSON.parse(cmd.rollbackPayload);
        const { type, payload } = rollbackInstruction;
        
        // Dynamically import CommandRouter to prevent circular imports
        const { commandRouter } = await import("./CommandRouter");
        payloadResult = await commandRouter.routeAndExecute(type, payload, commandId);
      }

      const resultSummary = {
        inMemoryExecuted: !!memHandler,
        memResult,
        payloadResult,
      };

      await prisma.command.update({
        where: { id: commandId },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
          rolledBackBy: triggeredBy,
          rollbackResult: JSON.stringify(resultSummary),
        },
      });

      await auditEngine.logRollback(
        commandId,
        cmd.type,
        `Rollback completed successfully.`,
        cmd.userId ? { id: cmd.userId, email: cmd.userEmail || "" } : null
      );

      return {
        success: true,
        message: "Command rollback executed successfully.",
        data: resultSummary,
      };
    } catch (err: any) {
      console.error(`[RollbackEngine] Rollback failed for command ${commandId}:`, err);
      
      await prisma.command.update({
        where: { id: commandId },
        data: {
          rollbackResult: JSON.stringify({ error: err.message, timestamp: new Date().toISOString() }),
        },
      });

      await auditEngine.logCommandFailure(
        commandId,
        cmd.type,
        `Rollback execution failed: ${err.message}`,
        cmd.userId ? { id: cmd.userId, email: cmd.userEmail || "" } : null
      );

      return {
        success: false,
        message: `Rollback failed: ${err.message}`,
      };
    }
  }
}

export const rollbackEngine = RollbackEngine.getInstance();
export default rollbackEngine;
