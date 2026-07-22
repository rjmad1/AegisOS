import { z } from 'zod';

export interface ValidationFailure {
  validator: 'axe-core' | 'pixelmatch' | 'schemathesis' | 'network-idle' | 'console-error';
  severity: 'minor' | 'moderate' | 'critical';
  summary: string;
  rawOutput: Record<string, unknown>;
}

export const ValidationFailureSchema = z.object({
  validator: z.enum(['axe-core', 'pixelmatch', 'schemathesis', 'network-idle', 'console-error']),
  severity: z.enum(['minor', 'moderate', 'critical']),
  summary: z.string(),
  rawOutput: z.record(z.string(), z.unknown()),
});

export interface ValidationReport {
  nodeId: string;
  passed: boolean;
  violations: ValidationFailure[];
}

export const ValidationReportSchema = z.object({
  nodeId: z.string(),
  passed: z.boolean(),
  violations: z.array(ValidationFailureSchema),
});

export interface EvidenceManifest {
  sessionId: string;
  nodeId: string;
  artifacts: Array<{
    type: 'SCREENSHOT' | 'HAR' | 'TRACE' | 'CONSOLE' | 'VIDEO';
    storageUri: string;
    sizeBytes: number;
    checksum: string;
  }>;
}

export interface TokenEvent {
  agentName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  correlationId: string;
}
