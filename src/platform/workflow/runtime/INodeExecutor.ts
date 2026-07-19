import { ExecutionNode, NodeState } from '../types';
import { IExecutionContext } from '../../kernel/types';

/**
 * Contract for all Workflow Execution Nodes.
 * Implementing classes provide the concrete business logic or external integrations.
 */
export interface INodeExecutor {
  /**
   * Validates the configuration and inputs for the node before execution.
   */
  validate(node: ExecutionNode): Promise<boolean>;

  /**
   * Prepares the execution environment or acquires necessary resources.
   */
  prepare(node: ExecutionNode, context: IExecutionContext): Promise<void>;

  /**
   * The core execution logic. Returns an object representing the outputs of this node.
   */
  execute(node: ExecutionNode, context: IExecutionContext, state: NodeState): Promise<Record<string, unknown>>;

  /**
   * Rolls back any changes or releases resources if execution fails.
   */
  rollback(node: ExecutionNode, context: IExecutionContext): Promise<void>;

  /**
   * Cleans up resources post-execution (runs regardless of success or failure).
   */
  cleanup(node: ExecutionNode, context: IExecutionContext): Promise<void>;

  /**
   * Returns the health status for this executor.
   */
  health(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }>;
}
