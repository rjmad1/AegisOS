import { AgentConfig, AgentState, AgentIntent, ExecutionPlan, SemanticPlanStep } from "./types";
import { IExecutionContext, IExecutionContextProvider } from "../kernel/types";
import { PlanningEngine } from "./PlanningEngine";
import { WorkflowCompiler } from "./WorkflowCompiler";

export class CognitiveLoop {
  private agentConfig: AgentConfig;
  private agentState: AgentState;
  private contextProvider: IExecutionContextProvider;
  private isRunning: boolean = false;

  constructor(
    agentConfig: AgentConfig,
    agentState: AgentState,
    contextProvider: IExecutionContextProvider
  ) {
    this.agentConfig = agentConfig;
    this.agentState = agentState;
    this.contextProvider = contextProvider;
  }

  public async start(objective: string): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // The Cognitive Loop executes inside PECS
    const context = this.contextProvider.create({
      agentId: this.agentConfig.id,
      operatingMode: 'balanced',
      correlationId: `cog-loop-${Date.now()}`
    });

    await this.contextProvider.runAsync(context, async () => {
      try {
        await this.runLoop(objective);
      } catch (err: any) {
        this.agentState.state = "failed";
        this.agentState.metrics.errorCount++;
        console.error(`[CognitiveLoop] Agent ${this.agentConfig.id} failed:`, err);
      } finally {
        this.isRunning = false;
      }
    });
  }

  public stop(): void {
    this.isRunning = false;
    this.agentState.state = "completed";
  }

  private async runLoop(initialObjective: string): Promise<void> {
    this.agentState.state = "initialized";
    // Observe phase
    this.agentState.state = "ready";
    
    // Reason phase
    this.agentState.state = "thinking";
    const intent = await this.reasonIntent(initialObjective);
    
    // Plan phase
    this.agentState.state = "planning";
    const plan = await this.generatePlan(intent);
    
    // Compile Execution Graph
    const compiler = WorkflowCompiler.getInstance();
    const executionGraph = compiler.compile(plan);
    
    // Submit to Workflow Engine
    this.agentState.state = "waiting_for_workflow";
    const workflowResult = await this.submitAndWaitForWorkflow(executionGraph);
    
    // Observe Results & Reflect
    this.agentState.state = "reflecting";
    await this.reflectOnResults(workflowResult);
    
    this.agentState.state = "completed";
  }

  private async reasonIntent(objective: string): Promise<AgentIntent> {
    console.log(`[CognitiveLoop:${this.agentConfig.id}] Reasoning about intent...`);
    // Simulated Reasoning Phase
    return {
      objective,
      constraints: ["No unauthorized data access"],
      successCriteria: ["Completed without errors"],
      assumptions: [],
      risks: [],
      informationGaps: []
    };
  }

  private async generatePlan(intent: AgentIntent): Promise<ExecutionPlan> {
    console.log(`[CognitiveLoop:${this.agentConfig.id}] Generating execution plan...`);
    const planner = PlanningEngine.getInstance();
    return await planner.createPlan(intent.objective, this.agentConfig.allowedTools);
  }

  private async submitAndWaitForWorkflow(executionGraph: any): Promise<any> {
    console.log(`[CognitiveLoop:${this.agentConfig.id}] Submitting ExecutionGraph to Workflow Engine...`);
    // Simulate Workflow Engine execution
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: "success", outputs: {} };
  }

  private async reflectOnResults(result: any): Promise<void> {
    console.log(`[CognitiveLoop:${this.agentConfig.id}] Reflecting on workflow results...`);
    // Simulated Reflection
  }
}
