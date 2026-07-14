// src/modules/developer/kanban/KanbanOrchestrator.ts

import { IKanbanOrchestrator, IKanbanTask, ICreateTaskRequest, ITaskActionResult } from './types';

export class KanbanOrchestrator implements IKanbanOrchestrator {
  private get backendUrl(): string {
    return process.env.KANBAN_BACKEND_URL || 'http://localhost:8080';
  }

  async triggerTask(taskId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/tasks/${taskId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.ok;
    } catch (err) {
      console.error('[KanbanOrchestrator] Failed to trigger task:', err);
      return false;
    }
  }

  async getTasks(): Promise<IKanbanTask[]> {
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/tasks`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error('[KanbanOrchestrator] Failed to fetch tasks:', err);
      return [];
    }
  }

  async createTask(request: ICreateTaskRequest): Promise<ITaskActionResult> {
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!res.ok) {
        return { success: false, taskId: '', message: `Backend returned status ${res.status}` };
      }
      return await res.json();
    } catch (err: any) {
      console.error('[KanbanOrchestrator] Failed to create task:', err);
      return { success: false, taskId: '', message: err.message || 'Network error' };
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.backendUrl}/api/v1/tasks/${taskId}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err) {
      console.error('[KanbanOrchestrator] Failed to delete task:', err);
      return false;
    }
  }
}
