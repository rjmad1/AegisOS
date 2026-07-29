// ============================================================================
// Visual Agent Compiler — Canvas Graph to Execution Graph Compiler
// ============================================================================

import { ExecutionGraph, ExecutionNode, NodeDependency } from '../types';
import { randomUUID } from 'crypto';

export interface VisualNodeData {
  executorId?: string;
  agentRole?: string;
  action?: string;
  configuration?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  outputs?: string[];
  retryMaxAttempts?: number;
  timeoutMs?: number;
}

export interface CanvasNode {
  id: string;
  type: 'agent' | 'task' | 'capability' | 'decision' | 'parallel';
  label: string;
  data: VisualNodeData;
}

export interface CanvasConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionType?: 'success' | 'failure' | 'completion' | 'conditional';
  conditionExpression?: string;
}

export interface CanvasWorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  entryNodeIds?: string[];
  metadata?: Record<string, unknown>;
}

export class VisualAgentCompiler {
  /**
   * Compiles a drag-and-drop Visual Canvas workflow definition into a fully validated,
   * immutable ExecutionGraph ready for consumption by PlatformKernel and WorkflowEngine.
   */
  public static compileCanvas(canvas: CanvasWorkflowDefinition): ExecutionGraph {
    if (!canvas.nodes || canvas.nodes.length === 0) {
      throw new Error('Cannot compile empty visual graph: No canvas nodes provided.');
    }

    const nodeMap: Record<string, ExecutionNode> = {};
    const nodeIds = new Set(canvas.nodes.map((n) => n.id));

    // 1. Build initial ExecutionNode map
    for (const visualNode of canvas.nodes) {
      const executorId =
        visualNode.data.executorId ||
        (visualNode.type === 'agent'
          ? `agent.${visualNode.data.agentRole || 'general'}`
          : visualNode.type === 'capability'
          ? `capability.${visualNode.data.action || 'default'}`
          : visualNode.type === 'parallel'
          ? 'core.parallel'
          : visualNode.type === 'decision'
          ? 'core.decision'
          : 'core.task');

      const node: ExecutionNode = {
        id: visualNode.id,
        type: visualNode.type,
        executorId,
        configuration: visualNode.data.configuration || {},
        inputs: visualNode.data.inputs || {},
        outputs: visualNode.data.outputs || ['default'],
        dependencies: [],
        timeoutMs: visualNode.data.timeoutMs ?? 30000,
        retryPolicy: visualNode.data.retryMaxAttempts
          ? {
              maxAttempts: visualNode.data.retryMaxAttempts,
              backoffInitialMs: 1000,
              backoffMaxMs: 10000,
              backoffMultiplier: 2,
            }
          : undefined,
        metadata: {
          label: visualNode.label,
          compiledAt: new Date().toISOString(),
          agentRole: visualNode.data.agentRole,
        },
      };

      nodeMap[visualNode.id] = node;
    }

    // 2. Wire connections as NodeDependencies (Target depends on Source)
    for (const conn of canvas.connections || []) {
      if (!nodeIds.has(conn.sourceNodeId)) {
        throw new Error(`Invalid connection source: Node '${conn.sourceNodeId}' does not exist.`);
      }
      if (!nodeIds.has(conn.targetNodeId)) {
        throw new Error(`Invalid connection target: Node '${conn.targetNodeId}' does not exist.`);
      }

      const targetNode = nodeMap[conn.targetNodeId];
      const dependency: NodeDependency = {
        nodeId: conn.sourceNodeId,
        type: conn.conditionType || 'success',
        conditionExpression: conn.conditionExpression,
      };

      targetNode.dependencies.push(dependency);
    }

    // 3. Cycle Detection
    VisualAgentCompiler.detectCycles(nodeMap);

    // 4. Infer entry nodes if not explicitly declared
    let entryNodes = [...(canvas.entryNodeIds || [])];
    if (entryNodes.length === 0) {
      for (const nodeId of Object.keys(nodeMap)) {
        if (nodeMap[nodeId].dependencies.length === 0) {
          entryNodes.push(nodeId);
        }
      }
    }

    if (entryNodes.length === 0) {
      throw new Error('Visual graph compilation error: No entry nodes could be identified.');
    }

    return {
      id: canvas.id || randomUUID(),
      version: canvas.version || '1.0.0',
      schemaVersion: '1.0',
      name: canvas.name,
      description: canvas.description || 'Compiled visual agent canvas workflow',
      nodes: nodeMap,
      entryNodes,
      metadata: canvas.metadata || { visualCompiler: true },
    };
  }

  private static detectCycles(nodes: Record<string, ExecutionNode>): void {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string) => {
      if (stack.has(id)) {
        throw new Error(`Cycle detected involving visual node '${id}'. Graph must be acyclic.`);
      }
      if (visited.has(id)) return;

      visited.add(id);
      stack.add(id);

      const node = nodes[id];
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep.nodeId);
        }
      }

      stack.delete(id);
    };

    for (const nodeId of Object.keys(nodes)) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
  }
}
