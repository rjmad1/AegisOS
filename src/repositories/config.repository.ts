// src/repositories/config.repository.ts
// Relational SQLite Persistence for System Configurations using Prisma ORM

import prisma from "../infrastructure/db/prisma";

export interface PlatformConfig {
  port: number;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  sessionTimeoutMinutes: number;
  databasesDir: string;
  artifactsDir: string;
  logsDir: string;
  uploadsDir: string;
  exportsDir: string;
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  maintenanceBanner: string;
}

export interface ConfigVersionEntry {
  version: number;
  timestamp: string;
  changedBy: string;
  config: PlatformConfig;
  notes: string;
}

export class ConfigRepository {
  private getDefaultConfig(): PlatformConfig {
    return {
      port: 3000,
      rateLimitMax: 150,
      rateLimitWindowMs: 60000,
      sessionTimeoutMinutes: 480,
      databasesDir: process.env.OPS_DATABASES_DIR || "D:\\AI-Operations\\runtime\\databases",
      artifactsDir: process.env.OPS_ARTIFACTS_DIR || "D:\\AI-Operations\\artifacts",
      logsDir: process.env.OPS_LOGS_DIR || "D:\\AI-Operations\\logs",
      uploadsDir: process.env.OPS_UPLOADS_DIR || "D:\\AI-Operations\\uploads",
      exportsDir: process.env.OPS_EXPORTS_DIR || "D:\\AI-Operations\\exports",
      maintenanceMode: false,
      readOnlyMode: false,
      maintenanceBanner: "System operational. All features online.",
    };
  }

  async getActiveConfig(): Promise<PlatformConfig> {
    const record = await prisma.config.findUnique({
      where: { id: "active" },
    });
    if (!record) {
      const def = this.getDefaultConfig();
      // Seed dynamically on first call
      await prisma.config.create({
        data: {
          id: "active",
          ...def,
        },
      });
      return def;
    }
    return {
      port: record.port,
      rateLimitMax: record.rateLimitMax,
      rateLimitWindowMs: record.rateLimitWindowMs,
      sessionTimeoutMinutes: record.sessionTimeoutMinutes,
      databasesDir: record.databasesDir,
      artifactsDir: record.artifactsDir,
      logsDir: record.logsDir,
      uploadsDir: record.uploadsDir,
      exportsDir: record.exportsDir,
      maintenanceMode: record.maintenanceMode,
      readOnlyMode: record.readOnlyMode,
      maintenanceBanner: record.maintenanceBanner,
    };
  }

  async getHistory(): Promise<ConfigVersionEntry[]> {
    const records = await prisma.configHistory.findMany({
      orderBy: { version: "desc" },
    });
    return records.map((r) => ({
      version: r.version,
      timestamp: r.timestamp,
      changedBy: r.changedBy,
      config: JSON.parse(r.config),
      notes: r.notes,
    }));
  }

  async saveConfig(config: PlatformConfig, changedBy: string, notes: string): Promise<void> {
    // 1. Transactionally update config and add to history
    await prisma.$transaction(async (tx) => {
      await tx.config.upsert({
        where: { id: "active" },
        update: {
          port: config.port,
          rateLimitMax: config.rateLimitMax,
          rateLimitWindowMs: config.rateLimitWindowMs,
          sessionTimeoutMinutes: config.sessionTimeoutMinutes,
          databasesDir: config.databasesDir,
          artifactsDir: config.artifactsDir,
          logsDir: config.logsDir,
          uploadsDir: config.uploadsDir,
          exportsDir: config.exportsDir,
          maintenanceMode: config.maintenanceMode,
          readOnlyMode: config.readOnlyMode,
          maintenanceBanner: config.maintenanceBanner,
        },
        create: {
          id: "active",
          port: config.port,
          rateLimitMax: config.rateLimitMax,
          rateLimitWindowMs: config.rateLimitWindowMs,
          sessionTimeoutMinutes: config.sessionTimeoutMinutes,
          databasesDir: config.databasesDir,
          artifactsDir: config.artifactsDir,
          logsDir: config.logsDir,
          uploadsDir: config.uploadsDir,
          exportsDir: config.exportsDir,
          maintenanceMode: config.maintenanceMode,
          readOnlyMode: config.readOnlyMode,
          maintenanceBanner: config.maintenanceBanner,
        },
      });

      // Fetch last version to increment
      const lastVersionRecord = await tx.configHistory.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = lastVersionRecord ? lastVersionRecord.version + 1 : 1;

      await tx.configHistory.create({
        data: {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          changedBy,
          config: JSON.stringify(config),
          notes,
        },
      });
    });
  }

  async revertToVersion(version: number, changedBy: string): Promise<PlatformConfig | null> {
    const historyEntry = await prisma.configHistory.findUnique({
      where: { version },
    });
    if (!historyEntry) return null;

    const targetConfig = JSON.parse(historyEntry.config) as PlatformConfig;
    await this.saveConfig(targetConfig, changedBy, `Reverted to Configuration Version #${version}`);
    return targetConfig;
  }

  validateConfig(config: PlatformConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (config.port < 80 || config.port > 65535) {
      errors.push("Port must be between 80 and 65535.");
    }
    if (config.rateLimitMax <= 0) {
      errors.push("Rate limit max must be greater than zero.");
    }
    if (config.sessionTimeoutMinutes < 5 || config.sessionTimeoutMinutes > 1440 * 7) {
      errors.push("Session timeout must be between 5 minutes and 1 week.");
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const configRepository = new ConfigRepository();
export default configRepository;
