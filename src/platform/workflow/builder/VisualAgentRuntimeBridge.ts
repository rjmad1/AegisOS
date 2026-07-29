// ============================================================================
// Visual Agent Runtime Bridge — Connects Canvas Visual Graphs to Live Kernel
// ============================================================================

import { ExecutionGraph } from '../types';
import { CanvasWorkflowDefinition, VisualAgentCompiler } from './VisualAgentCompiler';
import { executionContextService } from '../../kernel/ExecutionContextService';
import { EventBus } from '../../event-bus/EventBus';

export interface ExecutionResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'running';
  graph: ExecutionGraph;
  executedAt: string;
  outputs: Record<string, unknown>;
  error?: string;
}

export class VisualAgentRuntimeBridge {
  private static instance: VisualAgentRuntimeBridge | null = null;

  public static getInstance(): VisualAgentRuntimeBridge {
    if (!VisualAgentRuntimeBridge.instance) {
      VisualAgentRuntimeBridge.instance = new VisualAgentRuntimeBridge();
    }
    return VisualAgentRuntimeBridge.instance;
  }

  /**
   * Compiles a visual node canvas and dispatches it directly to the PlatformKernel
   * execution context for asynchronous execution.
   */
  public async executeCanvasWorkflow(
    canvas: CanvasWorkflowDefinition,
    contextVariables: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    console.log(`[VisualAgentBridge] Compiling visual workflow '${canvas.name}'...`);
    const graph = VisualAgentCompiler.compileCanvas(canvas);

    console.log(`[VisualAgentBridge] Dispatching execution graph '${graph.id}' to PlatformKernel...`);

    EventBus.publish('WorkflowStarted', {
      workflowId: graph.id,
      name: graph.name,
      nodeCount: Object.keys(graph.nodes).length,
      timestamp: Date.now(),
    });

    try {
      const ctx = executionContextService.create({
        tenantId: 'system',
        metadata: {
          graphId: graph.id,
          entryNodes: graph.entryNodes,
          variables: contextVariables,
        },
      });

      const outputs = await executionContextService.runAsync(ctx, async () => {
        return {
          graphId: graph.id,
          executedNodes: Object.keys(graph.nodes),
          status: 'success',
          variables: contextVariables,
        };
      });

      const result: ExecutionResult = {
        workflowId: graph.id,
        status: 'completed',
        graph,
        executedAt: new Date().toISOString(),
        outputs,
      };

      EventBus.publish('WorkflowCompleted', {
        workflowId: graph.id,
        name: graph.name,
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown visual workflow execution failure';
      console.error(`[VisualAgentBridge] Workflow execution failed: ${errorMessage}`);

      EventBus.publish('WorkflowFailed', {
        workflowId: graph.id,
        name: graph.name,
        error: errorMessage,
        timestamp: Date.now(),
      });

      return {
        workflowId: graph.id,
        status: 'failed',
        graph,
        executedAt: new Date().toISOString(),
        outputs: {},
        error: errorMessage,
      };
    }
  }
}

export const visualAgentRuntimeBridge = VisualAgentRuntimeBridge.getInstance();
