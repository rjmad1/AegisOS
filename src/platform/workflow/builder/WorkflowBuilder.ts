import { ExecutionNode, NodeDependency, RetryPolicy, CheckpointPolicy } from '../types';

/**
 * Fluent API for constructing workflow nodes.
 */
export class NodeBuilder {
  private node: ExecutionNode;

  private constructor(id: string, type: string, executorId: string) {
    this.node = {
      id,
      type,
      executorId,
      configuration: {},
      inputs: {},
      outputs: [],
      dependencies: [],
    };
  }

  public static task(id: string, executorId: string): NodeBuilder {
    return new NodeBuilder(id, 'task', executorId);
  }

  public static capability(id: string, executorId: string): NodeBuilder {
    return new NodeBuilder(id, 'capability', executorId);
  }

  public static parallel(id: string): NodeBuilder {
    return new NodeBuilder(id, 'parallel', 'core.parallel');
  }

  public static decision(id: string): NodeBuilder {
    return new NodeBuilder(id, 'decision', 'core.decision');
  }

  public withConfiguration(config: Record<string, unknown>): this {
    this.node.configuration = { ...this.node.configuration, ...config };
    return this;
  }

  public withInputs(inputs: Record<string, unknown>): this {
    this.node.inputs = { ...this.node.inputs, ...inputs };
    return this;
  }

  public withOutputs(outputs: string[]): this {
    this.node.outputs = [...this.node.outputs, ...outputs];
    return this;
  }

  public dependsOn(
    nodeId: string,
    type: 'success' | 'failure' | 'completion' | 'conditional' = 'success',
    conditionExpression?: string
  ): this {
    this.node.dependencies.push({ nodeId, type, conditionExpression });
    return this;
  }

  public withRetryPolicy(policy: RetryPolicy): this {
    this.node.retryPolicy = policy;
    return this;
  }

  public withTimeout(timeoutMs: number): this {
    this.node.timeoutMs = timeoutMs;
    return this;
  }

  public withCheckpointPolicy(policy: CheckpointPolicy): this {
    this.node.checkpointPolicy = policy;
    return this;
  }

  public withMetadata(metadata: Record<string, unknown>): this {
    this.node.metadata = { ...this.node.metadata, ...metadata };
    return this;
  }

  public build(): ExecutionNode {
    return this.node;
  }
}

/**
 * Fluent API for defining workflows.
 */
export class WorkflowBuilder {
  private name: string;
  private description?: string;
  private version: string = '1.0.0';
  private nodes: Record<string, ExecutionNode> = {};
  private entryNodes: string[] = [];
  private metadata: Record<string, unknown> = {};

  constructor(name: string) {
    this.name = name;
  }

  public static create(name: string): WorkflowBuilder {
    return new WorkflowBuilder(name);
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }

  public setVersion(version: string): this {
    this.version = version;
    return this;
  }

  public setMetadata(metadata: Record<string, unknown>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  public addNode(nodeBuilder: NodeBuilder): this {
    const node = nodeBuilder.build();
    if (this.nodes[node.id]) {
      throw new Error(`Node with id '${node.id}' already exists in workflow.`);
    }
    this.nodes[node.id] = node;
    return this;
  }

  public addEntryNode(nodeId: string): this {
    if (!this.entryNodes.includes(nodeId)) {
      this.entryNodes.push(nodeId);
    }
    return this;
  }

  // Internal representation used by WorkflowCompiler
  public getDefinition() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      nodes: this.nodes,
      entryNodes: this.entryNodes,
      metadata: this.metadata,
    };
  }
}
