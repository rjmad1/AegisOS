/**
 * AegisOS Durable Execution Platform (DEP) Contracts
 * Defines the stateless orchestration boundaries for the Console Framework.
 */
import prisma from "@/infrastructure/db/prisma";

export type ExecutionState =
  | 'Created'
  | 'Validated'
  | 'Queued'
  | 'Scheduled'
  | 'Executing'
  | 'Checkpointed'
  | 'WaitingForApproval'
  | 'WaitingForDependency'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'
  | 'Failed'
  | 'RollingBack'
  | 'Compensated'
  | 'Archived';

export interface ExecutionInstance {
  id: string;
  commandId: string;
  transactionId: string;
  state: ExecutionState;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tenantId: string;
  payload: any;
  result?: any;
  error?: string;
  pendingApprovals?: string[];
  checkpoints: Checkpoint[];
  version: number;
  traceId?: string;
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  stateSnapshot: any;
  reason: string;
}

export interface IDurableExecutionProvider {
  submit(commandId: string, payload: any, context: any, traceId?: string): Promise<ExecutionInstance>;
  getStatus(executionId: string): Promise<ExecutionInstance>;
  approve(executionId: string, approvalToken: string): Promise<ExecutionInstance>;
  cancel(executionId: string): Promise<ExecutionInstance>;
  listExecutions(): Promise<ExecutionInstance[]>;
}

export class PrismaDurableExecutionProvider implements IDurableExecutionProvider {
  async submit(commandId: string, payload: any, context: any, traceId?: string): Promise<ExecutionInstance> {
    const isApprovalRequired = commandId.includes('require-approval');
    const initialState: ExecutionState = isApprovalRequired ? 'WaitingForApproval' : 'Executing';

    const command = await prisma.command.create({
      data: {
        type: commandId,
        status: initialState,
        priority: "MEDIUM",
        payload: JSON.stringify(payload),
        riskLevel: "MEDIUM", // Usually mapped by PolicyEngine
        userId: context.userId || 'system',
        origin: "console",
        approvalType: isApprovalRequired ? "MANUAL" : "AUTO",
        approvalStatus: isApprovalRequired ? "PENDING" : "APPROVED",
        approvers: isApprovalRequired ? JSON.stringify(['SYS_ADMIN']) : "[]",
        checkpoints: JSON.stringify([{
          id: `cp_0`,
          timestamp: new Date().toISOString(),
          stateSnapshot: { init: true },
          reason: 'Submission'
        }]),
        telemetryRefs: traceId ? JSON.stringify({ traceId }) : null,
        optimisticLockVersion: 1
      }
    });

    return this.mapToExecutionInstance(command);
  }

  async getStatus(executionId: string): Promise<ExecutionInstance> {
    const command = await prisma.command.findUnique({
      where: { id: executionId }
    });
    if (!command) throw new Error(`Execution ${executionId} not found`);
    return this.mapToExecutionInstance(command);
  }

  async approve(executionId: string, approvalToken: string): Promise<ExecutionInstance> {
    const command = await prisma.command.findUnique({
      where: { id: executionId }
    });
    if (!command) throw new Error(`Execution ${executionId} not found`);
    if (command.status !== 'WaitingForApproval') {
      throw new Error(`Execution ${executionId} is not awaiting approval`);
    }

    const checkpoints = JSON.parse(command.checkpoints || '[]');
    checkpoints.push({
      id: `cp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      stateSnapshot: { approved: true, token: approvalToken },
      reason: 'Approval Resumption'
    });

    const updated = await prisma.command.update({
      where: { 
        id: executionId,
        optimisticLockVersion: command.optimisticLockVersion
      },
      data: {
        status: 'Executing',
        approvalStatus: 'APPROVED',
        approvers: "[]",
        checkpoints: JSON.stringify(checkpoints),
        optimisticLockVersion: { increment: 1 }
      }
    });

    return this.mapToExecutionInstance(updated);
  }

  async cancel(executionId: string): Promise<ExecutionInstance> {
    const command = await prisma.command.update({
      where: { id: executionId },
      data: { status: 'Cancelled', optimisticLockVersion: { increment: 1 } }
    });
    return this.mapToExecutionInstance(command);
  }
  
  async listExecutions(): Promise<ExecutionInstance[]> {
    const commands = await prisma.command.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return commands.map(this.mapToExecutionInstance);
  }

  // Internal helper to update state (used by TransactionCoordinator)
  async updateState(executionId: string, state: ExecutionState, result?: any, error?: string): Promise<ExecutionInstance> {
    const data: any = {
      status: state,
      optimisticLockVersion: { increment: 1 }
    };
    if (result) data.result = JSON.stringify(result);
    if (error) data.errorMessage = error;
    if (state === 'Completed') data.completedAt = new Date();

    const command = await prisma.command.update({
      where: { id: executionId },
      data
    });
    return this.mapToExecutionInstance(command);
  }

  private mapToExecutionInstance(command: any): ExecutionInstance {
    return {
      id: command.id,
      commandId: command.type,
      transactionId: command.transactionId || `txn_${command.id}`,
      state: command.status as ExecutionState,
      createdAt: command.createdAt.toISOString(),
      updatedAt: command.startedAt?.toISOString() || command.createdAt.toISOString(),
      userId: command.userId || 'system',
      tenantId: command.tenantId || 'default',
      payload: JSON.parse(command.payload || '{}'),
      result: command.result ? JSON.parse(command.result) : undefined,
      error: command.errorMessage || undefined,
      pendingApprovals: command.status === 'WaitingForApproval' ? JSON.parse(command.approvers || '[]') : [],
      checkpoints: JSON.parse(command.checkpoints || '[]'),
      version: command.optimisticLockVersion,
      traceId: command.telemetryRefs ? JSON.parse(command.telemetryRefs).traceId : undefined
    };
  }
}

export const DEP = new PrismaDurableExecutionProvider();
