// src/platform/control-plane/PlatformJobScheduler.ts
import { SchedulerJob } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import { platformDigitalTwin } from './PlatformDigitalTwin';
import prisma from '../../infrastructure/db/prisma';

export class PlatformJobScheduler {
  private static instance: PlatformJobScheduler | null = null;
  private jobs: Map<string, SchedulerJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private eventSubs: Map<string, string> = new Map(); // jobId -> eventPlatform subscription ID

  private constructor() {}

  public static getInstance(): PlatformJobScheduler {
    if (!PlatformJobScheduler.instance) {
      PlatformJobScheduler.instance = new PlatformJobScheduler();
    }
    return PlatformJobScheduler.instance;
  }

  public getJobs(): SchedulerJob[] {
    return Array.from(this.jobs.values());
  }

  public getJob(id: string): SchedulerJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Registers a cron schedule or event-driven job.
   */
  public registerJob(
    job: Omit<SchedulerJob, 'status' | 'retriesRemaining' | 'executionLogs'>,
    handler: (log: (msg: string) => void) => Promise<void>
  ): void {
    const fullJob: SchedulerJob = {
      ...job,
      status: 'pending',
      retriesRemaining: job.maxRetries,
      executionLogs: []
    };

    this.jobs.set(job.id, fullJob);

    // Setup cron timer or event subscriber binding
    if (job.schedule === 'once') {
      // Manual trigger only
    } else if (job.schedule.startsWith('event:')) {
      const eventName = job.schedule.replace('event:', '').trim();
      const subId = eventPlatform.subscribe(eventName, async () => {
        await this.triggerJob(job.id, handler);
      });
      this.eventSubs.set(job.id, subId);
    } else {
      // Simulate standard cron intervals (for local test execution: 1 hour intervals)
      const interval = setInterval(async () => {
        await this.triggerJob(job.id, handler);
      }, 60000 * 60);

      this.timers.set(job.id, interval);
      fullJob.nextRun = Date.now() + 60000 * 60;
    }
  }

  /**
   * Triggers and executes a registered job, capturing logs and saving results to SQLite.
   */
  public async triggerJob(
    id: string,
    handler: (log: (msg: string) => void) => Promise<void>
  ): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status === 'running') return false;

    job.status = 'running';
    job.lastRun = Date.now();
    job.executionLogs = [`[scheduler] Job execution started at ${new Date().toISOString()}`];

    platformDigitalTwin.registerRunningJob(job);

    const log = (msg: string) => {
      const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
      job.executionLogs.push(line);
      console.log(`[Job:${id}] ${msg}`);
    };

    let success = false;
    try {
      // Race handler against job timeout
      await Promise.race([
        handler(log),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Job execution timed out after ${job.timeoutMs}ms`)), job.timeoutMs)
        )
      ]);
      job.status = 'completed';
      job.retriesRemaining = job.maxRetries; // reset retries
      success = true;
      log('Job execution completed successfully.');
    } catch (err: any) {
      log(`Job failed: ${err.message}`);
      if (job.retriesRemaining > 0) {
        job.retriesRemaining--;
        job.status = 'pending';
        log(`Retries remaining: ${job.retriesRemaining}. Rescheduling...`);
        // Retry immediately in background
        setTimeout(() => this.triggerJob(id, handler), 2000);
      } else {
        job.status = 'failed';
        log('Maximum retry threshold exceeded. Job terminated.');
      }
    } finally {
      if (job.nextRun && job.schedule !== 'once' && !job.schedule.startsWith('event:')) {
        job.nextRun = Date.now() + 60000 * 60;
      }
      platformDigitalTwin.registerRunningJob(job);

      // Audit logs trail to relational SQLite table
      try {
        await prisma.auditEvent.create({
          data: {
            timestamp: new Date().toISOString(),
            eventType: success ? 'WorkflowCompleted' : 'SecurityViolationDetected',
            details: JSON.stringify({
              jobId: job.id,
              name: job.name,
              status: job.status,
              logsSummary: job.executionLogs.slice(-3)
            })
          }
        });
      } catch {}
    }

    return success;
  }

  public unregisterJob(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
    const subId = this.eventSubs.get(id);
    if (subId) {
      eventPlatform.unsubscribe(subId);
      this.eventSubs.delete(id);
    }
    this.jobs.delete(id);
  }

  public shutdown(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    for (const subId of this.eventSubs.values()) {
      eventPlatform.unsubscribe(subId);
    }
    this.eventSubs.clear();
    this.jobs.clear();
  }
}
export const platformJobScheduler = PlatformJobScheduler.getInstance();
export default platformJobScheduler;
