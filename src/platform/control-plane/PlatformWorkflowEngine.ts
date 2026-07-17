// src/platform/control-plane/PlatformWorkflowEngine.ts
import { WorkflowInstance, WorkflowStep } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import { platformDigitalTwin } from './PlatformDigitalTwin';

export class PlatformWorkflowEngine {
  private static instance: PlatformWorkflowEngine | null = null;
  private activeWorkflows: Map<string, WorkflowInstance> = new Map();
  private history: WorkflowInstance[] = [];

  private constructor() {}

  public static getInstance(): PlatformWorkflowEngine {
    if (!PlatformWorkflowEngine.instance) {
      PlatformWorkflowEngine.instance = new PlatformWorkflowEngine();
    }
    return PlatformWorkflowEngine.instance;
  }

  public getWorkflowStatus(id: string): WorkflowInstance | undefined {
    return this.activeWorkflows.get(id) || this.history.find(w => w.id === id);
  }

  public getHistory(): WorkflowInstance[] {
    return [...this.history];
  }

  public getActiveWorkflows(): WorkflowInstance[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Spawns a workflow instance and coordinates parallel and dependent steps execution.
   */
  public async executeWorkflow(name: string, steps: WorkflowStep[]): Promise<string> {
    const id = `wf-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    
    const instance: WorkflowInstance = {
      id,
      name,
      status: 'pending',
      steps: steps.map(s => ({
        ...s,
        status: 'pending',
        retryCount: 0,
        maxRetries: s.maxRetries || 1,
        timeoutMs: s.timeoutMs || 5000
      }))
    };

    this.activeWorkflows.set(id, instance);
    platformDigitalTwin.registerRunningWorkflow(instance);

    await eventPlatform.publish({
      name: 'WorkflowStarted',
      source: 'workflow-engine',
      payload: { workflowId: id, name, timestamp: Date.now() }
    });

    // Run execution loop asynchronously to avoid blocking API
    this.runWorkflowLoop(id);

    return id;
  }

  private async runWorkflowLoop(id: string): Promise<void> {
    const instance = this.activeWorkflows.get(id);
    if (!instance) return;

    instance.status = 'running';
    instance.startedAt = Date.now();

    let aborted = false;
    const completedSteps: Set<string> = new Set();

    while (!aborted) {
      // Find executable steps (all dependencies are satisfied and step is pending)
      const executable = instance.steps.filter(s => {
        if (s.status !== 'pending') return false;
        if (!s.dependsOn || s.dependsOn.length === 0) return true;
        return s.dependsOn.every(dep => completedSteps.has(dep));
      });

      if (executable.length === 0) {
        // If there are still pending steps but none are executable, we have a cycle or deadlock
        const hasPending = instance.steps.some(s => s.status === 'pending' || s.status === 'running');
        if (hasPending && !instance.steps.some(s => s.status === 'running')) {
          instance.status = 'failed';
          instance.error = 'Deadlock detected: unsatisfied step dependencies.';
          aborted = true;
        } else if (!hasPending) {
          // Completed all steps successfully!
          instance.status = 'completed';
          aborted = true;
        }
        
        if (aborted) break;
        // Wait for active running steps to finish
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      // Execute steps in parallel
      const promises = executable.map(async (step) => {
        step.status = 'running';
        let stepSuccess = false;
        
        while (step.retryCount! <= step.maxRetries!) {
          try {
            // Execution with timeout
            await Promise.race([
              step.action(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Step execution timed out after ${step.timeoutMs}ms`)), step.timeoutMs)
              )
            ]);
            stepSuccess = true;
            break;
          } catch (err: any) {
            step.retryCount!++;
            console.warn(`[WorkflowEngine] Step "${step.name}" failed (attempt ${step.retryCount}/${step.maxRetries! + 1}): ${err.message}`);
            if (step.retryCount! > step.maxRetries!) {
              step.status = 'failed';
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 500 * step.retryCount!)); // linear backoff
          }
        }

        if (stepSuccess) {
          step.status = 'completed';
          completedSteps.add(step.id);
        } else {
          // Trigger rollback action of the step if defined
          if (step.rollbackAction) {
            try {
              console.log(`[WorkflowEngine] Triggering rollback action for step: ${step.name}`);
              await step.rollbackAction();
            } catch (err: any) {
              console.error(`[WorkflowEngine] Rollback failed for step "${step.name}":`, err.message);
            }
          }
          aborted = true;
          instance.status = 'failed';
          instance.error = `Step failed: ${step.name}`;
        }
      });

      await Promise.all(promises);
    }

    instance.completedAt = Date.now();
    this.activeWorkflows.delete(id);
    this.history.push(instance);
    platformDigitalTwin.removeRunningWorkflow(id);

    // Caps logs history to 50 entries
    if (this.history.length > 50) this.history.shift();

    await eventPlatform.publish({
      name: 'WorkflowCompleted',
      source: 'workflow-engine',
      payload: {
        workflowId: id,
        name: instance.name,
        status: instance.status,
        durationMs: instance.completedAt - instance.startedAt!,
        error: instance.error,
        timestamp: Date.now()
      }
    });
  }
}
export const platformWorkflowEngine = PlatformWorkflowEngine.getInstance();
export default platformWorkflowEngine;
