import { infrastructureHandler } from "./handlers/InfrastructureHandler";
import { aiRuntimeHandler } from "./handlers/AiRuntimeHandler";
import { agentHandler } from "./handlers/AgentHandler";
import { knowledgeHandler } from "./handlers/KnowledgeHandler";
import { workflowHandler } from "./handlers/WorkflowHandler";
import { systemHandler } from "./handlers/SystemHandler";

export class CommandRouter {
  private static instance: CommandRouter | null = null;

  private constructor() {}

  public static getInstance(): CommandRouter {
    if (!CommandRouter.instance) {
      CommandRouter.instance = new CommandRouter();
    }
    return CommandRouter.instance;
  }

  /**
   * Routes a command dynamically to the appropriate handler and awaits execution
   */
  public async routeAndExecute(
    type: string,
    payload: Record<string, any>,
    commandId: string
  ): Promise<any> {
    if (type.startsWith("infrastructure:")) {
      return infrastructureHandler.execute(type, payload, commandId);
    }
    if (type.startsWith("ai:")) {
      return aiRuntimeHandler.execute(type, payload, commandId);
    }
    if (type.startsWith("agent:")) {
      return agentHandler.execute(type, payload, commandId);
    }
    if (type.startsWith("knowledge:")) {
      return knowledgeHandler.execute(type, payload, commandId);
    }
    if (type.startsWith("workflow:")) {
      return workflowHandler.execute(type, payload, commandId);
    }
    if (type.startsWith("system:")) {
      return systemHandler.execute(type, payload, commandId);
    }

    throw new Error(`CommandRouter: Unknown command type prefix for '${type}'`);
  }
}

export const commandRouter = CommandRouter.getInstance();
export default commandRouter;
