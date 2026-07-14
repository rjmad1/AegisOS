import { AgentRuntime } from "../../ai-runtime/AgentRuntime";
import { rollbackEngine } from "../RollbackEngine";

export class AgentHandler {
  public async execute(type: string, payload: Record<string, any>, commandId: string): Promise<any> {
    const runtime = AgentRuntime.getInstance();
    const agentId = payload.agentId || payload.id || "";

    if (!agentId) {
      throw new Error("Agent identifier (agentId) is required.");
    }

    const agent = runtime.getAgent(agentId);
    const state = runtime.getAgentState(agentId);

    if (!agent || !state) {
      throw new Error(`Agent ${agentId} is not registered.`);
    }

    switch (type) {
      case "agent:start": {
        const previousState = state.state;
        runtime.updateAgentState(agentId, { state: "idle" });
        
        rollbackEngine.registerInMemoryRollback(commandId, () => {
          runtime.updateAgentState(agentId, { state: previousState });
        });

        return { status: "started", agentId, role: agent.role };
      }

      case "agent:pause": {
        const previousState = state.state;
        runtime.updateAgentState(agentId, { state: "suspended" });

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          runtime.updateAgentState(agentId, { state: previousState });
        });

        return { status: "paused", agentId, role: agent.role };
      }

      case "agent:resume": {
        const previousState = state.state;
        runtime.updateAgentState(agentId, { state: "idle" });

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          runtime.updateAgentState(agentId, { state: previousState });
        });

        return { status: "resumed", agentId, role: agent.role };
      }

      case "agent:terminate": {
        const previousState = state.state;
        runtime.updateAgentState(agentId, { state: "suspended" }); // Simulate termination by suspending it

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          runtime.updateAgentState(agentId, { state: previousState });
        });

        return { status: "terminated", agentId, role: agent.role };
      }

      case "agent:assign_model": {
        const modelId = payload.modelId;
        if (!modelId) throw new Error("modelId is required for model assignment.");

        const previousModels = [...agent.allowedModels];
        if (!agent.allowedModels.includes(modelId)) {
          agent.allowedModels.push(modelId);
        }

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          agent.allowedModels = previousModels;
        });

        return { success: true, agentId, allowedModels: agent.allowedModels };
      }

      case "agent:assign_tools": {
        const tools = payload.tools; // Expect array of string tool IDs
        if (!Array.isArray(tools)) throw new Error("tools must be an array of strings.");

        const previousTools = [...agent.allowedTools];
        agent.allowedTools = tools;

        rollbackEngine.registerInMemoryRollback(commandId, () => {
          agent.allowedTools = previousTools;
        });

        return { success: true, agentId, allowedTools: agent.allowedTools };
      }

      default:
        throw new Error(`Unsupported Agent command type: ${type}`);
    }
  }
}

export const agentHandler = new AgentHandler();
