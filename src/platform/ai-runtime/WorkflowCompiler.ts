import { ExecutionPlan, SemanticPlanStep } from "./types";
import { ExecutionGraph, ExecutionNode, NodeDependency } from "../workflow/types";

export class WorkflowCompiler {
  private static instance: WorkflowCompiler | null = null;

  private constructor() {}

  public static getInstance(): WorkflowCompiler {
    if (!WorkflowCompiler.instance) {
      WorkflowCompiler.instance = new WorkflowCompiler();
    }
    return WorkflowCompiler.instance;
  }

  /**
   * Stage 3: Compiles a semantic ExecutionPlan into a deterministic ExecutionGraph.
   * Resolves node types, capability mappings, and enforces execution boundaries.
   * No LLM participation occurs here.
   */
  public compile(plan: ExecutionPlan): ExecutionGraph {
    console.log(`[WorkflowCompiler] Compiling ExecutionPlan "${plan.id}" into ExecutionGraph`);

    const nodes: Record<string, ExecutionNode> = {};
    const entryNodes: string[] = [];

    // Map semantic steps to specific execution nodes
    plan.steps.forEach((step, index) => {
      const nodeId = `node_${index}_${step.task.replace(/\s+/g, "_").toLowerCase()}`;
      
      const deps: NodeDependency[] = step.dependencies.map(depName => {
        // Resolve dependency name to nodeId (simplistic matching for demonstration)
        const depIndex = plan.steps.findIndex(s => s.task === depName);
        const resolvedId = depIndex !== -1 ? `node_${depIndex}_${depName.replace(/\s+/g, "_").toLowerCase()}` : depName;
        
        return {
          nodeId: resolvedId,
          type: "success"
        };
      });

      if (deps.length === 0) {
        entryNodes.push(nodeId);
      }

      nodes[nodeId] = {
        id: nodeId,
        type: step.requiredCapabilities?.length ? 'capability' : 'task',
        executorId: this.resolveExecutor(step),
        configuration: {
          taskDescription: step.task,
          expectedOutcome: step.expectedOutcome
        },
        inputs: {}, // Inputs bound dynamically at runtime or from context
        outputs: [`${nodeId}_result`],
        dependencies: deps,
        retryPolicy: {
          maxAttempts: 3,
          backoffInitialMs: 1000,
          backoffMaxMs: 10000,
          backoffMultiplier: 2
        },
        checkpointPolicy: {
          enabled: true,
          saveOutputs: true
        },
        metadata: {
          priority: step.priority || "medium",
          originalSemanticTask: step.task
        }
      };
    });

    return {
      id: `graph_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: "1.0.0",
      schemaVersion: "1.0",
      name: `Compiled Workflow for: ${plan.objective.slice(0, 50)}`,
      description: `Compiled from plan ${plan.id}`,
      nodes,
      entryNodes,
      metadata: {
        confidence: plan.confidence,
        compiledAt: Date.now()
      }
    };
  }

  /**
   * Deterministically maps a semantic capability request to a specific Execution Node Registry (ENR) executor.
   */
  private resolveExecutor(step: SemanticPlanStep): string {
    if (step.requiredCapabilities && step.requiredCapabilities.length > 0) {
      const cap = step.requiredCapabilities[0];
      if (cap.startsWith("fs:")) return "executor:filesystem";
      if (cap.startsWith("network:") || cap.startsWith("tool:web")) return "executor:network";
      if (cap.startsWith("knowledge:")) return "executor:knowledge";
    }
    return "executor:generic_compute";
  }
}
export default WorkflowCompiler;
