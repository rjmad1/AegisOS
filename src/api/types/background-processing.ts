export type TaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "critical";

export interface RetryPolicy {
  maxRetries: number;
  backoffType: "constant" | "exponential";
  backoffDelayMs: number;
  currentAttempt: number;
}

export interface Job<TPayload = any, TResult = any> {
  id: string;
  name: string;
  payload: TPayload;
  result?: TResult;
  status: TaskStatus;
  priority: Priority;
  progress: number; // 0 to 100
  retryPolicy: RetryPolicy;
  errors: Array<{
    message: string;
    timestamp: string;
    stack?: string;
  }>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface IJobQueue {
  add<TPayload = any, TResult = any>(
    name: string,
    payload: TPayload,
    options?: { priority?: Priority; retryPolicy?: Partial<RetryPolicy> }
  ): Promise<Job<TPayload, TResult>>;

  getJob(id: string): Promise<Job | null>;
  getJobs(filter?: { status?: TaskStatus; name?: string }): Promise<Job[]>;
  cancelJob(id: string): Promise<boolean>;
  retryJob(id: string): Promise<boolean>;
  clearQueue(): Promise<void>;
}

export interface IJobWorker<TPayload = any, TResult = any> {
  name: string;
  concurrency: number;
  registerHandler(handler: (job: Job<TPayload, TResult>) => Promise<TResult>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isProcessing(): boolean;
}

export interface IPipelineStage<TInput = any, TOutput = any> {
  name: string;
  execute(input: TInput, context: { jobId: string; stageIndex: number }): Promise<TOutput>;
}

export interface IPipeline<TInput = any, TOutput = any> {
  id: string;
  name: string;
  stages: IPipelineStage[];
  addStage<TStageInput, TStageOutput>(stage: IPipelineStage<TStageInput, TStageOutput>): IPipeline<TInput, TStageOutput>;
  execute(input: TInput): Promise<TOutput>;
  getProgress(): { currentStageIndex: number; totalStages: number; percentage: number };
}
