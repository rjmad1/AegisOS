import { z } from 'zod';

export type CommandType = 'CLICK' | 'TYPE' | 'NAVIGATE' | 'HOVER' | 'EXTRACT' | 'WAIT_FOR';

export const CommandTypeSchema = z.enum([
  'CLICK',
  'TYPE',
  'NAVIGATE',
  'HOVER',
  'EXTRACT',
  'WAIT_FOR',
]);

export interface ActionCommand {
  commandType: CommandType;
  selector?: string;
  value?: string;
  url?: string;
  timeoutMs?: number;
}

export const ActionCommandSchema = z.object({
  commandType: CommandTypeSchema,
  selector: z.string().optional(),
  value: z.string().optional(),
  url: z.string().url().optional(),
  timeoutMs: z.number().int().positive().optional().default(5000),
});

export interface ExecutionResult {
  success: boolean;
  resultingDomHash: string;
  resultingDomSnapshot?: string;
  errorDetail?: string;
  evidenceId: string;
  networkIdle: boolean;
}

export const ExecutionResultSchema = z.object({
  success: z.boolean(),
  resultingDomHash: z.string(),
  resultingDomSnapshot: z.string().optional(),
  errorDetail: z.string().optional(),
  evidenceId: z.string(),
  networkIdle: z.boolean(),
});

export interface SystemError {
  code: 'TIMEOUT' | 'SELECTOR_NOT_FOUND' | 'NETWORK_FAILURE' | 'LLM_FAILURE' | 'BROWSER_CRASH';
  message: string;
  stack?: string;
}

export const SystemErrorSchema = z.object({
  code: z.enum([
    'TIMEOUT',
    'SELECTOR_NOT_FOUND',
    'NETWORK_FAILURE',
    'LLM_FAILURE',
    'BROWSER_CRASH',
  ]),
  message: z.string(),
  stack: z.string().optional(),
});
