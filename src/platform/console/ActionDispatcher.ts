import type { CommandContext, ExecutionResult } from "../commands/types";
import { dispatchToServer } from "./actions";

/**
 * Governed Action Dispatcher
 * The single execution gateway for UI buttons, workflows, and the AI Copilot.
 * Ensures every execution flows through the CommandRegistry and Policy Engine.
 */
export class ConsoleActionDispatcher {
  /**
   * Dispatches an action by its registered Command ID.
   */
  static async dispatch(
    commandId: string, 
    payload: any, 
    context: CommandContext
  ): Promise<ExecutionResult> {
    console.log(`[ActionDispatcher] Dispatching command to Server Action: ${commandId}`);
    
    // Submits to the Durable Execution Platform via Server Action.
    // The UI does not block awaiting backend completion; it receives a durable ExecutionInstance handle.
    return await dispatchToServer(commandId, payload, context);
  }
}
