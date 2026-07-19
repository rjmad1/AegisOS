import { ExecutionGraph, ExecutionNode } from '../types';
import { WorkflowBuilder } from './WorkflowBuilder';
import { randomUUID } from 'crypto';

export class WorkflowCompiler {
  /**
   * Compiles a WorkflowBuilder definition into an immutable ExecutionGraph.
   * Performs validation including cycle detection and dependency resolution.
   */
  public static compile(builder: WorkflowBuilder): ExecutionGraph {
    const def = builder.getDefinition();
    const nodes = def.nodes;
    let entryNodes = [...def.entryNodes];

    // 1. Validate all referenced dependencies actually exist in the graph
    for (const node of Object.values(nodes)) {
      for (const dep of node.dependencies) {
        if (!nodes[dep.nodeId]) {
          throw new Error(`Node '${node.id}' depends on non-existent node '${dep.nodeId}'.`);
        }
      }
    }

    // 2. Cycle Detection
    WorkflowCompiler.detectCycles(nodes);

    // 3. If entryNodes is empty, infer them by finding nodes with no inbound dependencies
    if (entryNodes.length === 0) {
      for (const nodeId of Object.keys(nodes)) {
        const node = nodes[nodeId];
        if (node.dependencies.length === 0) {
          entryNodes.push(nodeId);
        }
      }
    }

    if (entryNodes.length === 0 && Object.keys(nodes).length > 0) {
      throw new Error("Cannot compile workflow: No entry nodes defined and none could be inferred.");
    }

    // 4. Construct ExecutionGraph
    return {
      id: randomUUID(),
      version: def.version,
      schemaVersion: '1.0',
      name: def.name,
      description: def.description,
      nodes,
      entryNodes,
      metadata: def.metadata,
    };
  }

  /**
   * Detects cycles by tracking the recursion stack during a depth-first traversal of dependencies.
   */
  private static detectCycles(nodes: Record<string, ExecutionNode>): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string) => {
      if (recursionStack.has(nodeId)) {
        throw new Error(`Cycle detected involving node '${nodeId}'. Workflow graphs must be acyclic.`);
      }
      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes[nodeId];
      if (node) {
        for (const dep of node.dependencies) {
          dfs(dep.nodeId);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of Object.keys(nodes)) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
  }
}
