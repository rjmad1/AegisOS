// src/platform/control-plane/PlatformConfigurationManager.ts
import { eventPlatform } from '../event-bus/EventPlatform';
import * as crypto from 'crypto';
import prisma from '../../infrastructure/db/prisma';

export interface ConfigurationRevision {
  version: number;
  timestamp: number;
  config: Record<string, any>;
  description: string;
}

export interface DriftReport {
  hasDrift: boolean;
  driftedParameters: {
    parameter: string;
    expected: any;
    actual: any;
  }[];
}

export class PlatformConfigurationManager {
  private static instance: PlatformConfigurationManager | null = null;
  private currentVersion = 1;
  private history: ConfigurationRevision[] = [];
  private encryptionKey = crypto.scryptSync(process.env.CONFIG_ENCRYPTION_SECRET || 'config_secret_2026', 'salt', 32);

  private constructor() {
    this.initializeDefaultConfig();
  }

  public static getInstance(): PlatformConfigurationManager {
    if (!PlatformConfigurationManager.instance) {
      PlatformConfigurationManager.instance = new PlatformConfigurationManager();
    }
    return PlatformConfigurationManager.instance;
  }

  private initializeDefaultConfig() {
    const defaultConfig = {
      aiRoutingStrategy: 'cost-optimized',
      autoHealEnabled: true,
      maxMemoryUsageLimit: 0.90,
      vramRetentionTimeoutMs: 600000, // 10 mins
      secureBoundOnly: true,
      logRetentionDays: 30
    };

    this.history.push({
      version: this.currentVersion,
      timestamp: Date.now(),
      config: defaultConfig,
      description: 'Initial system base configuration.'
    });
  }

  public getLatestConfiguration(): ConfigurationRevision {
    return this.history[this.history.length - 1];
  }

  public getHistory(): ConfigurationRevision[] {
    return [...this.history];
  }

  /**
   * Encrypts sensitive values before committing to plain configuration properties.
   */
  public encryptValue(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  public decryptValue(encryptedValue: string): string {
    try {
      const parts = encryptedValue.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted: string = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedValue; // fallback if plain text
    }
  }

  /**
   * Saves a new revision of the platform configuration.
   */
  public async commitConfiguration(newConfig: Record<string, any>, description: string): Promise<number> {
    // Validate config parameter names
    const requiredKeys = ['aiRoutingStrategy', 'autoHealEnabled', 'secureBoundOnly'];
    for (const key of requiredKeys) {
      if (!(key in newConfig)) {
        throw new Error(`Configuration schema validation failed: parameter "${key}" is missing.`);
      }
    }

    this.currentVersion++;
    const revision: ConfigurationRevision = {
      version: this.currentVersion,
      timestamp: Date.now(),
      config: newConfig,
      description
    };

    this.history.push(revision);

    // Save history to SQLite database audit
    try {
      await prisma.auditEvent.create({
        data: {
          timestamp: new Date().toISOString(),
          eventType: 'ConfigurationChanged',
          details: JSON.stringify({
            version: this.currentVersion,
            description,
            configKeys: Object.keys(newConfig)
          })
        }
      });
    } catch {}

    await eventPlatform.publish({
      name: 'ConfigurationChanged',
      source: 'config-manager',
      payload: { version: this.currentVersion, config: newConfig }
    });

    return this.currentVersion;
  }

  /**
   * Reverts platform configuration to an earlier version.
   */
  public async rollbackToVersion(version: number): Promise<boolean> {
    const target = this.history.find(h => h.version === version);
    if (!target) return false;

    await this.commitConfiguration(target.config, `Rollback configuration to version ${version}.`);
    return true;
  }

  /**
   * Audit configuration drift against actual executing environment parameters.
   */
  public checkConfigurationDrift(activeSettings: Record<string, any>): DriftReport {
    const expected = this.getLatestConfiguration().config;
    const driftedParameters: DriftReport['driftedParameters'] = [];

    for (const [key, value] of Object.entries(expected)) {
      if (key in activeSettings && activeSettings[key] !== value) {
        driftedParameters.push({
          parameter: key,
          expected: value,
          actual: activeSettings[key]
        });
      }
    }

    return {
      hasDrift: driftedParameters.length > 0,
      driftedParameters
    };
  }
}
export const platformConfigurationManager = PlatformConfigurationManager.getInstance();
export default platformConfigurationManager;
