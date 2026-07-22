import { AgentConfig, AgentState, AIRuntimeContext, AgentLifecycleState } from "./types";
import { CognitiveLoop } from "./CognitiveLoop";
import { ExecutionContextService } from "../kernel/ExecutionContextService";

export class AgentRuntime {
  private static instance: AgentRuntime | null = null;
  private agents: Map<string, AgentConfig> = new Map();
  private states: Map<string, AgentState> = new Map();
  private loops: Map<string, CognitiveLoop> = new Map();

  private constructor() {
    this.seedDefaultAgents();
  }

  public static getInstance(): AgentRuntime {
    if (!AgentRuntime.instance) {
      AgentRuntime.instance = new AgentRuntime();
    }
    return AgentRuntime.instance;
  }

  private seedDefaultAgents(): void {
    const defaultAgents: AgentConfig[] = [
      {
        id: "agent:supervisor",
        name: "Enterprise Supervisor Agent",
        role: "supervisor",
        systemPrompt: "You are the manager coordinator. Delegate tasks to planners and researchers, and verify outcomes.",
        allowedModels: ["litellm:gpt-4o", "litellm:claude-3-5-sonnet"],
        allowedTools: ["tool:web:search"],
        permissions: ["agent:delegate", "agent:manage"],
        isolationLevel: "secure-context",
        version: "1.0.0",
      },
      {
        id: "agent:planner",
        name: "Hierarchical Planner Agent",
        role: "planner",
        systemPrompt: "Decompose the objective into sequential plan steps, identifying dependencies and required tools.",
        allowedModels: ["ollama:gemma2:9b", "litellm:gpt-4o"],
        allowedTools: [],
        permissions: ["plan:create"],
        isolationLevel: "sandbox",
        version: "1.0.0",
      },
      {
        id: "agent:research",
        name: "Research Agent",
        role: "research",
        systemPrompt: "Search, summarise and cross-reference external documentation, security advisories, and best-practice guides.",
        allowedModels: ["ollama:llama3.1:8b", "litellm:gpt-4o"],
        allowedTools: ["tool:web:search", "tool:filesystem:read"],
        permissions: ["search:execute"],
        isolationLevel: "sandbox",
        version: "1.0.0",
      }
    ];

    for (const a of defaultAgents) {
      this.registerAgent(a);
    }
  }

  public registerAgent(agent: AgentConfig): void {
    this.agents.set(agent.id, agent);
    this.states.set(agent.id, {
      id: agent.id,
      state: "initialized",
      metrics: {
        invocations: 0,
        tokensConsumed: 0,
        runningCostUsd: 0.0,
        errorCount: 0,
      },
      lastActive: new Date().toISOString(),
    });
  }

  public getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  public getAgentState(id: string): AgentState | undefined {
    return this.states.get(id);
  }

  public getAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  public updateAgentState(id: string, partial: Partial<AgentState>): void {
    const s = this.states.get(id);
    if (s) {
      Object.assign(s, partial);
      s.lastActive = new Date().toISOString();
    }
  }

  public verifyPermission(agentId: string, action: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) return false;
    return agent.permissions.includes(action) || agent.permissions.includes("*");
  }

  /**
   * Starts the agent's autonomous cognitive loop.
   */
  public async startAgent(agentId: string, objective: string): Promise<void> {
    const agent = this.getAgent(agentId);
    const s = this.states.get(agentId);

    if (!agent || !s) {
      throw new Error(`AgentRuntime: Agent "${agentId}" is not registered.`);
    }

    if (s.state === "thinking" || s.state === "planning" || s.state === "waiting_for_workflow") {
      throw new Error(`AgentRuntime: Agent "${agentId}" is already running.`);
    }

    s.metrics.invocations++;
    console.log(`[AgentRuntime] Starting Agent Cognitive Loop: ${agentId} | Objective: "${objective.slice(0, 40)}..."`);

    // In a real implementation, we would inject the context provider
    const contextProvider = new ExecutionContextService(); 
    const loop = new CognitiveLoop(agent, s, contextProvider);
    this.loops.set(agentId, loop);

    // Run autonomously in background
    loop.start(objective).catch(err => {
      console.error(`[AgentRuntime] Unhandled error in agent ${agentId} cognitive loop:`, err);
    });
  }

  public stopAgent(agentId: string): void {
    const loop = this.loops.get(agentId);
    if (loop) {
      loop.stop();
      this.loops.delete(agentId);
    }
  }
}
export default AgentRuntime;
