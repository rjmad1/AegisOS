import { z } from 'zod';
import { ActionCommand } from './commands';

export interface NavigationNode {
  nodeId: string;
  url: string;
  domHash: string;
  discoveredAt: string;
  interactables: Array<{
    selector: string;
    tagName: string;
    text?: string;
  }>;
}

export interface NavigationEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId?: string;
  actionTaken: ActionCommand;
  visited: boolean;
  visitCount: number;
}

export interface SessionState {
  sessionId: string;
  targetUrl: string;
  status: 'INITIALIZING' | 'RUNNING' | 'SUMMARIZING' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowGoal {
  goalId: string;
  sessionId: string;
  description: string;
  priority: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface CheckpointState {
  checkpointId: string;
  sessionId: string;
  nodeId: string;
  cookies: Record<string, string>;
  localStorage: Record<string, string>;
  createdAt: string;
}

export interface DefectRecord {
  defectId: string;
  sessionId: string;
  nodeId: string;
  severity: 'minor' | 'moderate' | 'critical';
  validatorType: string;
  summary: string;
  explanation: string;
  reproductionScript: string;
  createdAt: string;
}
