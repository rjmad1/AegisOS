import { WorkflowSnapshot, ExecutionJournalEvent } from '../types';

/**
 * Interface abstracting the underlying physical storage.
 * To be implemented by a concrete database adapter (SQLite, LevelDB, Postgres, etc.)
 */
export interface IWorkflowStorageProvider {
  saveSnapshot(snapshot: WorkflowSnapshot): Promise<void>;
  getLatestSnapshot(workflowId: string, executionId: string): Promise<WorkflowSnapshot | null>;
  appendJournalEvent(event: ExecutionJournalEvent): Promise<void>;
  getJournalEvents(executionId: string, afterTimestamp: number): Promise<ExecutionJournalEvent[]>;
}

/**
 * Manages journaling events and saving checkpoints to the underlying storage provider.
 */
export class WorkflowPersistenceManager {
  constructor(private storage: IWorkflowStorageProvider) {}

  /**
   * Appends a new event to the execution journal.
   */
  public async recordEvent(event: ExecutionJournalEvent): Promise<void> {
    await this.storage.appendJournalEvent(event);
  }

  /**
   * Saves a full snapshot of the workflow state (a checkpoint).
   */
  public async checkpoint(snapshot: WorkflowSnapshot): Promise<void> {
    await this.storage.saveSnapshot(snapshot);
  }
}
