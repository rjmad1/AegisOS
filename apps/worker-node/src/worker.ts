import { PlaywrightActionExecutor } from '@platform/browser-engine';
import { ValidationPipeline } from '@platform/validation-engine';
import { LocalDiskEvidenceCollector } from '@platform/evidence-pipeline';
import { ActionCommand, ExecutionResult } from '@platform/shared-contracts';

export interface WorkerTaskPayload {
  taskId: string;
  sessionId: string;
  command: ActionCommand;
  checkpointId?: string;
}

export class ExecutionWorkerNode {
  private executor = new PlaywrightActionExecutor();
  private validator = new ValidationPipeline();
  private collector = new LocalDiskEvidenceCollector();
  private isRunning = false;

  async processTask(page: any, task: WorkerTaskPayload): Promise<{
    result: ExecutionResult;
    validationReport: any;
    evidenceManifest: any;
  }> {
    // 1. Execute deterministic Playwright action
    const { result, interactables } = await this.executor.execute(page, task.command);

    // 2. Run deterministic validation suite
    const validationReport = await this.validator.runSuite({
      nodeId: result.resultingDomHash,
      domSnapshot: result.resultingDomSnapshot,
    });

    // 3. Collect evidence
    const artifact = await this.collector.processArtifact(
      task.sessionId,
      result.resultingDomHash,
      'CONSOLE',
      result.errorDetail ? `[ERROR] ${result.errorDetail}` : '[INFO] Execution completed'
    );

    const evidenceManifest = this.collector.buildManifest(
      task.sessionId,
      result.resultingDomHash,
      [{ type: 'CONSOLE', ...artifact }]
    );

    return {
      result,
      validationReport,
      evidenceManifest,
    };
  }
}
