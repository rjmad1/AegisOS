import { INodeExecutor } from './INodeExecutor';

/**
 * Registry mapping executor identifiers to their concrete INodeExecutor instances.
 */
export class ExecutionNodeRegistry {
  private executors: Map<string, INodeExecutor> = new Map();

  /**
   * Registers a new executor under a specific ID.
   */
  public register(executorId: string, executor: INodeExecutor): void {
    if (this.executors.has(executorId)) {
      throw new Error(`Executor '${executorId}' is already registered.`);
    }
    this.executors.set(executorId, executor);
  }

  /**
   * Retrieves an executor by its ID. Throws an error if not found.
   */
  public get(executorId: string): INodeExecutor {
    const executor = this.executors.get(executorId);
    if (!executor) {
      throw new Error(`Executor '${executorId}' not found in registry.`);
    }
    return executor;
  }

  /**
   * Unregisters an executor.
   */
  public unregister(executorId: string): void {
    this.executors.delete(executorId);
  }

  /**
   * Returns a list of all registered executor IDs.
   */
  public list(): string[] {
    return Array.from(this.executors.keys());
  }
}
