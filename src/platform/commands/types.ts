// ============================================================================
// Command Palette — Types
// ============================================================================

import type { ComponentType } from 'react';

export type CommandCategory =
  | 'navigation'
  | 'commands'
  | 'settings'
  | 'search'
  | 'quick-actions'
  | string;

export type CommandExecutionOutcome = 'SUCCESS' | 'FAILURE' | 'PENDING' | 'CANCELLED';

export interface CommandContext {
  userId: string;
  tenantId: string;
  userRole?: string;
  activeEntity?: string;
  metadataSchema?: any;
  dryRun?: boolean;
}

export interface ExecutionResult<T = any> {
  outcome: CommandExecutionOutcome;
  data?: T;
  error?: string;
  correlationId: string;
  executionDurationMs: number;
}

export interface PlatformCommand<TPayload = any, TResult = any> {
  id: string;
  title: string;
  name?: string; // Alias for title
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  category: CommandCategory;
  shortcut?: string;
  action?: () => void | Promise<void>;
  when?: () => boolean;
  isPinned?: boolean;
  priority?: number;
  moduleId?: string;

  // Governed execution extensions
  requiresConfirmation?: boolean;
  auditClassification?: 'ROUTINE' | 'SENSITIVE' | 'CRITICAL';
  validate?: (payload: TPayload, context: CommandContext) => Promise<boolean | string>;
  execute?: (payload: TPayload, context: CommandContext) => Promise<ExecutionResult<TResult>>;
  rollback?: (correlationId: string, context: CommandContext) => Promise<boolean>;
}
