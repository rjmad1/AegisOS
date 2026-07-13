// src/repositories/job.repository.ts
// Relational SQLite Persistence for Administrative Scheduler Jobs using Prisma ORM

import prisma from "../infrastructure/db/prisma";
export interface SchedulerJob {
  id: string;
  name: string;
  cronExpression: string;
  type: string;
  status: string;
  lastRun: string | null;
  nextRun: string | null;
  enabled: boolean;
  message?: string;
}

export class JobRepository {
  async getAllJobs(): Promise<SchedulerJob[]> {
    const records = await prisma.schedulerJob.findMany();
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      cronExpression: r.cronExpression,
      type: r.type as any,
      status: r.status as any,
      lastRun: r.lastRun,
      nextRun: r.nextRun,
      enabled: r.enabled,
      message: r.message || undefined,
    }));
  }

  async saveJob(job: SchedulerJob): Promise<void> {
    await prisma.schedulerJob.upsert({
      where: { id: job.id },
      update: {
        name: job.name,
        cronExpression: job.cronExpression,
        type: job.type,
        status: job.status,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        enabled: job.enabled,
        message: job.message || null,
      },
      create: {
        id: job.id,
        name: job.name,
        cronExpression: job.cronExpression,
        type: job.type,
        status: job.status,
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        enabled: job.enabled,
        message: job.message || null,
      },
    });
  }

  async getJob(id: string): Promise<SchedulerJob | undefined> {
    const r = await prisma.schedulerJob.findUnique({
      where: { id },
    });
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      cronExpression: r.cronExpression,
      type: r.type as any,
      status: r.status as any,
      lastRun: r.lastRun,
      nextRun: r.nextRun,
      enabled: r.enabled,
      message: r.message || undefined,
    };
  }

  async triggerJobImmediately(id: string): Promise<SchedulerJob | undefined> {
    const job = await this.getJob(id);
    if (!job) return undefined;

    job.status = "running";
    await this.saveJob(job);

    // Simulate execution of job types asynchronously
    setTimeout(async () => {
      try {
        const updatedJob = await this.getJob(id);
        if (!updatedJob) return;

        updatedJob.status = "success";
        updatedJob.lastRun = new Date().toISOString();
        updatedJob.message = "Executed successfully via manual administrative trigger.";
        updatedJob.nextRun = new Date(Date.now() + 24 * 3600000).toISOString();

        await this.saveJob(updatedJob);
      } catch (err: any) {
        const updatedJob = await this.getJob(id);
        if (updatedJob) {
          updatedJob.status = "failed";
          updatedJob.lastRun = new Date().toISOString();
          updatedJob.message = `Execution failed: ${err.message}`;
          await this.saveJob(updatedJob);
        }
      }
    }, 1500);

    return job;
  }
}

export const jobRepository = new JobRepository();
export default jobRepository;
