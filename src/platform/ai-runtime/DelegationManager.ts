import { AIRuntimeContext } from "./types";
import { EventBus } from "../event-bus/EventBus";

export interface DelegationRequest {
  taskId: string;
  sourceAgentId: string;
  targetRole: string; // e.g. "planner", "researcher"
  objective: string;
  context: AIRuntimeContext;
}

export interface DelegationResult {
  taskId: string;
  sourceAgentId: string;
  targetAgentId: string;
  status: "success" | "failure";
  resultPayload: string;
}

export class DelegationManager {
  private static instance: DelegationManager | null = null;
  private pendingTasks: Map<string, (value: string) => void> = new Map();

  private constructor() {
    // Subscribe to results from child agents
    EventBus.subscribe('agent:delegation:completed', (payload: unknown) => {
      const result = payload as DelegationResult;
      const resolver = this.pendingTasks.get(result.taskId);
      if (resolver) {
        resolver(result.resultPayload);
        this.pendingTasks.delete(result.taskId);
      }
    });
  }

  public static getInstance(): DelegationManager {
    if (!DelegationManager.instance) {
      DelegationManager.instance = new DelegationManager();
    }
    return DelegationManager.instance;
  }

  /**
   * Delegates a goal to another agent role asynchronously via Message Bus.
   * Does NOT use shared mutable state.
   */
  public async delegate(sourceAgentId: string, targetRole: string, objective: string, context: AIRuntimeContext): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[DelegationManager] Agent ${sourceAgentId} delegating to ${targetRole}. Task: ${taskId}`);

    const request: DelegationRequest = {
      taskId,
      sourceAgentId,
      targetRole,
      objective,
      context
    };

    return new Promise<string>((resolve) => {
      this.pendingTasks.set(taskId, resolve);
      // Publish delegation request to the EventBus
      EventBus.publish('agent:delegation:requested', request, 'high');
    });
  }

  /**
   * Simulates the completion of a delegated task (in a real system, the child agent would publish this).
   */
  public simulateCompletion(taskId: string, sourceAgentId: string, targetAgentId: string, resultPayload: string): void {
    const result: DelegationResult = {
      taskId,
      sourceAgentId,
      targetAgentId,
      status: "success",
      resultPayload
    };
    EventBus.publish('agent:delegation:completed', result, 'normal');
  }
}
export default DelegationManager;
