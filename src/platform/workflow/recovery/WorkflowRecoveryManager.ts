import { WorkflowSnapshot, ExecutionJournalEvent, NodeState } from '../types';
import { IWorkflowStorageProvider } from '../persistence/WorkflowPersistenceManager';

/**
 * Reconstructs workflow state in the event of an engine failure or node crash.
 */
export class WorkflowRecoveryManager {
  constructor(private storage: IWorkflowStorageProvider) {}

  /**
   * Recovers a workflow execution to its exact state prior to failure by loading
   * the last snapshot and replaying subsequent journal events over it.
   */
  public async recoverExecution(workflowId: string, executionId: string): Promise<WorkflowSnapshot | null> {
    const snapshot = await this.storage.getLatestSnapshot(workflowId, executionId);
    const afterTimestamp = snapshot ? snapshot.timestamp : 0;
    
    const events = await this.storage.getJournalEvents(executionId, afterTimestamp);
    
    if (!snapshot && events.length === 0) {
      return null;
    }

    if (!snapshot) {
      throw new Error("Cannot recover execution without a base snapshot.");
    }

    // Replay events
    for (const event of events) {
      this.applyEventToSnapshot(snapshot, event);
    }

    return snapshot;
  }

  private applyEventToSnapshot(snapshot: WorkflowSnapshot, event: ExecutionJournalEvent): void {
    snapshot.timestamp = event.timestamp;

    if (event.nodeId) {
      // Reconstruct Node State
      const nodeState: NodeState = snapshot.nodeStates[event.nodeId] || { status: 'pending', attempts: 0 };
      
      switch (event.eventType) {
        case 'NodeStarted':
          nodeState.status = 'running';
          nodeState.attempts++;
          nodeState.startedAt = event.timestamp;
          break;
        case 'NodeCompleted':
          nodeState.status = 'completed';
          nodeState.completedAt = event.timestamp;
          if (event.payload && event.payload.outputs) {
             nodeState.outputs = event.payload.outputs as Record<string, unknown>;
          }
          break;
        case 'NodeFailed':
          nodeState.status = 'failed';
          nodeState.completedAt = event.timestamp;
          if (event.payload && event.payload.error) {
            nodeState.error = event.payload.error as string;
          }
          break;
      }
      snapshot.nodeStates[event.nodeId] = nodeState;
    } else {
      // Reconstruct Global Workflow State
      switch (event.eventType) {
        case 'WorkflowCompleted':
          snapshot.status = 'completed';
          break;
        case 'WorkflowFailed':
          snapshot.status = 'failed';
          break;
        case 'WorkflowSuspended':
          snapshot.status = 'suspended';
          break;
        case 'WorkflowResumed':
          snapshot.status = 'running';
          break;
        case 'WorkflowCancelled':
          snapshot.status = 'cancelled';
          break;
      }
    }
  }
}
