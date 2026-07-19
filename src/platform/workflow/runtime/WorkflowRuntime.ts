import { ExecutionGraph, ExecutionNode, NodeState, WorkflowSnapshot } from '../types';
import { ExecutionNodeRegistry } from './ExecutionNodeRegistry';
import { WorkflowPersistenceManager } from '../persistence/WorkflowPersistenceManager';
import { IExecutionContextProvider, IPlatformResourceManager, IPolicyService } from '../../kernel/types';
import { randomUUID } from 'crypto';

/**
 * The core Workflow Engine.
 * Coordinates DAG traversal, Kernel Service integration, and persistence.
 */
export class WorkflowRuntime {
  constructor(
    private registry: ExecutionNodeRegistry,
    private persistence: WorkflowPersistenceManager,
    private executionProvider: IExecutionContextProvider,
    private resourceManager: IPlatformResourceManager,
    private policyService: IPolicyService
  ) {}

  /**
   * Executes a workflow graph.
   */
  public async execute(graph: ExecutionGraph): Promise<WorkflowSnapshot> {
    const executionId = randomUUID();
    const context = this.executionProvider.create({
      correlationId: executionId,
      operatingMode: 'balanced',
      roles: [],
      securityLabels: []
    });

    return this.executionProvider.runAsync(context, async () => {
      // Initialize state snapshot
      const snapshot: WorkflowSnapshot = {
        workflowId: graph.id,
        executionId,
        graphId: graph.id,
        status: 'running',
        context,
        nodeStates: {},
        variables: {},
        schemaVersion: '1.0',
        timestamp: Date.now()
      };

      await this.persistence.recordEvent({
        id: randomUUID(),
        executionId,
        eventType: 'WorkflowStarted',
        timestamp: Date.now()
      });

      // Simple DAG traversal: keep finding ready nodes and executing them sequentially.
      // (A robust implementation would parallelize this via a Promise pool).
      let madeProgress = false;
      let workflowFailed = false;

      do {
        madeProgress = false;
        
        for (const nodeId of Object.keys(graph.nodes)) {
          const node = graph.nodes[nodeId];
          const state = snapshot.nodeStates[nodeId] || { status: 'pending', attempts: 0 };
          snapshot.nodeStates[nodeId] = state;

          if (state.status === 'completed' || state.status === 'failed') continue;

          // Check if dependencies are met
          const isReady = this.checkDependencies(node, snapshot);
          
          if (isReady && state.status === 'pending') {
            madeProgress = true;
            await this.executeNode(node, context, state, snapshot, executionId);
            
            if (state.status === 'failed') {
               workflowFailed = true;
               break;
            }
          }
        }
      } while (madeProgress && !workflowFailed);

      snapshot.status = workflowFailed ? 'failed' : 'completed';
      snapshot.timestamp = Date.now();
      
      await this.persistence.recordEvent({
        id: randomUUID(),
        executionId,
        eventType: workflowFailed ? 'WorkflowFailed' : 'WorkflowCompleted',
        timestamp: Date.now()
      });

      // Save final checkpoint
      await this.persistence.checkpoint(snapshot);
      
      return snapshot;
    });
  }

  private checkDependencies(node: ExecutionNode, snapshot: WorkflowSnapshot): boolean {
    if (node.dependencies.length === 0) return true;
    for (const dep of node.dependencies) {
      const depState = snapshot.nodeStates[dep.nodeId];
      if (!depState) return false;
      
      if (dep.type === 'success' && depState.status !== 'completed') return false;
      if (dep.type === 'failure' && depState.status !== 'failed') return false;
      if (dep.type === 'completion' && (depState.status !== 'completed' && depState.status !== 'failed')) return false;
    }
    return true;
  }

  private async executeNode(node: ExecutionNode, context: any, state: NodeState, snapshot: WorkflowSnapshot, executionId: string) {
    const executor = this.registry.get(node.executorId);
    
    // Acquire resource token from PRM
    const token = await this.resourceManager.acquireAsync({ tokens: 1 });
    if (!token) {
       throw new Error('Resource acquisition failed (PRM rejected)');
    }

    // Evaluate policy via PPS
    const decision = await this.policyService.evaluateAsync('execute_node', node.type, context);
    if (decision.action === 'deny') {
       token.release();
       throw new Error(`Policy denied execution of node ${node.id}`);
    }

    try {
      await this.persistence.recordEvent({
        id: randomUUID(),
        executionId,
        nodeId: node.id,
        eventType: 'NodeStarted',
        timestamp: Date.now()
      });
      state.status = 'running';
      state.startedAt = Date.now();
      state.attempts++;

      await executor.prepare(node, context);
      const outputs = await executor.execute(node, context, state);
      
      state.status = 'completed';
      state.outputs = outputs;
      state.completedAt = Date.now();

      await this.persistence.recordEvent({
        id: randomUUID(),
        executionId,
        nodeId: node.id,
        eventType: 'NodeCompleted',
        timestamp: Date.now(),
        payload: { outputs }
      });
    } catch (err: any) {
      state.status = 'failed';
      state.error = err.message;
      state.completedAt = Date.now();
      
      await executor.rollback(node, context);

      await this.persistence.recordEvent({
        id: randomUUID(),
        executionId,
        nodeId: node.id,
        eventType: 'NodeFailed',
        timestamp: Date.now(),
        payload: { error: err.message }
      });
    } finally {
      await executor.cleanup(node, context);
      token.release();
    }
  }
}
