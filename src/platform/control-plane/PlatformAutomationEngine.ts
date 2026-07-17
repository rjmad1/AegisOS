// src/platform/control-plane/PlatformAutomationEngine.ts
import { ScheduledTask } from './types';
import { platformHealthEngine } from './PlatformHealthEngine';
import { backupRecoveryCoordinator } from './BackupRecoveryCoordinator';
import { securityOperationsManager } from './SecurityOperationsManager';
import { eventPlatform } from '../event-bus/EventPlatform';

export class PlatformAutomationEngine {
  private static instance: PlatformAutomationEngine | null = null;
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.registerDefaultTasks();
  }

  public static getInstance(): PlatformAutomationEngine {
    if (!PlatformAutomationEngine.instance) {
      PlatformAutomationEngine.instance = new PlatformAutomationEngine();
    }
    return PlatformAutomationEngine.instance;
  }

  private registerDefaultTasks(): void {
    // 1. Daily Health Check
    this.registerScheduledTask({
      id: 'auto:daily-health',
      name: 'Daily Platform Health Check',
      schedule: 'Every 15 minutes',
      enabled: true,
      status: 'idle',
      handler: async () => {
        console.log('[Automation] Executing Daily Health Check...');
        await platformHealthEngine.runHealthChecks();
      }
    });

    // 2. Nightly Backup
    this.registerScheduledTask({
      id: 'auto:nightly-backup',
      name: 'Nightly Core Database Backup',
      schedule: 'Every 2 hours',
      enabled: true,
      status: 'idle',
      handler: async () => {
        console.log('[Automation] Executing scheduled database snapshot backup...');
        await backupRecoveryCoordinator.createBackup('snapshot');
      }
    });

    // 3. Security Audit Sweep
    this.registerScheduledTask({
      id: 'auto:security-audit',
      name: 'Continuous Security Posture Audit',
      schedule: 'Every 30 minutes',
      enabled: true,
      status: 'idle',
      handler: async () => {
        console.log('[Automation] Executing continuous security sweeps...');
        const posture = await securityOperationsManager.getSecurityPosture();
        if (posture.score < 80) {
          console.warn(`[Automation:Alert] Security posture dropped below limits: ${posture.score}/100`);
        }
      }
    });
  }

  public registerScheduledTask(task: Omit<ScheduledTask, 'lastRun' | 'nextRun'>): void {
    const fullTask: ScheduledTask = {
      ...task,
      nextRun: Date.now() + 60000 * 30 // mock next run
    };
    this.tasks.set(fullTask.id, fullTask);

    if (fullTask.enabled) {
      this.setupTimer(fullTask);
    }
  }

  public getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  public toggleTask(id: string, enabled: boolean): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.enabled = enabled;
    if (enabled) {
      this.setupTimer(task);
    } else {
      const timer = this.timers.get(id);
      if (timer) {
        clearInterval(timer);
        this.timers.delete(id);
      }
      task.status = 'idle';
    }
    return true;
  }

  public async triggerTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.status = 'running';
    task.lastRun = Date.now();
    
    await eventPlatform.publish({
      name: 'automation:started',
      source: 'automation-engine',
      payload: { taskId: id, timestamp: Date.now() }
    });

    try {
      await task.handler();
      task.status = 'success';
      await eventPlatform.publish({
        name: 'automation:success',
        source: 'automation-engine',
        payload: { taskId: id, timestamp: Date.now() }
      });
      return true;
    } catch (err: any) {
      task.status = 'failed';
      await eventPlatform.publish({
        name: 'automation:failed',
        source: 'automation-engine',
        payload: { taskId: id, error: err.message, timestamp: Date.now() }
      });
      return false;
    }
  }

  private setupTimer(task: ScheduledTask): void {
    // Clear existing timer if any
    const existing = this.timers.get(task.id);
    if (existing) clearInterval(existing);

    // Setup periodic polling check
    const interval = setInterval(async () => {
      // Simulate periodic task firing
      await this.triggerTask(task.id);
    }, 60000 * 60); // 1 hour intervals

    this.timers.set(task.id, interval);
  }

  public shutdownAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}
export const platformAutomationEngine = PlatformAutomationEngine.getInstance();
export default platformAutomationEngine;
