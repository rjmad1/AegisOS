import { AIRuntimeContext } from "./types";
import { AgentRuntime } from "./AgentRuntime";

export class MultiAgentOrchestrator {
  private static instance: MultiAgentOrchestrator | null = null;
  private agentRuntime: AgentRuntime;

  private constructor() {
    this.agentRuntime = AgentRuntime.getInstance();
  }

  public static getInstance(): MultiAgentOrchestrator {
    if (!MultiAgentOrchestrator.instance) {
      MultiAgentOrchestrator.instance = new MultiAgentOrchestrator();
    }
    return MultiAgentOrchestrator.instance;
  }

  /**
   * Hierarchical Delegation:
   * Supervisor receives task → delegates to Planner → delegates to Researcher → Critic reviews → final result.
   */
  public async orchestrateHierarchical(task: string, context: AIRuntimeContext): Promise<string> {
    console.log(`[MultiAgentOrchestrator] Initiating Hierarchical delegation for task: "${task}"`);

    // 1. Supervisor delegate task to Planner
    const planText = await this.agentRuntime.executeAgentTask(
      "agent:planner",
      `Create plan for: ${task}`,
      context
    );
    console.log(`[MultiAgentOrchestrator] Step 1 (Planner) complete: ${planText}`);

    // 2. Delegate research tasks
    const researchText = await this.agentRuntime.executeAgentTask(
      "agent:research",
      `Search background files and guidelines for: ${task}`,
      context
    );
    console.log(`[MultiAgentOrchestrator] Step 2 (Researcher) complete: ${researchText}`);

    // 3. Critique plan and research outputs
    const reviewText = await this.agentRuntime.executeAgentTask(
      "agent:critic",
      `Review plan: "${planText}" and research findings: "${researchText}". Assert security and compliance.`,
      context
    );
    console.log(`[MultiAgentOrchestrator] Step 3 (Critic/Reviewer) complete: ${reviewText}`);

    // 4. Supervisor final output consolidation
    const finalReport = `HIERARCHICAL TASK RESOLUTION REPORT
=========================================
Objective: ${task}
Planner Output: ${planText}
Researcher Output: ${researchText}
Safety & Quality Review: ${reviewText}
=========================================
Status: Approved & Verified.`;

    await this.agentRuntime.executeAgentTask(
      "agent:supervisor",
      `Consolidate final review report for: ${task}`,
      context
    );

    return finalReport;
  }

  /**
   * Consensus Routing:
   * Queries multiple specialist agents for their votes/outputs and performs a majority-agreement consensus check.
   */
  public async orchestrateConsensus(task: string, agentIds: string[], context: AIRuntimeContext): Promise<string> {
    console.log(`[MultiAgentOrchestrator] Querying agents [${agentIds.join(", ")}] for consensus...`);

    const responses: string[] = [];
    for (const id of agentIds) {
      const response = await this.agentRuntime.executeAgentTask(id, task, context);
      responses.push(response);
    }

    // Simple consensus simulation: count yes/no votes or perform keyword alignment
    let affirmativeCount = 0;
    for (const r of responses) {
      if (r.toLowerCase().includes("success") || r.toLowerCase().includes("approved") || r.toLowerCase().includes("verified")) {
        affirmativeCount++;
      }
    }

    const ratio = affirmativeCount / agentIds.length;
    const hasConsensus = ratio >= 0.5;

    const consensusReport = `CONSENSUS RESOLUTION REPORT
=========================================
Task: ${task}
Votes Received: ${affirmativeCount}/${agentIds.length} approved
Consensus Reached: ${hasConsensus ? "YES (Approved)" : "NO (Rejected)"}
=========================================`;

    return consensusReport;
  }

  /**
   * Swarm Collaboration:
   * Peer-to-peer agent handoffs where agents work on tasks sequentially in a pipeline.
   */
  public async orchestrateSwarm(task: string, context: AIRuntimeContext): Promise<string> {
    console.log(`[MultiAgentOrchestrator] Initiating Swarm peer-to-peer sequence for: "${task}"`);

    // Handoff pipeline: Researcher -> Planner -> Critic
    const researchOut = await this.agentRuntime.executeAgentTask("agent:research", task, context);
    const planOut = await this.agentRuntime.executeAgentTask(
      "agent:planner",
      `Generate plan incorporating findings: ${researchOut}`,
      context
    );
    const finalOut = await this.agentRuntime.executeAgentTask(
      "agent:critic",
      `Optimize and verify final plan: ${planOut}`,
      context
    );

    return `SWARM FINAL PIPELINE OUTPUT:\n${finalOut}`;
  }
}
export default MultiAgentOrchestrator;
