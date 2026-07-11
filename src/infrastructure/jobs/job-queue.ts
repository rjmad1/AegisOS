import { Job, TaskStatus, Priority, RetryPolicy } from "@/api/types/background-processing";
import { hardenedEventBus } from "../events/event-bus";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface WorkflowCheckpoint {
  jobId: string;
  stageName: string;
  progress: number;
  checkpointState: any;
  timestamp: string;
}

export class ResilientJobQueue {
  private static instance: ResilientJobQueue | null = null;
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, (job: Job, checkpoint: (state: any) => Promise<void>) => Promise<any>> = new Map();
  private compensations: Map<string, (job: Job) => Promise<void>> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private jobsDbPath: string;
  private checkpointsDbPath: string;
  private pausedJobs: Set<string> = new Set();

  private constructor() {
    this.jobsDbPath = path.resolve(process.cwd(), "databases", "jobs.json");
    this.checkpointsDbPath = path.resolve(process.cwd(), "databases", "checkpoints.json");
    this.ensureDirs();
    this.loadJobs();
    this.registerDefaultResilientHandlers();
    this.startQueueWorker();
  }

  public static getInstance(): ResilientJobQueue {
    if (!ResilientJobQueue.instance) {
      ResilientJobQueue.instance = new ResilientJobQueue();
    }
    return ResilientJobQueue.instance;
  }

  private ensureDirs() {
    const dbDir = path.resolve(process.cwd(), "databases");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  private loadJobs() {
    try {
      if (fs.existsSync(this.jobsDbPath)) {
        const raw = fs.readFileSync(this.jobsDbPath, "utf-8");
        const list = JSON.parse(raw) as Job[];
        list.forEach((j) => this.jobs.set(j.id, j));
      }
    } catch (err) {
      console.error("[JobQueue] Failed to load jobs file:", err);
    }
  }

  private saveJobs() {
    try {
      const list = Array.from(this.jobs.values());
      fs.writeFileSync(this.jobsDbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[JobQueue] Failed to save jobs file:", err);
    }
  }

  private registerDefaultResilientHandlers() {
    // Vectorization handler simulation with checkpoint logging and compensation
    this.handlers.set("file-vectorization-pipeline", async (job: Job, checkpoint) => {
      const stages = [
        { name: "File Parsing (PDF/MD/HTML extractions)", targetProgress: 25 },
        { name: "Text Chunking (Recursive character splitting)", targetProgress: 50 },
        { name: "Embedding Generation (all-minilm vector mapping)", targetProgress: 75 },
        { name: "Search Indexing (SQLite vector tables storage)", targetProgress: 100 }
      ];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        // Check Pause/Cancel status
        await this.checkExecutionGates(job.id);

        // Simulate stage execution delay
        await new Promise((resolve) => setTimeout(resolve, 600));
        await this.checkExecutionGates(job.id);

        // Save State Checkpoint
        await checkpoint({ lastCompletedStage: stage.name });

        // Update progress
        this.updateJobProgress(job.id, stage.targetProgress);

        // Publish index telemetry
        await hardenedEventBus.publish({
          name: "SearchIndexed",
          source: "JobQueue",
          version: "v1",
          priority: "low",
          securityClassification: "internal",
          retentionPolicy: "session",
          payload: {
            entityId: job.id,
            entityType: "job",
            indexedFields: [stage.name],
            durationMs: 600
          }
        });
      }

      return {
        vectorCount: 142,
        status: "indexed_successfully",
        fileSize: job.payload?.fileSize || 1024
      };
    });

    // Compensation callback if vectorization fails
    this.compensations.set("file-vectorization-pipeline", async (job: Job) => {
      console.log(`[JobQueue:SagaCompensation] Undoing partial works for job: ${job.id}`);
      // Simulates deleting partial workspace index rows
      await hardenedEventBus.publish({
        name: "ArtifactDeleted",
        source: "JobQueue",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: {
          artifactId: `partial-${job.id}`
        }
      });
    });
  }

  private async checkExecutionGates(id: string) {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Job deleted");
    if (job.status === "cancelled") throw new Error("Job was cancelled");

    // Pause wait loop
    while (this.pausedJobs.has(id)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const reCheck = this.jobs.get(id);
      if (!reCheck || reCheck.status === "cancelled") {
        throw new Error("Job was cancelled while paused");
      }
    }
  }

  private startQueueWorker() {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(async () => {
      const queuedJobs = Array.from(this.jobs.values())
        .filter((j) => j.status === "queued")
        .sort((a, b) => {
          const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
          const weightA = priorityWeight[a.priority] || 1;
          const weightB = priorityWeight[b.priority] || 1;
          if (weightA !== weightB) return weightB - weightA;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

      for (const job of queuedJobs) {
        await this.runJob(job);
      }
    }, 1000);
  }

  private async runJob(job: Job) {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      this.updateJobStatus(job.id, "failed", undefined, new Error(`No worker handler for: ${job.name}`));
      return;
    }

    this.updateJobStatus(job.id, "running");
    
    await hardenedEventBus.publish({
      name: "JobStarted",
      source: "JobQueue",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "temp",
      payload: {
        jobId: job.id,
        jobName: job.name,
        priority: job.priority
      }
    });

    // Checkpoint callback closure
    const checkpointCallback = async (checkpointState: any) => {
      const checkpointLog: WorkflowCheckpoint = {
        jobId: job.id,
        stageName: job.status,
        progress: job.progress,
        checkpointState,
        timestamp: new Date().toISOString()
      };
      this.saveCheckpoint(checkpointLog);
    };

    try {
      const result = await handler(job, checkpointCallback);
      this.updateJobStatus(job.id, "completed", result);
      
      await hardenedEventBus.publish({
        name: "JobCompleted",
        source: "JobQueue",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: {
          jobId: job.id,
          jobName: job.name,
          result
        }
      });
    } catch (err: any) {
      if (job.status === "cancelled") {
        return; // Marked cancelled explicitly
      }

      // Trigger Saga compensation
      const compensator = this.compensations.get(job.name);
      if (compensator) {
        try {
          await compensator(job);
        } catch (compErr: any) {
          console.error(`[JobQueue:CompensationFailed] Saga failed to revert state:`, compErr.message);
        }
      }

      const retryPolicy = job.retryPolicy;
      if (retryPolicy.currentAttempt < retryPolicy.maxRetries) {
        retryPolicy.currentAttempt++;
        this.updateJobStatus(job.id, "retrying");
        console.log(`[JobQueue] Saga failed. Retrying attempt ${retryPolicy.currentAttempt}/${retryPolicy.maxRetries}...`);
        
        const delay = retryPolicy.backoffType === "exponential" 
          ? retryPolicy.backoffDelayMs * Math.pow(2, retryPolicy.currentAttempt - 1)
          : retryPolicy.backoffDelayMs;
          
        setTimeout(() => {
          this.jobs.set(job.id, {
            ...this.jobs.get(job.id)!,
            status: "queued"
          });
          this.saveJobs();
        }, delay);
      } else {
        this.updateJobStatus(job.id, "failed", undefined, err);
        
        await hardenedEventBus.publish({
          name: "JobFailed",
          source: "JobQueue",
          version: "v1",
          priority: "high",
          securityClassification: "internal",
          retentionPolicy: "temp",
          payload: {
            jobId: job.id,
            jobName: job.name,
            error: {
              message: err.message || "Unknown error occurred"
            }
          }
        });
      }
    }
  }

  private saveCheckpoint(cp: WorkflowCheckpoint) {
    try {
      let list: WorkflowCheckpoint[] = [];
      if (fs.existsSync(this.checkpointsDbPath)) {
        list = JSON.parse(fs.readFileSync(this.checkpointsDbPath, "utf-8"));
      }
      list.push(cp);
      fs.writeFileSync(this.checkpointsDbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[JobQueue] Failed to write checkpoint:", err);
    }
  }

  private updateJobStatus(id: string, status: TaskStatus, result?: any, error?: Error) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = status;
    if (status === "running") {
      job.startedAt = new Date().toISOString();
    } else if (status === "completed") {
      job.completedAt = new Date().toISOString();
      job.result = result;
      job.progress = 100;
    } else if (status === "failed") {
      job.completedAt = new Date().toISOString();
      job.errors.push({
        message: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
        stack: error?.stack
      });
    }
    
    this.jobs.set(id, { ...job });
    this.saveJobs();
  }

  private updateJobProgress(id: string, progress: number) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.progress = progress;
    this.jobs.set(id, { ...job });
    this.saveJobs();
  }

  public registerWorker(name: string, handler: (job: Job, cp: (state: any) => Promise<void>) => Promise<any>, compensation?: (job: Job) => Promise<void>) {
    this.handlers.set(name, handler);
    if (compensation) {
      this.compensations.set(name, compensation);
    }
    console.log(`[JobQueue] Registered resilient handler: ${name}`);
  }

  // IJobQueue implementations
  public async add<TPayload = any, TResult = any>(
    name: string,
    payload: TPayload,
    options?: { priority?: Priority; retryPolicy?: Partial<RetryPolicy> }
  ): Promise<Job<TPayload, TResult>> {
    const id = "job-" + crypto.randomBytes(8).toString("hex");
    const job: Job = {
      id,
      name,
      payload,
      status: "queued",
      priority: options?.priority || "medium",
      progress: 0,
      retryPolicy: {
        maxRetries: options?.retryPolicy?.maxRetries ?? 2,
        backoffType: options?.retryPolicy?.backoffType ?? "constant",
        backoffDelayMs: options?.retryPolicy?.backoffDelayMs ?? 1000,
        currentAttempt: 0
      },
      errors: [],
      createdAt: new Date().toISOString()
    };

    this.jobs.set(id, job);
    this.saveJobs();
    return job as any;
  }

  public async getJob(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null;
  }

  public async getJobs(filter?: { status?: TaskStatus; name?: string }): Promise<Job[]> {
    let list = Array.from(this.jobs.values());
    if (filter) {
      if (filter.status) {
        list = list.filter((j) => j.status === filter.status);
      }
      if (filter.name) {
        list = list.filter((j) => j.name === filter.name);
      }
    }
    return list;
  }

  public async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === "queued" || job.status === "running" || job.status === "retrying") {
      job.status = "cancelled";
      job.completedAt = new Date().toISOString();
      this.jobs.set(id, { ...job });
      this.saveJobs();
      return true;
    }
    return false;
  }

  public async pauseJob(id: string): Promise<boolean> {
    if (this.jobs.has(id)) {
      this.pausedJobs.add(id);
      console.log(`[JobQueue] Saga paused: ${id}`);
      return true;
    }
    return false;
  }

  public async resumeJob(id: string): Promise<boolean> {
    if (this.pausedJobs.has(id)) {
      this.pausedJobs.delete(id);
      console.log(`[JobQueue] Saga resumed: ${id}`);
      return true;
    }
    return false;
  }

  public async retryJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === "failed" || job.status === "cancelled") {
      job.status = "queued";
      job.progress = 0;
      job.retryPolicy.currentAttempt = 0;
      job.errors = [];
      this.jobs.set(id, { ...job });
      this.saveJobs();
      return true;
    }
    return false;
  }

  public async clearQueue(): Promise<void> {
    this.jobs.clear();
    this.saveJobs();
  }

  public shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

export const jobQueue = ResilientJobQueue.getInstance();
export default jobQueue;
