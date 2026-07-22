import { z } from 'zod';
import { ActionCommandSchema, ActionCommand } from './commands';

export interface NodeDiscoveredEvent {
  sessionId: string;
  nodeId: string;
  url: string;
  domHash: string;
  interactableCount: number;
}

export const NodeDiscoveredEventSchema = z.object({
  sessionId: z.string().uuid(),
  nodeId: z.string(),
  url: z.string(),
  domHash: z.string(),
  interactableCount: z.number().int().nonnegative(),
});

export interface DefectLoggedEvent {
  sessionId: string;
  defectId: string;
  nodeId: string;
  validatorType: string;
  severity: 'minor' | 'moderate' | 'critical';
  summary: string;
  reproductionPath: ActionCommand[];
}

export const DefectLoggedEventSchema = z.object({
  sessionId: z.string().uuid(),
  defectId: z.string(),
  nodeId: z.string(),
  validatorType: z.string(),
  severity: z.enum(['minor', 'moderate', 'critical']),
  summary: z.string(),
  reproductionPath: z.array(ActionCommandSchema),
});

export interface SessionStartedEvent {
  sessionId: string;
  targetUrl: string;
  environment: string;
  maxWorkers: number;
}

export const SessionStartedEventSchema = z.object({
  sessionId: z.string().uuid(),
  targetUrl: z.string().url(),
  environment: z.string(),
  maxWorkers: z.number().int().positive(),
});

export interface WorkflowCompletedEvent {
  sessionId: string;
  workflowId: string;
  goalDescription: string;
  status: 'COMPLETED' | 'FAILED' | 'ABANDONED';
  durationMs: number;
}

export const WorkflowCompletedEventSchema = z.object({
  sessionId: z.string().uuid(),
  workflowId: z.string(),
  goalDescription: z.string(),
  status: z.enum(['COMPLETED', 'FAILED', 'ABANDONED']),
  durationMs: z.number().int().nonnegative(),
});
