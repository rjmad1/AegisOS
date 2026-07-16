// src/infrastructure/db/db-migrator.ts
// Migration engine to automatically migrate legacy JSON databases to SQLite on startup.

import fs from "fs/promises";
import path from "path";
import prisma from "./prisma";

const DB_DIR = process.env.OPS_DATABASES_DIR || path.join(process.cwd(), "databases");

export async function bootstrapDatabase(): Promise<void> {
  try {
    console.log("[DBMigrator] Bootstrapping transactional persistence layer...");
    // Verify client connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("[DBMigrator] Connected to SQLite database successfully.");
    
    // Execute legacy data migrations
    await migrateLegacyJsonData();
  } catch (err: any) {
    console.error("[DBMigrator] Database bootstrap failed:", err.message);
    throw err;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function renameLegacyFile(filePath: string): Promise<void> {
  const backupPath = filePath + ".bak";
  try {
    if (await fileExists(backupPath)) {
      await fs.unlink(backupPath);
    }
    await fs.rename(filePath, backupPath);
    console.log(`[DBMigrator] Renamed legacy file ${path.basename(filePath)} to .bak`);
  } catch (err: any) {
    console.error(`[DBMigrator] Failed to rename legacy file ${filePath}:`, err.message);
  }
}

async function migrateLegacyJsonData(): Promise<void> {
  // 1. Users Migration
  const usersPath = path.join(DB_DIR, "users.json");
  if (await fileExists(usersPath)) {
    try {
      const raw = await fs.readFile(usersPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} users...`);
      for (const item of list) {
        await prisma.user.upsert({
          where: { id: item.id },
          update: {
            googleSubjectId: item.googleSubjectId,
            email: item.email,
            displayName: item.displayName,
            role: item.role,
            status: item.status,
            createdDate: item.createdDate,
            lastLogin: item.lastLogin,
            createdBy: item.createdBy,
            permissions: JSON.stringify(item.permissions || []),
            allowedNetworks: JSON.stringify(item.allowedNetworks || []),
            notes: item.notes || "",
          },
          create: {
            id: item.id,
            googleSubjectId: item.googleSubjectId,
            email: item.email,
            displayName: item.displayName,
            role: item.role,
            status: item.status,
            createdDate: item.createdDate,
            lastLogin: item.lastLogin,
            createdBy: item.createdBy,
            permissions: JSON.stringify(item.permissions || []),
            allowedNetworks: JSON.stringify(item.allowedNetworks || []),
            notes: item.notes || "",
          },
        });
      }
      await renameLegacyFile(usersPath);
    } catch (err: any) {
      console.error("[DBMigrator] Users migration failed:", err.message);
    }
  }

  // 2. Role Permissions Migration
  const rolesPath = path.join(DB_DIR, "role_permissions.json");
  if (await fileExists(rolesPath)) {
    try {
      const raw = await fs.readFile(rolesPath, "utf-8");
      const matrix = JSON.parse(raw) as Record<string, string[]>;
      console.log(`[DBMigrator] Migrating role permissions...`);
      for (const [role, permissions] of Object.entries(matrix)) {
        await prisma.rolePermission.upsert({
          where: { role },
          update: {
            permissions: JSON.stringify(permissions),
          },
          create: {
            role,
            permissions: JSON.stringify(permissions),
          },
        });
      }
      await renameLegacyFile(rolesPath);
    } catch (err: any) {
      console.error("[DBMigrator] Role permissions migration failed:", err.message);
    }
  }

  // 3. Secrets Migration
  const secretsPath = path.join(DB_DIR, "secrets.json");
  if (await fileExists(secretsPath)) {
    try {
      const raw = await fs.readFile(secretsPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} secrets...`);
      for (const item of list) {
        await prisma.secret.upsert({
          where: { key: item.key },
          update: {
            encryptedValue: item.encryptedValue,
            iv: item.iv,
            authTag: item.authTag,
            updatedAt: item.updatedAt,
          },
          create: {
            key: item.key,
            encryptedValue: item.encryptedValue,
            iv: item.iv,
            authTag: item.authTag,
            updatedAt: item.updatedAt,
          },
        });
      }
      await renameLegacyFile(secretsPath);
    } catch (err: any) {
      console.error("[DBMigrator] Secrets migration failed:", err.message);
    }
  }

  // 4. Feature Flags Migration
  const flagsPath = path.join(DB_DIR, "feature_flags.json");
  if (await fileExists(flagsPath)) {
    try {
      const raw = await fs.readFile(flagsPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} feature flags...`);
      for (const item of list) {
        await prisma.featureFlag.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            category: item.category,
            description: item.description,
            enabled: item.enabled,
          },
          create: {
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            enabled: item.enabled,
          },
        });
      }
      await renameLegacyFile(flagsPath);
    } catch (err: any) {
      console.error("[DBMigrator] Feature flags migration failed:", err.message);
    }
  }

  // 5. Workflows, Executions, Templates, Schedules, Approvals, Histories Migration
  const workflowMapping = [
    { file: "workflows.json", table: prisma.workflow, parse: (item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      version: item.version,
      status: item.status,
      nodes: JSON.stringify(item.nodes || []),
      capabilities: JSON.stringify(item.capabilities || []),
      dependencies: JSON.stringify(item.dependencies || []),
      relationships: JSON.stringify(item.relationships || []),
      metadata: JSON.stringify(item.metadata || {}),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })},
    { file: "workflow_executions.json", table: prisma.workflowExecution, parse: (item: any) => ({
      id: item.id,
      workflowId: item.workflowId,
      workflowVersion: item.workflowVersion,
      workflowName: item.workflowName,
      conversationId: item.conversationId || null,
      status: item.status,
      currentNodeId: item.currentNodeId || null,
      variables: JSON.stringify(item.variables || {}),
      checkpointState: JSON.stringify(item.checkpointState || {}),
      createdAt: item.createdAt,
      startedAt: item.startedAt || null,
      endedAt: item.endedAt || null,
      durationMs: item.durationMs || null,
      error: item.error || null,
      steps: JSON.stringify(item.steps || []),
      logs: JSON.stringify(item.logs || []),
      artifacts: JSON.stringify(item.artifacts || []),
      approvals: JSON.stringify(item.approvals || []),
      retryCount: item.retryCount || 0,
      maxRetries: item.maxRetries || 0,
      metadata: JSON.stringify(item.metadata || {}),
    })},
    { file: "workflow_templates.json", table: prisma.workflowTemplate, parse: (item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      version: item.version,
      nodes: JSON.stringify(item.nodes || []),
      metadata: JSON.stringify(item.metadata || {}),
    })},
    { file: "workflow_schedules.json", table: prisma.workflowSchedule, parse: (item: any) => ({
      id: item.id,
      workflowId: item.workflowId,
      name: item.name,
      type: item.type,
      cronExpression: item.cronExpression || null,
      intervalSeconds: item.intervalSeconds || null,
      runAt: item.runAt || null,
      enabled: item.enabled,
      lastRun: item.lastRun || null,
      nextRun: item.nextRun || null,
      retryConfig: JSON.stringify(item.retryConfig || {}),
    })},
    { file: "workflow_approvals.json", table: prisma.workflowApproval, parse: (item: any) => ({
      id: item.id,
      executionId: item.executionId,
      nodeId: item.nodeId,
      workflowId: item.workflowId,
      workflowName: item.workflowName,
      type: item.type,
      approvers: JSON.stringify(item.approvers || []),
      quorumPercentage: item.quorumPercentage || null,
      timeoutSeconds: item.timeoutSeconds || null,
      escalationUser: item.escalationUser || null,
      status: item.status,
      decisions: JSON.stringify(item.decisions || {}),
      delegatedTo: item.delegatedTo || null,
      createdAt: item.createdAt,
      actionedAt: item.actionedAt || null,
    })},
    { file: "workflow_histories.json", table: prisma.workflowHistory, parse: (item: any) => ({
      id: item.id,
      workflowId: item.workflowId,
      changeType: item.changeType,
      version: item.version,
      userId: item.userId,
      userEmail: item.userEmail,
      details: item.details || "",
      timestamp: item.timestamp,
    })}
  ];

  for (const mapping of workflowMapping) {
    const filePath = path.join(DB_DIR, mapping.file);
    if (await fileExists(filePath)) {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const list = JSON.parse(raw) as any[];
        console.log(`[DBMigrator] Migrating ${list.length} entries from ${mapping.file}...`);
        for (const item of list) {
          const parsed = mapping.parse(item);
          await (mapping.table as any).upsert({
            where: { id: parsed.id },
            update: parsed,
            create: parsed,
          });
        }
        await renameLegacyFile(filePath);
      } catch (err: any) {
        console.error(`[DBMigrator] Failed to migrate ${mapping.file}:`, err.message);
      }
    }
  }

  // 6. Audit Logs Migration
  const auditLogsPath = path.join(DB_DIR, "audit_logs.json");
  if (await fileExists(auditLogsPath)) {
    try {
      const raw = await fs.readFile(auditLogsPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} audit logs...`);
      for (const item of list) {
        await prisma.auditLogEntry.upsert({
          where: { id: item.id },
          update: {
            timestamp: item.timestamp,
            userId: item.userId,
            action: item.action,
            category: item.category,
            details: item.details,
            ipAddress: item.ipAddress || "127.0.0.1",
          },
          create: {
            id: item.id,
            timestamp: item.timestamp,
            userId: item.userId,
            action: item.action,
            category: item.category,
            details: item.details,
            ipAddress: item.ipAddress || "127.0.0.1",
          },
        });
      }
      await renameLegacyFile(auditLogsPath);
    } catch (err: any) {
      console.error("[DBMigrator] Audit logs migration failed:", err.message);
    }
  }

  // 7. Event Audit Migration
  const eventAuditPath = path.join(DB_DIR, "event_audit.json");
  if (await fileExists(eventAuditPath)) {
    try {
      const raw = await fs.readFile(eventAuditPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} event audits...`);
      for (const item of list) {
        await prisma.auditEvent.upsert({
          where: { id: item.id },
          update: {
            timestamp: item.timestamp,
            eventType: item.eventType || item.name || "UnknownEvent",
            userId: item.userId || null,
            userEmail: item.userEmail || null,
            ipAddress: item.ipAddress || null,
            details: item.details || "",
          },
          create: {
            id: item.id,
            timestamp: item.timestamp,
            eventType: item.eventType || item.name || "UnknownEvent",
            userId: item.userId || null,
            userEmail: item.userEmail || null,
            ipAddress: item.ipAddress || null,
            details: item.details || "",
          },
        });
      }
      await renameLegacyFile(eventAuditPath);
    } catch (err: any) {
      console.error("[DBMigrator] Event audit migration failed:", err.message);
    }
  }

  // 8. Platform Config Migration
  const configPath = process.env.OPS_CONFIG_PATH || path.resolve(process.cwd(), "console_config.json");
  if (await fileExists(configPath)) {
    try {
      const raw = await fs.readFile(configPath, "utf-8");
      const item = JSON.parse(raw);
      console.log("[DBMigrator] Migrating platform configuration...");
      
      const port = typeof item.port === "number" ? item.port : 3000;
      const rateLimitMax = typeof item.rateLimitMax === "number" ? item.rateLimitMax : 150;
      const rateLimitWindowMs = typeof item.rateLimitWindowMs === "number" ? item.rateLimitWindowMs : 60000;
      const sessionTimeoutMinutes = typeof item.sessionTimeoutMinutes === "number" ? item.sessionTimeoutMinutes : 480;
      const databasesDir = item.databasesDir || process.env.OPS_DATABASES_DIR || "D:\\AI-Operations\\runtime\\databases";
      const artifactsDir = item.artifactsDir || process.env.OPS_ARTIFACTS_DIR || "D:\\AI-Operations\\artifacts";
      const logsDir = item.logsDir || process.env.OPS_LOGS_DIR || "D:\\AI-Operations\\logs";
      const uploadsDir = item.uploadsDir || process.env.OPS_UPLOADS_DIR || "D:\\AI-Operations\\uploads";
      const exportsDir = item.exportsDir || process.env.OPS_EXPORTS_DIR || "D:\\AI-Operations\\exports";
      const maintenanceMode = typeof item.maintenanceMode === "boolean" ? item.maintenanceMode : false;
      const readOnlyMode = typeof item.readOnlyMode === "boolean" ? item.readOnlyMode : false;
      const maintenanceBanner = item.maintenanceBanner || "System operational. All features online.";

      await prisma.config.upsert({
        where: { id: "active" },
        update: {
          port,
          rateLimitMax,
          rateLimitWindowMs,
          sessionTimeoutMinutes,
          databasesDir,
          artifactsDir,
          logsDir,
          uploadsDir,
          exportsDir,
          maintenanceMode,
          readOnlyMode,
          maintenanceBanner,
        },
        create: {
          id: "active",
          port,
          rateLimitMax,
          rateLimitWindowMs,
          sessionTimeoutMinutes,
          databasesDir,
          artifactsDir,
          logsDir,
          uploadsDir,
          exportsDir,
          maintenanceMode,
          readOnlyMode,
          maintenanceBanner,
        },
      });
      // We don't delete console_config.json as it is Next.js standard external config
      // But we record it in DB.
    } catch (err: any) {
      console.error("[DBMigrator] Config migration failed:", err.message);
    }
  }

  // 9. Config History Migration
  const configHistoryPath = path.join(DB_DIR, "config_history.json");
  if (await fileExists(configHistoryPath)) {
    try {
      const raw = await fs.readFile(configHistoryPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} config history items...`);
      for (const item of list) {
        await prisma.configHistory.upsert({
          where: { version: item.version },
          update: {
            timestamp: item.timestamp,
            changedBy: item.changedBy,
            config: JSON.stringify(item.config || {}),
            notes: item.notes || "",
          },
          create: {
            version: item.version,
            timestamp: item.timestamp,
            changedBy: item.changedBy,
            config: JSON.stringify(item.config || {}),
            notes: item.notes || "",
          },
        });
      }
      await renameLegacyFile(configHistoryPath);
    } catch (err: any) {
      console.error("[DBMigrator] Config history migration failed:", err.message);
    }
  }

  // 10. Scheduler jobs & Task Queue jobs migration
  const jobsPath = path.join(DB_DIR, "jobs.json");
  if (await fileExists(jobsPath)) {
    try {
      const raw = await fs.readFile(jobsPath, "utf-8");
      const list = JSON.parse(raw) as any[];
      console.log(`[DBMigrator] Migrating ${list.length} jobs...`);
      for (const item of list) {
        if ("cronExpression" in item) {
          // SchedulerJob
          await prisma.schedulerJob.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              cronExpression: item.cronExpression,
              type: item.type,
              status: item.status,
              lastRun: item.lastRun || null,
              nextRun: item.nextRun || null,
              enabled: item.enabled,
              message: item.message || null,
            },
            create: {
              id: item.id,
              name: item.name,
              cronExpression: item.cronExpression,
              type: item.type,
              status: item.status,
              lastRun: item.lastRun || null,
              nextRun: item.nextRun || null,
              enabled: item.enabled,
              message: item.message || null,
            },
          });
        } else {
          // Task Queue Job
          await prisma.job.upsert({
            where: { id: item.id },
            update: {
              name: item.name,
              payload: JSON.stringify(item.payload || {}),
              status: item.status,
              priority: item.priority,
              progress: item.progress || 0,
              retryPolicy: JSON.stringify(item.retryPolicy || {}),
              errors: JSON.stringify(item.errors || []),
              createdAt: item.createdAt,
              startedAt: item.startedAt || null,
              completedAt: item.completedAt || null,
              result: item.result ? JSON.stringify(item.result) : null,
            },
            create: {
              id: item.id,
              name: item.name,
              payload: JSON.stringify(item.payload || {}),
              status: item.status,
              priority: item.priority,
              progress: item.progress || 0,
              retryPolicy: JSON.stringify(item.retryPolicy || {}),
              errors: JSON.stringify(item.errors || []),
              createdAt: item.createdAt,
              startedAt: item.startedAt || null,
              completedAt: item.completedAt || null,
              result: item.result ? JSON.stringify(item.result) : null,
            },
          });
        }
      }
      await renameLegacyFile(jobsPath);
    } catch (err: any) {
      console.error("[DBMigrator] Jobs migration failed:", err.message);
    }
  }

  console.log("[DBMigrator] Persistence layer migration complete.");
}
