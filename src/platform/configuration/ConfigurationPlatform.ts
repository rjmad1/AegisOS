// ============================================================================
// Configuration Platform — Centralized Config, Overrides, Secrets, and History
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import prisma from '../../infrastructure/db/prisma';
import { secretRepository } from '../../repositories/secret.repository';
import { featureFlags } from '../../infrastructure/flags/feature-flags';
import { EventBus } from '../event-bus/EventBus';

// Configuration validation schema using Zod
export const ConfigSchema = z.object({
  port: z.number().int().min(1024).max(65535).default(3000),
  rateLimitMax: z.number().int().positive().default(100),
  rateLimitWindowMs: z.number().int().positive().default(60000),
  sessionTimeoutMinutes: z.number().int().positive().default(30),
  databasesDir: z.string().default('databases'),
  artifactsDir: z.string().default('artifacts_storage'),
  logsDir: z.string().default('logs'),
  uploadsDir: z.string().default('uploads'),
  exportsDir: z.string().default('exports'),
  maintenanceMode: z.boolean().default(false),
  readOnlyMode: z.boolean().default(false),
  maintenanceBanner: z.string().default('System is undergoing scheduled maintenance.'),
});

export type PlatformConfig = z.infer<typeof ConfigSchema>;

export class ConfigurationPlatform {
  private static instance: ConfigurationPlatform | null = null;
  
  private currentConfig: PlatformConfig;
  private fileConfigPath: string;
  private changeListeners: Set<(key: string, value: unknown, prev: unknown) => void> = new Set();
  private runtimeOverrides: Map<string, unknown> = new Map();

  private constructor() {
    this.fileConfigPath = process.env.OPS_CONFIG_PATH || path.resolve(process.cwd(), 'console_config.json');
    this.currentConfig = ConfigSchema.parse({});
    this.reload();
  }

  public static getInstance(): ConfigurationPlatform {
    if (!ConfigurationPlatform.instance) {
      ConfigurationPlatform.instance = new ConfigurationPlatform();
    }
    return ConfigurationPlatform.instance;
  }

  /**
   * Reload all configurations from disk, environment variables, and the database.
   */
  public reload(): void {
    const defaults = ConfigSchema.parse({});
    let fileConfig: Record<string, any> = {};

    if (typeof window !== 'undefined') {
      this.currentConfig = defaults;
      return;
    }

    // 1. Load from file if exists
    if (fs.existsSync(this.fileConfigPath)) {
      try {
        const raw = fs.readFileSync(this.fileConfigPath, 'utf-8');
        fileConfig = JSON.parse(raw);
      } catch (err) {
        console.error('[ConfigurationPlatform] Failed to parse console_config.json:', err);
      }
    }

    // 2. Load environment variables
    const envConfig: Record<string, any> = {};
    if (process.env.PORT) envConfig.port = parseInt(process.env.PORT, 10);
    if (process.env.OPS_MAINTENANCE_MODE) envConfig.maintenanceMode = process.env.OPS_MAINTENANCE_MODE === 'true';

    // Combine configurations
    const rawCombined = {
      ...defaults,
      ...fileConfig,
      ...envConfig,
      ...Object.fromEntries(this.runtimeOverrides)
    };

    // 3. Validate Combined Config
    const parsed = ConfigSchema.safeParse(rawCombined);
    if (parsed.success) {
      this.currentConfig = parsed.data;
    } else {
      console.error('[ConfigurationPlatform] Config schema validation failed. Using defaults where invalid.', parsed.error.format());
      this.currentConfig = defaults;
    }
  }

  /**
   * Load active database overrides from SQLite Config table.
   */
  public async loadFromDb(): Promise<void> {
    try {
      const dbConfig = await prisma.config.findUnique({
        where: { id: 'active' }
      });

      if (dbConfig) {
        const dbOverrides: Record<string, any> = {};
        for (const [key, val] of Object.entries(dbConfig)) {
          if (key === 'id') continue;
          dbOverrides[key] = val;
        }

        const rawCombined = {
          ...this.currentConfig,
          ...dbOverrides,
          ...Object.fromEntries(this.runtimeOverrides)
        };

        const parsed = ConfigSchema.safeParse(rawCombined);
        if (parsed.success) {
          this.currentConfig = parsed.data;
          console.log('[ConfigurationPlatform] DB configuration overrides loaded successfully.');
        }
      }
    } catch (err) {
      console.warn('[ConfigurationPlatform] SQLite Config overrides not loaded (database may not be ready yet):', err);
    }
  }

  /**
   * Get a configuration parameter.
   */
  public get<K extends keyof PlatformConfig>(key: K): PlatformConfig[K] {
    if (this.runtimeOverrides.has(key as string)) {
      return this.runtimeOverrides.get(key as string) as PlatformConfig[K];
    }
    return this.currentConfig[key];
  }

  /**
   * Set a configuration parameter, persist it, and record it in history.
   */
  public async set<K extends keyof PlatformConfig>(
    key: K,
    value: PlatformConfig[K],
    changedBy: string = 'system',
    notes: string = 'Configuration updated.'
  ): Promise<void> {
    const prev = this.currentConfig[key];
    if (prev === value) return;

    // Validate the proposed change
    const updatedRaw = { ...this.currentConfig, [key]: value };
    const parsed = ConfigSchema.safeParse(updatedRaw);
    if (!parsed.success) {
      throw new Error(`[ConfigurationPlatform] Invalid value for key "${key}": ${parsed.error.message}`);
    }

    this.currentConfig = parsed.data;

    // 1. Persist to DB Config table
    try {
      const dbPayload: any = {
        [key]: value
      };
      await prisma.config.upsert({
        where: { id: 'active' },
        update: dbPayload,
        create: {
          id: 'active',
          port: this.currentConfig.port,
          rateLimitMax: this.currentConfig.rateLimitMax,
          rateLimitWindowMs: this.currentConfig.rateLimitWindowMs,
          sessionTimeoutMinutes: this.currentConfig.sessionTimeoutMinutes,
          databasesDir: this.currentConfig.databasesDir,
          artifactsDir: this.currentConfig.artifactsDir,
          logsDir: this.currentConfig.logsDir,
          uploadsDir: this.currentConfig.uploadsDir,
          exportsDir: this.currentConfig.exportsDir,
          maintenanceMode: this.currentConfig.maintenanceMode,
          readOnlyMode: this.currentConfig.readOnlyMode,
          maintenanceBanner: this.currentConfig.maintenanceBanner,
          ...dbPayload
        }
      });

      // 2. Persist to ConfigHistory table
      const historyEntries = await prisma.configHistory.findMany({
        orderBy: { version: 'desc' },
        take: 1
      });
      const nextVersion = historyEntries.length > 0 ? historyEntries[0].version + 1 : 1;

      await prisma.configHistory.create({
        data: {
          version: nextVersion,
          timestamp: new Date().toISOString(),
          changedBy,
          config: JSON.stringify(this.currentConfig),
          notes
        }
      });

    } catch (err: any) {
      console.error('[ConfigurationPlatform] Failed to persist config to DB:', err.message);
    }

    // 3. Notify change listeners
    for (const listener of this.changeListeners) {
      try {
        listener(key as string, value, prev);
      } catch (err) {
        console.error('[ConfigurationPlatform] Listener exception:', err);
      }
    }

    // 4. Emit event on event bus
    EventBus.publish('settings:changed', { key: key as string, value, previous: prev });
  }

  /**
   * Set a runtime override. This is not persisted and is lost on restart.
   */
  public setRuntimeOverride(key: string, value: unknown): void {
    const prev = this.get(key as any);
    this.runtimeOverrides.set(key, value);
    this.reload();

    for (const listener of this.changeListeners) {
      try {
        listener(key, value, prev);
      } catch (err) {
        console.error('[ConfigurationPlatform] Listener exception:', err);
      }
    }
    EventBus.publish('settings:changed', { key, value, previous: prev });
  }

  /**
   * Register a change listener.
   */
  public addChangeListener(listener: (key: string, value: unknown, prev: unknown) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  // ---- Secrets Manager Delegation ----

  public async getSecret(key: string): Promise<string | null> {
    return secretRepository.getSecret(key);
  }

  public async saveSecret(key: string, value: string): Promise<void> {
    await secretRepository.saveSecret(key, value);
  }

  public async deleteSecret(key: string): Promise<void> {
    await secretRepository.deleteSecret(key);
  }

  // ---- Feature Flags Delegation ----

  public isFeatureEnabled(flagName: string): boolean {
    return featureFlags.isEnabled(flagName);
  }

  public setFeatureFlag(flagName: string, value: boolean): void {
    featureFlags.setFlag(flagName, value);
  }

  public getAllFeatureFlags(): Record<string, boolean> {
    return featureFlags.getAllFlags();
  }
}

export const configurationPlatform = ConfigurationPlatform.getInstance();
export default configurationPlatform;
