// src/modules/developer/kanban/types.ts

export interface IKanbanTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'failed';
  gitBranch: string;
  worktreePath: string;
  executorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateTaskRequest {
  title: string;
  description: string;
  executorId: string;
  baseBranch?: string;
}

export interface ITaskActionResult {
  success: boolean;
  taskId: string;
  message?: string;
}

export interface IKanbanOrchestrator {
  triggerTask(taskId: string): Promise<boolean>;
  getTasks(): Promise<IKanbanTask[]>;
  createTask(request: ICreateTaskRequest): Promise<ITaskActionResult>;
  deleteTask(taskId: string): Promise<boolean>;
}
