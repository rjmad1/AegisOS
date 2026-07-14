// src/repositories/workflow.repository.ts
// Relational SQLite Persistence for Workflows, Executions, Templates, Schedules, and Approvals using Prisma ORM

import prisma from "../infrastructure/db/prisma";
import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowSchedule,
  WorkflowApproval,
  WorkflowHistory
} from "../types/workflow";

export class WorkflowRepository {
  public async init(): Promise<void> {
    const workflowCount = await prisma.workflow.count();
    if (workflowCount === 0) {
      console.log("[WorkflowRepository] Seeding default workflows...");
      const baseTime = new Date().toISOString();
      const defaultWfs = this.getDefaultWorkflows(baseTime);
      for (const wf of defaultWfs) {
        await prisma.workflow.create({
          data: {
            id: wf.id,
            name: wf.name,
            description: wf.description,
            version: wf.version,
            status: wf.status,
            nodes: JSON.stringify(wf.nodes),
            capabilities: JSON.stringify(wf.capabilities),
            dependencies: JSON.stringify(wf.dependencies),
            relationships: JSON.stringify(wf.relationships),
            metadata: JSON.stringify(wf.metadata),
            createdAt: wf.createdAt,
            updatedAt: wf.updatedAt,
          },
        });
      }
    }

    const templateCount = await prisma.workflowTemplate.count();
    if (templateCount === 0) {
      console.log("[WorkflowRepository] Seeding default templates...");
      const defaultTemplates = this.getDefaultTemplates();
      for (const tpl of defaultTemplates) {
        await prisma.workflowTemplate.create({
          data: {
            id: tpl.id,
            name: tpl.name,
            description: tpl.description,
            version: tpl.version,
            nodes: JSON.stringify(tpl.nodes),
            metadata: JSON.stringify(tpl.metadata),
          },
        });
      }
    }

    const executionCount = await prisma.workflowExecution.count();
    if (executionCount === 0) {
      console.log("[WorkflowRepository] Seeding default executions...");
      const defaultExecs = this.getDefaultExecutions();
      for (const exec of defaultExecs) {
        await prisma.workflowExecution.create({
          data: {
            id: exec.id,
            workflowId: exec.workflowId,
            workflowVersion: exec.workflowVersion,
            workflowName: exec.workflowName,
            conversationId: exec.conversationId,
            status: exec.status,
            currentNodeId: exec.currentNodeId,
            variables: JSON.stringify(exec.variables),
            checkpointState: JSON.stringify(exec.checkpointState),
            createdAt: exec.createdAt,
            startedAt: exec.startedAt,
            endedAt: exec.endedAt,
            durationMs: exec.durationMs,
            error: exec.error,
            steps: JSON.stringify(exec.steps),
            logs: JSON.stringify(exec.logs),
            artifacts: JSON.stringify(exec.artifacts),
            approvals: JSON.stringify(exec.approvals),
            retryCount: exec.retryCount,
            maxRetries: exec.maxRetries,
            metadata: JSON.stringify(exec.metadata),
          },
        });
      }
    }

    const scheduleCount = await prisma.workflowSchedule.count();
    if (scheduleCount === 0) {
      console.log("[WorkflowRepository] Seeding default schedules...");
      const defaultSchedules = this.getDefaultSchedules();
      for (const sched of defaultSchedules) {
        await prisma.workflowSchedule.create({
          data: {
            id: sched.id,
            workflowId: sched.workflowId,
            name: sched.name,
            type: sched.type,
            cronExpression: sched.cronExpression,
            intervalSeconds: sched.intervalSeconds,
            runAt: sched.runAt,
            enabled: sched.enabled,
            lastRun: sched.lastRun,
            nextRun: sched.nextRun,
            retryConfig: JSON.stringify(sched.retryConfig || {}),
          },
        });
      }
    }
  }

  // --- Workflows ---

  public async getWorkflows(): Promise<WorkflowDefinition[]> {
    await this.init();
    const records = await prisma.workflow.findMany({
      where: { deletedAt: null },
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      status: r.status as any,
      nodes: JSON.parse(r.nodes),
      capabilities: JSON.parse(r.capabilities),
      dependencies: JSON.parse(r.dependencies),
      relationships: JSON.parse(r.relationships),
      metadata: JSON.parse(r.metadata),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  public async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    await this.init();
    const r = await prisma.workflow.findFirst({
      where: { id, deletedAt: null },
    });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      status: r.status as any,
      nodes: JSON.parse(r.nodes),
      capabilities: JSON.parse(r.capabilities),
      dependencies: JSON.parse(r.dependencies),
      relationships: JSON.parse(r.relationships),
      metadata: JSON.parse(r.metadata),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  public async saveWorkflow(wf: WorkflowDefinition): Promise<void> {
    await prisma.workflow.upsert({
      where: { id: wf.id },
      update: {
        name: wf.name,
        description: wf.description || "",
        version: wf.version,
        status: wf.status,
        nodes: JSON.stringify(wf.nodes || []),
        capabilities: JSON.stringify(wf.capabilities || []),
        dependencies: JSON.stringify(wf.dependencies || []),
        relationships: JSON.stringify(wf.relationships || []),
        metadata: JSON.stringify(wf.metadata || {}),
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
      },
      create: {
        id: wf.id,
        name: wf.name,
        description: wf.description || "",
        version: wf.version,
        status: wf.status,
        nodes: JSON.stringify(wf.nodes || []),
        capabilities: JSON.stringify(wf.capabilities || []),
        dependencies: JSON.stringify(wf.dependencies || []),
        relationships: JSON.stringify(wf.relationships || []),
        metadata: JSON.stringify(wf.metadata || {}),
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
      },
    });
  }

  public async deleteWorkflow(id: string): Promise<boolean> {
    try {
      await prisma.workflow.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  // --- Templates ---

  public async getTemplates(): Promise<WorkflowTemplate[]> {
    await this.init();
    const records = await prisma.workflowTemplate.findMany();
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      nodes: JSON.parse(r.nodes),
      metadata: JSON.parse(r.metadata),
    }));
  }

  public async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    await this.init();
    const r = await prisma.workflowTemplate.findUnique({
      where: { id },
    });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      version: r.version,
      nodes: JSON.parse(r.nodes),
      metadata: JSON.parse(r.metadata),
    };
  }

  public async saveTemplate(tpl: WorkflowTemplate): Promise<void> {
    await prisma.workflowTemplate.upsert({
      where: { id: tpl.id },
      update: {
        name: tpl.name,
        description: tpl.description || "",
        version: tpl.version,
        nodes: JSON.stringify(tpl.nodes || []),
        metadata: JSON.stringify(tpl.metadata || {}),
      },
      create: {
        id: tpl.id,
        name: tpl.name,
        description: tpl.description || "",
        version: tpl.version,
        nodes: JSON.stringify(tpl.nodes || []),
        metadata: JSON.stringify(tpl.metadata || {}),
      },
    });
  }

  // --- Executions ---

  public async getExecutions(): Promise<WorkflowExecution[]> {
    await this.init();
    const records = await prisma.workflowExecution.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      workflowId: r.workflowId,
      workflowVersion: r.workflowVersion,
      workflowName: r.workflowName,
      conversationId: r.conversationId || undefined,
      status: r.status as any,
      currentNodeId: r.currentNodeId || undefined,
      variables: JSON.parse(r.variables),
      checkpointState: JSON.parse(r.checkpointState),
      createdAt: r.createdAt,
      startedAt: r.startedAt || undefined,
      endedAt: r.endedAt || undefined,
      durationMs: r.durationMs || undefined,
      error: r.error || undefined,
      steps: JSON.parse(r.steps),
      logs: JSON.parse(r.logs),
      artifacts: JSON.parse(r.artifacts),
      approvals: JSON.parse(r.approvals),
      retryCount: r.retryCount,
      maxRetries: r.maxRetries,
      metadata: JSON.parse(r.metadata),
    }));
  }

  public async getExecution(id: string): Promise<WorkflowExecution | null> {
    await this.init();
    const r = await prisma.workflowExecution.findFirst({
      where: { id, deletedAt: null },
    });
    if (!r) return null;
    return {
      id: r.id,
      workflowId: r.workflowId,
      workflowVersion: r.workflowVersion,
      workflowName: r.workflowName,
      conversationId: r.conversationId || undefined,
      status: r.status as any,
      currentNodeId: r.currentNodeId || undefined,
      variables: JSON.parse(r.variables),
      checkpointState: JSON.parse(r.checkpointState),
      createdAt: r.createdAt,
      startedAt: r.startedAt || undefined,
      endedAt: r.endedAt || undefined,
      durationMs: r.durationMs || undefined,
      error: r.error || undefined,
      steps: JSON.parse(r.steps),
      logs: JSON.parse(r.logs),
      artifacts: JSON.parse(r.artifacts),
      approvals: JSON.parse(r.approvals),
      retryCount: r.retryCount,
      maxRetries: r.maxRetries,
      metadata: JSON.parse(r.metadata),
    };
  }

  public async saveExecution(exec: WorkflowExecution): Promise<void> {
    await prisma.workflowExecution.upsert({
      where: { id: exec.id },
      update: {
        workflowId: exec.workflowId,
        workflowVersion: exec.workflowVersion,
        workflowName: exec.workflowName,
        conversationId: exec.conversationId || null,
        status: exec.status,
        currentNodeId: exec.currentNodeId || null,
        variables: JSON.stringify(exec.variables || {}),
        checkpointState: JSON.stringify(exec.checkpointState || {}),
        createdAt: exec.createdAt,
        startedAt: exec.startedAt || null,
        endedAt: exec.endedAt || null,
        durationMs: exec.durationMs || null,
        error: exec.error || null,
        steps: JSON.stringify(exec.steps || []),
        logs: JSON.stringify(exec.logs || []),
        artifacts: JSON.stringify(exec.artifacts || []),
        approvals: JSON.stringify(exec.approvals || []),
        retryCount: exec.retryCount,
        maxRetries: exec.maxRetries,
        metadata: JSON.stringify(exec.metadata || {}),
      },
      create: {
        id: exec.id,
        workflowId: exec.workflowId,
        workflowVersion: exec.workflowVersion,
        workflowName: exec.workflowName,
        conversationId: exec.conversationId || null,
        status: exec.status,
        currentNodeId: exec.currentNodeId || null,
        variables: JSON.stringify(exec.variables || {}),
        checkpointState: JSON.stringify(exec.checkpointState || {}),
        createdAt: exec.createdAt,
        startedAt: exec.startedAt || null,
        endedAt: exec.endedAt || null,
        durationMs: exec.durationMs || null,
        error: exec.error || null,
        steps: JSON.stringify(exec.steps || []),
        logs: JSON.stringify(exec.logs || []),
        artifacts: JSON.stringify(exec.artifacts || []),
        approvals: JSON.stringify(exec.approvals || []),
        retryCount: exec.retryCount,
        maxRetries: exec.maxRetries,
        metadata: JSON.stringify(exec.metadata || {}),
      },
    });
  }

  // --- Schedules ---

  public async getSchedules(): Promise<WorkflowSchedule[]> {
    await this.init();
    const records = await prisma.workflowSchedule.findMany();
    return records.map((r) => ({
      id: r.id,
      workflowId: r.workflowId,
      name: r.name,
      type: r.type as any,
      cronExpression: r.cronExpression || undefined,
      intervalSeconds: r.intervalSeconds || undefined,
      runAt: r.runAt || undefined,
      enabled: r.enabled,
      lastRun: r.lastRun || undefined,
      nextRun: r.nextRun || undefined,
      retryConfig: r.retryConfig ? JSON.parse(r.retryConfig) : undefined,
    }));
  }

  public async getSchedule(id: string): Promise<WorkflowSchedule | null> {
    await this.init();
    const r = await prisma.workflowSchedule.findUnique({
      where: { id },
    });
    if (!r) return null;
    return {
      id: r.id,
      workflowId: r.workflowId,
      name: r.name,
      type: r.type as any,
      cronExpression: r.cronExpression || undefined,
      intervalSeconds: r.intervalSeconds || undefined,
      runAt: r.runAt || undefined,
      enabled: r.enabled,
      lastRun: r.lastRun || undefined,
      nextRun: r.nextRun || undefined,
      retryConfig: r.retryConfig ? JSON.parse(r.retryConfig) : undefined,
    };
  }

  public async saveSchedule(sched: WorkflowSchedule): Promise<void> {
    await prisma.workflowSchedule.upsert({
      where: { id: sched.id },
      update: {
        workflowId: sched.workflowId,
        name: sched.name,
        type: sched.type,
        cronExpression: sched.cronExpression || null,
        intervalSeconds: sched.intervalSeconds || null,
        runAt: sched.runAt || null,
        enabled: sched.enabled,
        lastRun: sched.lastRun || null,
        nextRun: sched.nextRun || null,
        retryConfig: JSON.stringify(sched.retryConfig || {}),
      },
      create: {
        id: sched.id,
        workflowId: sched.workflowId,
        name: sched.name,
        type: sched.type,
        cronExpression: sched.cronExpression || null,
        intervalSeconds: sched.intervalSeconds || null,
        runAt: sched.runAt || null,
        enabled: sched.enabled,
        lastRun: sched.lastRun || null,
        nextRun: sched.nextRun || null,
        retryConfig: JSON.stringify(sched.retryConfig || {}),
      },
    });
  }

  // --- Approvals ---

  public async getApprovals(): Promise<WorkflowApproval[]> {
    await this.init();
    const records = await prisma.workflowApproval.findMany();
    return records.map((r) => ({
      id: r.id,
      executionId: r.executionId,
      nodeId: r.nodeId,
      workflowId: r.workflowId,
      workflowName: r.workflowName,
      type: r.type as any,
      approvers: JSON.parse(r.approvers),
      quorumPercentage: r.quorumPercentage || undefined,
      timeoutSeconds: r.timeoutSeconds || undefined,
      escalationUser: r.escalationUser || undefined,
      status: r.status as any,
      decisions: JSON.parse(r.decisions),
      delegatedTo: r.delegatedTo || undefined,
      createdAt: r.createdAt,
      actionedAt: r.actionedAt || undefined,
    }));
  }

  public async getApproval(id: string): Promise<WorkflowApproval | null> {
    await this.init();
    const r = await prisma.workflowApproval.findUnique({
      where: { id },
    });
    if (!r) return null;
    return {
      id: r.id,
      executionId: r.executionId,
      nodeId: r.nodeId,
      workflowId: r.workflowId,
      workflowName: r.workflowName,
      type: r.type as any,
      approvers: JSON.parse(r.approvers),
      quorumPercentage: r.quorumPercentage || undefined,
      timeoutSeconds: r.timeoutSeconds || undefined,
      escalationUser: r.escalationUser || undefined,
      status: r.status as any,
      decisions: JSON.parse(r.decisions),
      delegatedTo: r.delegatedTo || undefined,
      createdAt: r.createdAt,
      actionedAt: r.actionedAt || undefined,
    };
  }

  public async saveApproval(app: WorkflowApproval): Promise<void> {
    await prisma.workflowApproval.upsert({
      where: { id: app.id },
      update: {
        executionId: app.executionId,
        nodeId: app.nodeId,
        workflowId: app.workflowId,
        workflowName: app.workflowName,
        type: app.type,
        approvers: JSON.stringify(app.approvers || []),
        quorumPercentage: app.quorumPercentage || null,
        timeoutSeconds: app.timeoutSeconds || null,
        escalationUser: app.escalationUser || null,
        status: app.status,
        decisions: JSON.stringify(app.decisions || {}),
        delegatedTo: app.delegatedTo || null,
        createdAt: app.createdAt,
        actionedAt: app.actionedAt || null,
      },
      create: {
        id: app.id,
        executionId: app.executionId,
        nodeId: app.nodeId,
        workflowId: app.workflowId,
        workflowName: app.workflowName,
        type: app.type,
        approvers: JSON.stringify(app.approvers || []),
        quorumPercentage: app.quorumPercentage || null,
        timeoutSeconds: app.timeoutSeconds || null,
        escalationUser: app.escalationUser || null,
        status: app.status,
        decisions: JSON.stringify(app.decisions || {}),
        delegatedTo: app.delegatedTo || null,
        createdAt: app.createdAt,
        actionedAt: app.actionedAt || null,
      },
    });
  }

  // --- Histories ---

  public async getHistories(): Promise<WorkflowHistory[]> {
    await this.init();
    const records = await prisma.workflowHistory.findMany({
      orderBy: { timestamp: "desc" },
    });
    return records.map((r) => ({
      id: r.id,
      workflowId: r.workflowId,
      changeType: r.changeType as any,
      version: r.version,
      userId: r.userId,
      userEmail: r.userEmail,
      details: r.details,
      timestamp: r.timestamp,
    }));
  }

  public async saveHistory(hist: WorkflowHistory): Promise<void> {
    await prisma.workflowHistory.create({
      data: {
        id: hist.id,
        workflowId: hist.workflowId,
        changeType: hist.changeType,
        version: hist.version,
        userId: hist.userId,
        userEmail: hist.userEmail,
        details: hist.details,
        timestamp: hist.timestamp,
      },
    });
  }

  // --- Default Seed Data ---

  private getDefaultWorkflows(baseTime: string): WorkflowDefinition[] {
    return [
      {
        id: "audit-workflow",
        name: "Workspace Audit Pipeline",
        description: "Scans repository directories for over-engineering and compliance check logs",
        version: "1.2.0",
        status: "active",
        nodes: [
          {
            id: "node-trigger-1",
            name: "Trigger on Scheduled Audit",
            type: "trigger",
            config: { triggerType: "schedule", cronExpression: "0 3 * * *" },
            next: "node-provider-1",
          },
          {
            id: "node-provider-1",
            name: "Audit Local Workspace Files",
            type: "provider_call",
            config: { providerId: "filesystem-provider", method: "listDirectory", path: "D:/AegisOS/Workspace/audit-agent" },
            next: "node-condition-1",
          },
          {
            id: "node-condition-1",
            name: "Check File Count",
            type: "condition",
            config: { expression: "steps.['node-provider-1'].output.length > 0" },
            nextTrue: "node-notify-1",
            nextFalse: "node-end-1",
          },
          {
            id: "node-notify-1",
            name: "Notify Auditor of Files Found",
            type: "notification",
            config: { title: "Audit Log scan completed", message: "Workspace files detected for security scans." },
            next: "node-end-1",
          },
          {
            id: "node-end-1",
            name: "End Pipeline",
            type: "end",
            config: {},
          },
        ],
        capabilities: ["file-analysis", "code-compliance"],
        dependencies: ["reviewer", "developer"],
        relationships: [
          { targetId: "reviewer", type: "provider", description: "Performs audit code validation checks" },
          { targetId: "filesystem-provider", type: "provider", description: "Runs directory check operations" },
        ],
        metadata: { folder: "D:/AegisOS/Workspace/audit-agent" },
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "development-workflow",
        name: "Interactive Code Developer",
        description: "Orchestrates direct code modifications, compilation checks, and Git commits",
        version: "2.1.0",
        status: "active",
        nodes: [
          {
            id: "node-trigger-2",
            name: "Manual Code Trigger",
            type: "trigger",
            config: { triggerType: "manual" },
            next: "node-approval-1",
          },
          {
            id: "node-approval-1",
            name: "Request Dev Lead Approval",
            type: "approval",
            config: { approvalType: "single", approvers: ["lead-dev@aegisos.io"], timeoutSeconds: 3600 },
            next: "node-provider-2",
          },
          {
            id: "node-provider-2",
            name: "Check Docker Runtime Status",
            type: "provider_call",
            config: { providerId: "docker-provider", method: "checkHealth" },
            next: "node-end-2",
          },
          {
            id: "node-end-2",
            name: "Finish Developer Run",
            type: "end",
            config: {},
          },
        ],
        capabilities: ["code-writing", "git-ops", "npx-execution"],
        dependencies: ["developer", "reviewer"],
        relationships: [
          { targetId: "developer", type: "user", description: "Responsible for modifying source files" },
        ],
        metadata: { folder: "D:/AegisOS/Workspace/developer" },
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "reviewer-workflow",
        name: "Security & Quality Reviewer",
        description: "Validates security policies, credentials leak checks, and WMI hardware telemetry audits",
        version: "1.0.4",
        status: "active",
        nodes: [
          {
            id: "node-trigger-3",
            name: "Trigger on Artifact Uploaded",
            type: "trigger",
            config: { triggerType: "event", eventName: "ArtifactCreated" },
            next: "node-script-1",
          },
          {
            id: "node-script-1",
            name: "Scan File for Credentials Leaks",
            type: "script",
            config: { script: "if (payload.fileName.endsWith('.env')) { return { leaks: true }; } return { leaks: false };" },
            next: "node-decision-1",
          },
          {
            id: "node-decision-1",
            name: "Is Leak Detected?",
            type: "decision",
            config: { expression: "steps.['node-script-1'].output.leaks === true" },
            nextTrue: "node-notify-leak",
            nextFalse: "node-end-3",
          },
          {
            id: "node-notify-leak",
            name: "Alert Security Officers",
            type: "notification",
            config: { title: "CRITICAL: Credential Leak Found", message: "A secret leak has been detected in a uploaded workspace file." },
            next: "node-end-3",
          },
          {
            id: "node-end-3",
            name: "End Scan",
            type: "end",
            config: {},
          },
        ],
        capabilities: ["security-scans", "performance-audits"],
        dependencies: ["reviewer"],
        relationships: [
          { targetId: "reviewer", type: "user", description: "Runs static reviews and leaks check audits" },
        ],
        metadata: { folder: "D:/AegisOS/Workspace/reviewer" },
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ];
  }

  private getDefaultTemplates(): WorkflowTemplate[] {
    return [
      {
        id: "template-backup",
        name: "Daily Backup Pipeline Template",
        description: "Standard pipeline for backing up a folder to local-artifact-storage.",
        version: "1.0.0",
        nodes: [
          {
            id: "start",
            name: "Backup Trigger",
            type: "trigger",
            config: { triggerType: "schedule" },
            next: "backup-call",
          },
          {
            id: "backup-call",
            name: "Trigger Storage Backup",
            type: "provider_call",
            config: { providerId: "local-artifact-storage-provider", method: "checkHealth" },
            next: "notify-complete",
          },
          {
            id: "notify-complete",
            name: "Alert Admin",
            type: "notification",
            config: { title: "Backup Complete", message: "Workflow finished executing." },
            next: "end",
          },
          {
            id: "end",
            name: "End",
            type: "end",
            config: {},
          },
        ],
        metadata: { category: "maintenance" },
      },
      {
        id: "template-approval",
        name: "Multi-stage Approval Template",
        description: "Template to prompt a single or multi-stage approval before proceeding.",
        version: "1.0.0",
        nodes: [
          {
            id: "start",
            name: "Trigger Pipeline",
            type: "trigger",
            config: { triggerType: "manual" },
            next: "approval-gate",
          },
          {
            id: "approval-gate",
            name: "Approval Gate",
            type: "approval",
            config: { approvalType: "single", approvers: ["admin@aegisos.io"] },
            next: "success-notification",
          },
          {
            id: "success-notification",
            name: "Send Success Notification",
            type: "notification",
            config: { title: "Approved", message: "Approved successfully." },
            next: "end",
          },
          {
            id: "end",
            name: "End",
            type: "end",
            config: {},
          },
        ],
        metadata: { category: "governance" },
      },
    ];
  }

  private getDefaultExecutions(): WorkflowExecution[] {
    const now = new Date();
    return [
      {
        id: "exec-audit-01",
        workflowId: "audit-workflow",
        workflowVersion: "1.2.0",
        workflowName: "Workspace Audit Pipeline",
        status: "succeeded",
        currentNodeId: "node-end-1",
        variables: {},
        checkpointState: { completedNodeIds: ["node-trigger-1", "node-provider-1", "node-condition-1", "node-end-1"] },
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
        startedAt: new Date(now.getTime() - 3599000).toISOString(),
        endedAt: new Date(now.getTime() - 3590000).toISOString(),
        durationMs: 9000,
        steps: [
          { id: "step-1", executionId: "exec-audit-01", nodeId: "node-trigger-1", name: "Trigger on Scheduled Audit", type: "trigger", status: "completed", startedAt: new Date(now.getTime() - 3600000).toISOString(), endedAt: new Date(now.getTime() - 3600000).toISOString(), durationMs: 0 },
          { id: "step-2", executionId: "exec-audit-01", nodeId: "node-provider-1", name: "Audit Local Workspace Files", type: "provider_call", status: "completed", startedAt: new Date(now.getTime() - 3599000).toISOString(), endedAt: new Date(now.getTime() - 3595000).toISOString(), durationMs: 4000 },
          { id: "step-3", executionId: "exec-audit-01", nodeId: "node-condition-1", name: "Check File Count", type: "condition", status: "completed", startedAt: new Date(now.getTime() - 3595000).toISOString(), endedAt: new Date(now.getTime() - 3594000).toISOString(), durationMs: 1000 },
          { id: "step-4", executionId: "exec-audit-01", nodeId: "node-end-1", name: "End Pipeline", type: "end", status: "completed", startedAt: new Date(now.getTime() - 3594000).toISOString(), endedAt: new Date(now.getTime() - 3590000).toISOString(), durationMs: 4000 },
        ],
        logs: [
          { timestamp: new Date(now.getTime() - 3600000).toISOString(), level: "info", message: "Workflow triggered by scheduler." },
          { timestamp: new Date(now.getTime() - 3599000).toISOString(), level: "info", message: "Executing file scan..." },
          { timestamp: new Date(now.getTime() - 3595000).toISOString(), level: "info", message: "Scan finished. Found 12 files." },
          { timestamp: new Date(now.getTime() - 3590000).toISOString(), level: "info", message: "Workflow completed successfully." },
        ],
        artifacts: [{ id: "art-01", name: "requirements_doc.docx", type: "word" }],
        approvals: [],
        retryCount: 0,
        maxRetries: 3,
        metadata: {},
      },
    ];
  }

  private getDefaultSchedules(): WorkflowSchedule[] {
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1);
    return [
      {
        id: "sched-audit-daily",
        workflowId: "audit-workflow",
        name: "Daily Compliance Audit Run",
        type: "cron",
        cronExpression: "0 3 * * *",
        enabled: true,
        nextRun: nextRun.toISOString(),
      },
    ];
  }
}

export const workflowRepository = new WorkflowRepository();
export default workflowRepository;
