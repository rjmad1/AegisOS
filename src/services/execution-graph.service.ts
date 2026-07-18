import * as crypto from "crypto";
import { ExecutionGraph, ExecutionGraphNode, ExecutionGraphEdge, ExecutionNodeType } from "../types/execution-graph";
import { executionRuntimeService, UniversalExecution } from "./execution-runtime.service";
import { workflowService } from "./workflow.service";
import { hardenedEventBus } from "../infrastructure/events/event-bus";
import { EventBus } from "../platform/event-bus/EventBus";

class ExecutionQueue {
  private static queues = new Map<string, Promise<any>>();

  public static enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(key) || Promise.resolve();
    const next = prev.then(fn).catch(fn);
    this.queues.set(key, next);
    return next;
  }
}

export class ExecutionGraphService {
  private static instance: ExecutionGraphService | null = null;

  private constructor() {}

  public static getInstance(): ExecutionGraphService {
    if (!ExecutionGraphService.instance) {
      ExecutionGraphService.instance = new ExecutionGraphService();
    }
    return ExecutionGraphService.instance;
  }

  /**
   * Builds an execution graph from a UniversalExecution context.
   */
  public buildGraph(execution: UniversalExecution): ExecutionGraph {
    // Return existing graph if already built
    if (execution.metadata?.executionGraph) {
      return execution.metadata.executionGraph;
    }

    const nodes: ExecutionGraphNode[] = [];
    const edges: ExecutionGraphEdge[] = [];
    const executionId = execution.executionId;
    const now = new Date().toISOString();

    // 1. Initial classification and routing nodes
    const intentNode: ExecutionGraphNode = {
      id: `${executionId}-intent`,
      name: `Intent Classification`,
      type: "Intent",
      status: "queued",
      config: { intent: execution.intent },
      retryCount: 0,
      maxRetries: 3,
    };

    const capabilityNode: ExecutionGraphNode = {
      id: `${executionId}-capability`,
      name: `Capability Routing`,
      type: "Capability",
      status: "queued",
      config: { capability: execution.capability },
      retryCount: 0,
      maxRetries: 3,
    };

    nodes.push(intentNode, capabilityNode);
    edges.push({
      id: `edge-${crypto.randomUUID().slice(0, 8)}`,
      source: intentNode.id,
      target: capabilityNode.id,
      type: "sequential",
      status: "pending",
    });

    let lastNodeId = capabilityNode.id;

    // 2. Add operational node based on context
    if (execution.workflowReference?.workflowId) {
      // Existing Workflow: automatically becomes a single-node execution graph
      const workflowNode: ExecutionGraphNode = {
        id: `${executionId}-workflow`,
        name: `Workflow Execution: ${execution.workflowReference.workflowId}`,
        type: "Workflow",
        status: "queued",
        config: { workflowReference: execution.workflowReference },
        retryCount: 0,
        maxRetries: execution.maxRetries || 3,
      };

      nodes.push(workflowNode);
      edges.push({
        id: `edge-${crypto.randomUUID().slice(0, 8)}`,
        source: lastNodeId,
        target: workflowNode.id,
        type: "sequential",
        status: "pending",
      });
      lastNodeId = workflowNode.id;
    } else if (execution.executionPlan && execution.executionPlan.steps && execution.executionPlan.steps.length > 0) {
      // Has steps in the plan: Map them to the graph sequentially
      for (let i = 0; i < execution.executionPlan.steps.length; i++) {
        const step = execution.executionPlan.steps[i];
        const stepNode: ExecutionGraphNode = {
          id: `${executionId}-step-${i + 1}`,
          name: step.description,
          type: "Tool", // Represents executing a specific platform operation / tool
          status: "queued",
          config: {
            commandType: step.commandType,
            payload: step.payload,
            estimatedDurationMs: step.estimatedDurationMs,
            riskLevel: step.riskLevel,
          },
          retryCount: 0,
          maxRetries: 3,
        };

        nodes.push(stepNode);
        edges.push({
          id: `edge-${crypto.randomUUID().slice(0, 8)}`,
          source: lastNodeId,
          target: stepNode.id,
          type: "sequential",
          status: "pending",
        });
        lastNodeId = stepNode.id;
      }

      // Finally end with an Agent summary node
      const agentNode: ExecutionGraphNode = {
        id: `${executionId}-agent`,
        name: `Agent Summary`,
        type: "Agent",
        status: "queued",
        config: { agentId: "assistant" },
        retryCount: 0,
        maxRetries: 3,
      };

      nodes.push(agentNode);
      edges.push({
        id: `edge-${crypto.randomUUID().slice(0, 8)}`,
        source: lastNodeId,
        target: agentNode.id,
        type: "sequential",
        status: "pending",
      });
    } else {
      // Simple direct chat or general execution: Intent -> Capability -> Agent
      const agentNode: ExecutionGraphNode = {
        id: `${executionId}-agent`,
        name: `Agent Execution`,
        type: "Agent",
        status: "queued",
        config: { agentId: "assistant" },
        retryCount: 0,
        maxRetries: 3,
      };

      nodes.push(agentNode);
      edges.push({
        id: `edge-${crypto.randomUUID().slice(0, 8)}`,
        source: lastNodeId,
        target: agentNode.id,
        type: "sequential",
        status: "pending",
      });
    }

    const graph: ExecutionGraph = {
      executionId,
      nodes,
      edges,
      status: "pending",
      createdAt: now,
      variables: {},
    };

    execution.metadata = {
      ...execution.metadata,
      executionGraph: graph,
    };

    return graph;
  }

  /**
   * Schedules graph execution and triggers ready nodes.
   */
  public async schedule(executionId: string): Promise<UniversalExecution> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) throw new Error(`Execution ${executionId} not found`);

    let graph = execution.metadata?.executionGraph;
    if (!graph) {
      graph = this.buildGraph(execution);
    }

    if (graph.status === "pending") {
      graph.status = "running";
      graph.startedAt = new Date().toISOString();
      execution.status = "RUNNING";
      execution.startedAt = graph.startedAt;
      await (executionRuntimeService as any).repository.save(execution);
      await executionRuntimeService.recordTimelineEvent(executionId, "Started", "system:graph-scheduler", "execution-graph");
    }

    await this.tick(executionId);
    return execution;
  }

  /**
   * Evaluates graph execution logic: resolves edge conditions, handles parallel forks, detects completion.
   */
  public async tick(executionId: string): Promise<void> {
    return ExecutionQueue.enqueue(executionId, async () => {
      const execution = await executionRuntimeService.getExecution(executionId);
      if (!execution) return;

      const graph = execution.metadata?.executionGraph as ExecutionGraph;
      if (!graph || graph.status !== "running") return;

      // Sync edges for completed nodes in case of crash state inconsistency
      for (const node of graph.nodes) {
        if (node.status === "completed") {
          const outgoing = graph.edges.filter((e) => e.source === node.id && e.status === "pending" && e.type !== "conditional");
          for (const edge of outgoing) {
            edge.status = "traversed";
          }
        } else if (node.status === "failed" || node.status === "cancelled") {
          const outgoing = graph.edges.filter((e) => e.source === node.id && e.status === "pending" && e.type !== "conditional");
          for (const edge of outgoing) {
            if (edge.type === "failure" || edge.type === "recovery") {
              edge.status = "traversed";
            } else {
              edge.status = "skipped";
            }
          }
        }
      }

      // Prune paths by evaluating conditional edges downstream of completed nodes
      this.evaluateConditionalEdges(graph);

      // Identify ready nodes
      const readyNodes = graph.nodes.filter((node) => {
        if (node.status !== "queued") return false;

        // Find all incoming edges
        const incomingEdges = graph.edges.filter((e) => e.target === node.id);
        if (incomingEdges.length === 0) return true; // Start node

        // Separate incoming edges by type
        const normalEdges = incomingEdges.filter((e) => e.type !== "failure" && e.type !== "recovery");
        const failureRecoveryEdges = incomingEdges.filter((e) => e.type === "failure" || e.type === "recovery");

        // Check if any incoming edge is skipped.
        // If a node is downstream of a skipped conditional branch, it gets skipped.
        const hasSkippedIncoming = incomingEdges.some((e) => e.status === "skipped");
        if (hasSkippedIncoming) {
          node.status = "cancelled";
          node.error = "Pruned by conditional branch routing";
          this.skipOutgoingEdges(graph, node.id);
          return false;
        }

        // Normal execution criteria: all incoming normal edges must be traversed.
        if (normalEdges.length > 0) {
          const allNormalTraversed = normalEdges.every((e) => e.status === "traversed");
          if (allNormalTraversed) return true;
        }

        // Failure/Recovery execution criteria: at least one failure/recovery edge is traversed
        if (failureRecoveryEdges.length > 0) {
          const anyFailureTraversed = failureRecoveryEdges.some((e) => e.status === "traversed");
          if (anyFailureTraversed) return true;
        }

        return false;
      });

      if (readyNodes.length > 0) {
        // Execute all ready nodes concurrently
        await Promise.all(readyNodes.map((node) => this.runNode(executionId, node.id)));
      } else {
        // Check if graph has finished
        const allDone = graph.nodes.every(
          (n) => n.status === "completed" || n.status === "failed" || n.status === "cancelled"
        );

        if (executionId.includes("e99d6ded") || true) { // debug all
           console.log(`[DEBUG tick] readyNodes.length=0. allDone=${allDone}. node statuses:`, graph.nodes.map(n => `${n.id}:${n.status}`).join(", "));
        }

        if (allDone) {
          const anyFatalFailure = graph.nodes.some((n) => {
            if (n.status !== "failed") return false;
            // Check if this failed node has a traversed recovery/failure edge
            const recoveryEdges = graph.edges.filter(e => e.source === n.id && (e.type === "recovery" || e.type === "failure"));
            const wasRecovered = recoveryEdges.some(e => e.status === "traversed" || e.status === "skipped");
            // If it has no recovery edges, or they weren't used, it's a fatal failure
            return !wasRecovered;
          });

          const now = new Date().toISOString();
          graph.endedAt = now;

          if (anyFatalFailure) {
            graph.status = "failed";
            console.log(`[DEBUG tick] saving failed graph...`);
            await (executionRuntimeService as any).repository.save(execution);
            console.log(`[DEBUG tick] calling failExecution...`);
            await executionRuntimeService.failExecution(executionId, "One or more graph nodes failed execution.");
            console.log(`[DEBUG tick] failExecution completed.`);
          } else {
            graph.status = "completed";
            console.log(`[DEBUG tick] saving completed graph...`);
            await (executionRuntimeService as any).repository.save(execution);
            console.log(`[DEBUG tick] calling completeExecution...`);
            await executionRuntimeService.completeExecution(executionId);
            console.log(`[DEBUG tick] completeExecution completed.`);
          }
        }
      }
    });
  }

  /**
   * Executes a single node's action through the ExecutionRuntimeService.
   */
  private async runNode(executionId: string, nodeId: string): Promise<void> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution) return;

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    node.status = "running";
    node.startedAt = new Date().toISOString();
    
    // Add step to execution for backwards-compatible progression tracking
    execution.steps.push({
      id: node.id,
      executionId,
      name: node.name,
      status: "running",
      timestamp: node.startedAt,
      message: `Node type '${node.type}' running under graph orchestrator.`,
    } as any);

    await (executionRuntimeService as any).repository.save(execution);
    await executionRuntimeService.recordTimelineEvent(executionId, "Tool Invoked", `node:${node.type}`, "execution-graph", { nodeId: node.id });
    
    try {
      // Route node execution to ExecutionRuntimeService
      const output = await (executionRuntimeService as any).executeNode(executionId, node);
      
      const freshExec = await executionRuntimeService.getExecution(executionId);
      if (!freshExec) return;
      const freshGraph = freshExec.metadata.executionGraph as ExecutionGraph;
      const freshNode = freshGraph.nodes.find((n) => n.id === nodeId);
      if (!freshNode) return;

      freshNode.status = "completed";
      freshNode.endedAt = new Date().toISOString();
      freshNode.durationMs = Date.now() - new Date(freshNode.startedAt || Date.now()).getTime();
      freshNode.output = output;

      // Update variables with node output for conditional expression bindings
      freshGraph.variables[`output_${freshNode.id}`] = output;
      if (typeof output === "object") {
        Object.assign(freshGraph.variables, output);
      }

      // Update corresponding step
      const step = freshExec.steps.find((s) => s.id === freshNode.id);
      if (step) {
        step.status = "completed";
        (step as any).durationMs = freshNode.durationMs;
        step.message = `Successfully completed. Output keys: ${Object.keys(output || {}).join(", ")}`;
      }

      // Traverse sequential and normal outgoing edges
      const outgoing = freshGraph.edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        if (edge.type === "conditional") {
          continue; // Evaluated dynamically in tick()
        }
        if (edge.type !== "failure" && edge.type !== "recovery") {
          edge.status = "traversed";
        } else {
          edge.status = "skipped"; // Skip error branches on success
        }
      }

      await (executionRuntimeService as any).repository.save(freshExec);
      await executionRuntimeService.recordTimelineEvent(executionId, "Checkpoint", "system:graph-scheduler", "execution-graph", { node: freshNode.id, status: "completed" });
      
      // Continue scheduling
      this.tick(executionId).catch((err) =>
        console.error("[ExecutionGraphService] Failed to schedule next nodes after node success:", err)
      );

    } catch (err: any) {
      if (err.message === "WAITING_FOR_APPROVAL") {
        return;
      }
      console.error(`[ExecutionGraphService] Node execution failed for ${nodeId}:`, err.message);

      const freshExec = await executionRuntimeService.getExecution(executionId);
      if (!freshExec) return;
      const freshGraph = freshExec.metadata.executionGraph as ExecutionGraph;
      const freshNode = freshGraph.nodes.find((n) => n.id === nodeId);
      if (!freshNode) return;

      if (freshNode.retryCount < freshNode.maxRetries) {
        freshNode.retryCount++;
        freshNode.status = "queued";
        const step = freshExec.steps.find((s) => s.id === freshNode.id);
        if (step) {
          step.status = "queued";
          step.message = `Attempt failed: ${err.message}. Retrying (${freshNode.retryCount}/${freshNode.maxRetries})...`;
        }
        await (executionRuntimeService as any).repository.save(freshExec);
        await executionRuntimeService.recordTimelineEvent(executionId, "Retry", "system:graph-scheduler", "execution-graph", { node: freshNode.id, attempt: freshNode.retryCount });
        
        // Wait and retry
        setTimeout(() => this.tick(executionId), 100);
      } else {
        freshNode.status = "failed";
        freshNode.endedAt = new Date().toISOString();
        freshNode.error = err.message;

        const step = freshExec.steps.find((s) => s.id === freshNode.id);
        if (step) {
          step.status = "failed";
          step.message = `Failed with error: ${err.message}`;
        }

        // Set up failure / recovery path traversal
        const outgoing = freshGraph.edges.filter((e) => e.source === nodeId);
        let recoveryTriggered = false;

        for (const edge of outgoing) {
          if (edge.type === "failure" || edge.type === "recovery") {
            edge.status = "traversed";
            recoveryTriggered = true;
          } else {
            edge.status = "skipped"; // Skip success paths
          }
        }

        if (recoveryTriggered) {
          await (executionRuntimeService as any).repository.save(freshExec);
          await executionRuntimeService.recordTimelineEvent(executionId, "Recovered", "system:graph-scheduler", "execution-graph", { node: freshNode.id, message: "Triggering recovery branch" });
          this.tick(executionId).catch((err) =>
            console.error("[ExecutionGraphService] Failed to schedule next nodes after recovery trigger:", err)
          );
        } else {
          // No recovery branch, fail graph
          await (executionRuntimeService as any).repository.save(freshExec);
          this.tick(executionId).catch((err) =>
            console.error("[ExecutionGraphService] Failed to schedule next nodes after execution failure:", err)
          );
        }
      }
    }
  }

  /**
   * Scans graph for conditional edges and evaluates their JS conditional expressions.
   */
  private evaluateConditionalEdges(graph: ExecutionGraph): void {
    for (const edge of graph.edges) {
      if (edge.type === "conditional" && edge.condition && edge.status === "pending") {
        const sourceNode = graph.nodes.find((n) => n.id === edge.source);
        if (sourceNode && sourceNode.status === "completed") {
          const satisfies = this.evaluateCondition(edge.condition, graph.variables);
          if (satisfies) {
            edge.status = "traversed";
          } else {
            edge.status = "skipped";
            this.skipOutgoingEdges(graph, edge.target);
          }
        }
      }
    }
  }

  /**
   * Helper to evaluate custom conditional expressions safely.
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      const keys = Object.keys(variables).filter((k) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k));
      const vals = keys.map((k) => variables[k]);
      const fn = new Function(...keys, `return (${condition});`);
      return !!fn(...vals);
    } catch (err) {
      console.error("[ExecutionGraphService] Condition evaluation error:", err);
      return false;
    }
  }

  /**
   * Recursively marks downstream edges and nodes as skipped when a conditional branch is not taken.
   */
  private skipOutgoingEdges(graph: ExecutionGraph, nodeId: string): void {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node && node.status === "queued") {
      node.status = "cancelled";
      node.error = "Pruned by conditional branch routing";
    }

    const outgoing = graph.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoing) {
      if (edge.status === "pending") {
        edge.status = "skipped";
        this.skipOutgoingEdges(graph, edge.target);
      }
    }
  }

  /**
   * Merges a subgraph into a parent execution graph by inserting it at targetNodeId.
   */
  public mergeGraphs(parentGraph: ExecutionGraph, childGraph: ExecutionGraph, targetNodeId: string): void {
    // 1. Find the target node to replace/inject
    const targetIdx = parentGraph.nodes.findIndex((n) => n.id === targetNodeId);
    if (targetIdx === -1) return;

    // Prune target node from parent
    parentGraph.nodes.splice(targetIdx, 1);

    // 2. Find incoming and outgoing edges of targetNodeId in parent
    const incomingEdges = parentGraph.edges.filter((e) => e.target === targetNodeId);
    const outgoingEdges = parentGraph.edges.filter((e) => e.source === targetNodeId);

    // Remove these edges from the parent's edge pool
    parentGraph.edges = parentGraph.edges.filter((e) => e.source !== targetNodeId && e.target !== targetNodeId);

    // 3. Prefix child graph nodes and edges to avoid collisions
    const prefix = `sub-${crypto.randomUUID().slice(0, 4)}-`;
    const prefixedNodes = childGraph.nodes.map((node) => ({
      ...node,
      id: prefix + node.id,
    }));

    const prefixedEdges = childGraph.edges.map((edge) => ({
      ...edge,
      id: prefix + edge.id,
      source: prefix + edge.source,
      target: prefix + edge.target,
    }));

    // Add nodes to parent
    parentGraph.nodes.push(...prefixedNodes);
    parentGraph.edges.push(...prefixedEdges);

    // 4. Connect parent incoming edges to child start nodes (nodes in child with no incoming edges)
    const childIncomingCounts = prefixedNodes.reduce((acc, n) => {
      acc[n.id] = prefixedEdges.filter((e) => e.target === n.id).length;
      return acc;
    }, {} as Record<string, number>);

    const childStarts = prefixedNodes.filter((n) => childIncomingCounts[n.id] === 0);

    for (const parentEdge of incomingEdges) {
      for (const startNode of childStarts) {
        parentGraph.edges.push({
          ...parentEdge,
          id: `edge-${crypto.randomUUID().slice(0, 8)}`,
          target: startNode.id,
        });
      }
    }

    // 5. Connect child end nodes (nodes in child with no outgoing edges) to parent outgoing edges
    const childOutgoingCounts = prefixedNodes.reduce((acc, n) => {
      acc[n.id] = prefixedEdges.filter((e) => e.source === n.id).length;
      return acc;
    }, {} as Record<string, number>);

    const childEnds = prefixedNodes.filter((n) => childOutgoingCounts[n.id] === 0);

    for (const parentEdge of outgoingEdges) {
      for (const endNode of childEnds) {
        parentGraph.edges.push({
          ...parentEdge,
          id: `edge-${crypto.randomUUID().slice(0, 8)}`,
          source: endNode.id,
        });
      }
    }

    // Merge variables
    Object.assign(parentGraph.variables, childGraph.variables);
  }

  /**
   * Dynamically inserts a node after a specific source node in the graph.
   */
  public insertNode(graph: ExecutionGraph, sourceNodeId: string, newNode: ExecutionGraphNode): void {
    graph.nodes.push(newNode);

    // Find all outgoing edges from sourceNodeId that are not failure/recovery branches
    const outgoing = graph.edges.filter((e) => e.source === sourceNodeId && e.type !== "failure" && e.type !== "recovery");

    // Redirect them to spring from the new node
    for (const edge of outgoing) {
      edge.source = newNode.id;
    }

    // Add new edge from source node to the new node
    graph.edges.push({
      id: `edge-${crypto.randomUUID().slice(0, 8)}`,
      source: sourceNodeId,
      target: newNode.id,
      type: "sequential",
      status: "pending",
    });
  }

  /**
   * Returns the static dependency DAG of the execution graph.
   */
  public async getDependencyGraph(executionId: string): Promise<{ nodes: any[]; edges: any[] }> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return { nodes: [], edges: [] };
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    return {
      nodes: graph.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })),
      edges: graph.edges.map((e) => ({ source: e.source, target: e.target, type: e.type })),
    };
  }

  /**
   * Returns progress graph data annotated with current statuses, durations, and output previews.
   */
  public async getProgressGraph(executionId: string): Promise<{ nodes: any[]; edges: any[]; progressPercentage: number }> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return { nodes: [], edges: [], progressPercentage: 0 };
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    const completed = graph.nodes.filter((n) => n.status === "completed" || n.status === "cancelled").length;
    const progressPercentage = Math.round((completed / graph.nodes.length) * 100);

    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        status: n.status,
        durationMs: n.durationMs,
        error: n.error,
        outputKeys: n.output ? Object.keys(n.output) : [],
      })),
      edges: graph.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        status: e.status,
      })),
      progressPercentage,
    };
  }

  /**
   * Calculates the critical path of the graph (longest execution path based on node durations).
   */
  public async getCriticalPath(executionId: string): Promise<string[]> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return [];
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    // 1. Perform a topological sort on nodes
    const topoOrder = this.topologicalSort(graph);
    if (topoOrder.length === 0) return [];

    // Distances map and predecessors map
    const dist: Record<string, number> = {};
    const pred: Record<string, string | null> = {};

    for (const node of graph.nodes) {
      dist[node.id] = node.status === "completed" ? (node.durationMs || 50) : 50; // estimate 50ms fallback
      pred[node.id] = null;
    }

    // Relax edges in topological order
    for (const u of topoOrder) {
      const outgoing = graph.edges.filter((e) => e.source === u && e.status !== "skipped");
      for (const edge of outgoing) {
        const v = edge.target;
        const weight = graph.nodes.find((n) => n.id === v)?.durationMs || 50;
        if (dist[u] + weight > dist[v]) {
          dist[v] = dist[u] + weight;
          pred[v] = u;
        }
      }
    }

    // Find the node with the maximum distance
    let endNodeId = topoOrder[0];
    let maxDist = dist[endNodeId];
    for (const node of graph.nodes) {
      if (dist[node.id] > maxDist) {
        maxDist = dist[node.id];
        endNodeId = node.id;
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = endNodeId;
    while (curr) {
      path.unshift(curr);
      curr = pred[curr];
    }

    return path;
  }

  /**
   * Identifies all sets of nodes that can run in parallel concurrently.
   */
  public async getParallelBranches(executionId: string): Promise<string[][]> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return [];
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    // A simple heuristic: find nodes that have the same predecessor and aren't directly connected
    const branches: string[][] = [];
    for (const node of graph.nodes) {
      const incoming = graph.edges.filter((e) => e.target === node.id);
      if (incoming.length > 0) {
        const pred = incoming[0].source;
        const siblings = graph.nodes.filter(
          (n) => n.id !== node.id && graph.edges.some((e) => e.source === pred && e.target === n.id)
        );
        if (siblings.length > 0) {
          const branchGroup = [node.id, ...siblings.map((s) => s.id)].sort();
          if (!branches.some((g) => JSON.stringify(g) === JSON.stringify(branchGroup))) {
            branches.push(branchGroup);
          }
        }
      }
    }

    return branches;
  }

  /**
   * Returns failure and recovery branches in the graph.
   */
  public async getRecoveryGraph(executionId: string): Promise<{ nodes: any[]; edges: any[] }> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return { nodes: [], edges: [] };
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    const recoveryEdges = graph.edges.filter((e) => e.type === "failure" || e.type === "recovery");
    const recoveryNodeIds = new Set<string>();

    for (const edge of recoveryEdges) {
      recoveryNodeIds.add(edge.source);
      recoveryNodeIds.add(edge.target);
    }

    return {
      nodes: graph.nodes
        .filter((n) => recoveryNodeIds.has(n.id))
        .map((n) => ({ id: n.id, name: n.name, type: n.type, status: n.status })),
      edges: recoveryEdges.map((e) => ({ source: e.source, target: e.target, type: e.type, status: e.status })),
    };
  }

  /**
   * Helper to perform topological sorting of execution graph nodes.
   */
  private topologicalSort(graph: ExecutionGraph): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const outgoing = graph.edges.filter((e) => e.source === nodeId);
      for (const edge of outgoing) {
        visit(edge.target);
      }
      stack.push(nodeId);
    };

    // Find roots (no incoming edges)
    const incomingCounts = graph.nodes.reduce((acc, n) => {
      acc[n.id] = graph.edges.filter((e) => e.target === n.id).length;
      return acc;
    }, {} as Record<string, number>);

    const roots = graph.nodes.filter((n) => incomingCounts[n.id] === 0);
    for (const root of roots) {
      visit(root.id);
    }

    // In case there are disconnected components
    for (const node of graph.nodes) {
      visit(node.id);
    }

    return stack.reverse();
  }

  /**
   * Returns a Mermaid visualization of the graph colored by status.
   */
  public async visualizeGraphMermaid(executionId: string): Promise<string> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return "graph TD\n  EmptyGraph[Empty Graph]";
    const graph = execution.metadata.executionGraph as ExecutionGraph;

    let mermaid = "graph TD\n";

    // Style classes
    mermaid += "  classDef completed fill:#4caf50,stroke:#388e3c,stroke-width:2px,color:#fff;\n";
    mermaid += "  classDef running fill:#2196f3,stroke:#1976d2,stroke-width:2px,color:#fff;\n";
    mermaid += "  classDef failed fill:#f44336,stroke:#d32f2f,stroke-width:2px,color:#fff;\n";
    mermaid += "  classDef waiting fill:#ff9800,stroke:#f57c00,stroke-width:2px,color:#fff;\n";
    mermaid += "  classDef cancelled fill:#9e9e9e,stroke:#616161,stroke-width:2px,color:#fff;\n";
    mermaid += "  classDef queued fill:#e0e0e0,stroke:#9e9e9e,stroke-width:1px,color:#333;\n";

    // Nodes
    for (const node of graph.nodes) {
      const sanitizedName = node.name.replace(/["()]/g, "");
      mermaid += `  ${node.id}["${sanitizedName} (${node.type})"]\n`;
      mermaid += `  class ${node.id} ${node.status};\n`;
    }

    // Edges
    for (const edge of graph.edges) {
      let arrow = "-->";
      if (edge.type === "conditional") {
        arrow = `-. ${edge.condition || "condition"} .->`;
      } else if (edge.type === "failure" || edge.type === "recovery") {
        arrow = `== ${edge.type} ==>`;
      }
      mermaid += `  ${edge.source} ${arrow} ${edge.target}\n`;
    }

    return mermaid;
  }
}

export const executionGraphService = ExecutionGraphService.getInstance();
export default executionGraphService;
