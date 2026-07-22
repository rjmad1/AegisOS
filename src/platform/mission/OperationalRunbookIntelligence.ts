import { EventEmitter } from 'events';

export interface RunbookNode {
  id: string;
  type: 'decision' | 'action' | 'diagnostic';
  description: string;
  nextNodes?: string[]; // IDs of possible next nodes based on outcome
}

export interface OperationalRunbook {
  id: string;
  name: string;
  targetServiceId: string;
  triggerConditions: string[]; // e.g., ['slo_breach:latency', 'alert:high_cpu']
  nodes: RunbookNode[];
  escalationMatrix: string[]; // user/role IDs
}

export interface RunbookExecution {
  executionId: string;
  runbookId: string;
  status: 'running' | 'completed' | 'escalated' | 'failed';
  currentNodeId: string;
  log: string[];
}

export class OperationalRunbookIntelligence extends EventEmitter {
  private runbooks: Map<string, OperationalRunbook> = new Map();
  private executions: Map<string, RunbookExecution> = new Map();

  constructor() {
    super();
  }

  public registerRunbook(runbook: OperationalRunbook): void {
    this.runbooks.set(runbook.id, runbook);
    this.emit('runbook_registered', runbook);
  }

  public triggerRunbook(runbookId: string, context: any): RunbookExecution {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) throw new Error(`Runbook ${runbookId} not found`);

    const execution: RunbookExecution = {
      executionId: `exec-${Date.now()}`,
      runbookId,
      status: 'running',
      currentNodeId: runbook.nodes[0]?.id || '',
      log: [`Started execution for ${runbookId}`]
    };

    this.executions.set(execution.executionId, execution);
    this.emit('runbook_execution_started', execution);

    // Provide automated remediation suggestions for the first node if applicable
    this.suggestRemediation(execution.executionId, execution.currentNodeId);

    return execution;
  }

  public suggestRemediation(executionId: string, nodeId: string): string[] {
    // Abstract intelligence to suggest remediations based on historical data
    return ['Restart service instances', 'Increase replica count'];
  }

  public escalate(executionId: string, reason: string): void {
    const exec = this.executions.get(executionId);
    if (exec) {
      exec.status = 'escalated';
      exec.log.push(`Escalated: ${reason}`);
      this.emit('runbook_escalated', exec);
    }
  }
}
