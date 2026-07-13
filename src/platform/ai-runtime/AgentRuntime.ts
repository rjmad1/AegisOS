import { AgentConfig, AgentState, AIRuntimeContext, AgentLifecycleState } from "./types";

export class AgentRuntime {
  private static instance: AgentRuntime | null = null;
  private agents: Map<string, AgentConfig> = new Map();
  private states: Map<string, AgentState> = new Map();

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
        name: "Research & Search Agent",
        role: "research",
        systemPrompt: "Retrieve knowledge assets and execute web searches to compile accurate facts.",
        allowedModels: ["ollama:llama3.1:8b", "gemini:gemini-1.5-flash"],
        allowedTools: ["tool:web:search", "tool:filesystem:read"],
        permissions: ["fs:read", "network:outbound"],
        isolationLevel: "sandbox",
        version: "1.2.0",
      },
      {
        id: "agent:critic",
        name: "Self-Critique Reviewer Agent",
        role: "critic",
        systemPrompt: "Review plans and execution summaries, detecting security flaws, bias, or quality bugs.",
        allowedModels: ["litellm:claude-3-5-sonnet"],
        allowedTools: [],
        permissions: ["review:publish"],
        isolationLevel: "secure-context",
        version: "1.0.0",
      },
    ];

    for (const a of defaultAgents) {
      this.registerAgent(a);
    }
  }

  public registerAgent(agent: AgentConfig): void {
    this.agents.set(agent.id, agent);
    this.states.set(agent.id, {
      id: agent.id,
      state: "idle",
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

  /**
   * Permissions Guard: Verifies if the agent has the permission to perform an action.
   */
  public verifyPermission(agentId: string, action: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) return false;
    
    // Check direct permission claim or system admin bypass
    return agent.permissions.includes(action) || agent.permissions.includes("*");
  }

  /**
   * Executes a task using the agent model, updating lifecycle states
   * and tracking token usage/costs.
   */
  public async executeAgentTask(agentId: string, task: string, context: AIRuntimeContext): Promise<string> {
    const agent = this.getAgent(agentId);
    const s = this.states.get(agentId);

    if (!agent || !s) {
      throw new Error(`AgentRuntime: Agent "${agentId}" is not registered.`);
    }

    if (s.state === "suspended") {
      throw new Error(`AgentRuntime: Agent "${agentId}" is currently suspended.`);
    }

    // Set status to running
    s.state = "running";
    s.currentTask = task;
    s.metrics.invocations++;

    console.log(`[AgentRuntime] Running Agent: ${agentId} (${agent.role}) | Task: "${task.slice(0, 40)}..."`);

    try {
      // Simulate task execution
      let result = "";
      if (agent.role === "planner") {
        result = `[Plan] 1. Gather context -> 2. Query Knowledge Base -> 3. Generate Report. Confidence: 95%`;
      } else if (agent.role === "research") {
        result = `[Research] Gathered 2 relevant assets for "${task}". Summarized: Workspace conforms to Standard ADR-001 guidelines.`;
      } else if (agent.role === "critic") {
        result = `[Critique] Analyzed plan. Flaw detected: Step 3 has missing VRAM boundaries. Corrected.`;
      } else {
        result = `[Supervisor] Orchestrated workflow. Sub-tasks assigned to planner and researcher completed.`;
      }

      // Track mock metrics (tokens and cost)
      const inputTokens = task.length;
      const outputTokens = result.length;
      const totalTokens = inputTokens + outputTokens;
      
      s.metrics.tokensConsumed += totalTokens;
      s.metrics.runningCostUsd += (totalTokens / 1000) * 0.002; // Mock cost rate

      s.state = "idle";
      s.currentTask = undefined;

      return result;
    } catch (err: any) {
      s.metrics.errorCount++;
      s.state = "idle";
      s.currentTask = undefined;
      console.error(`[AgentRuntime] Agent task failed for ${agentId}:`, err);
      throw err;
    }
  }
}
export default AgentRuntime;
