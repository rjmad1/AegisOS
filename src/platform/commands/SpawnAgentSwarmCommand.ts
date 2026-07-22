import { PlatformCommand } from "./types";
import { CommandRegistry } from "./CommandRegistry";
import { DEP } from "../console/DurableExecutionPlatform";
import { TransactionCoordinator } from "../console/TransactionCoordinator";

export interface SpawnAgentSwarmPayload {
  swarmId: string;
  tenantId: string;
  objective: string;
  agents: string[]; // List of agent profiles to spawn
}

export const SpawnAgentSwarmCommand: PlatformCommand<SpawnAgentSwarmPayload, any> = {
  id: "cmd:cognitive:spawn-swarm",
  title: "Spawn Agentic Swarm",
  description: "Orchestrates an AI agent swarm concurrently via Durable Execution Platform.",
  category: "cognitive",
  auditClassification: "SENSITIVE",

  validate: async (payload) => {
    if (!payload.swarmId || !payload.objective || !payload.agents || payload.agents.length === 0) {
      return "Missing required swarm configuration (swarmId, objective, agents).";
    }
    return true;
  },

  execute: async (payload, context) => {
    console.log(`[SpawnSwarm] Spawning agent swarm '${payload.swarmId}' with ${payload.agents.length} agents for objective: ${payload.objective}`);
    
    const executionIds: string[] = [];
    
    for (const agent of payload.agents) {
      console.log(`[SpawnSwarm] Initializing agent instance: ${agent}`);
      
      // Spawn individual agents using a designated executor command (e.g., cmd:cognitive:execute-agent)
      // This is bounded by the Policy Engine implicitly when DEP executes the command.
      const execution = await DEP.submit(
        "cmd:cognitive:execute-agent", 
        {
          agentProfile: agent,
          objective: payload.objective,
          swarmContext: payload.swarmId
        },
        { tenantId: payload.tenantId }
      );
      
      executionIds.push(execution.id);
      
      // Concurrently process the agent executions via the Transaction Coordinator
      TransactionCoordinator.process(execution.id).catch(err => {
        console.error(`[SpawnSwarm] Agent ${agent} execution failed:`, err);
      });
    }

    return {
      outcome: "SUCCESS",
      data: {
        spawnedAgents: payload.agents.length,
        executionIds: executionIds
      },
      correlationId: `swarm_${payload.swarmId}_${Date.now()}`,
      executionDurationMs: 0
    };
  }
};

// Auto-register upon import
CommandRegistry.register(SpawnAgentSwarmCommand);
