/**
 * Platform Validation Framework — Core Contracts
 *
 * Shared types for all validation disciplines (Chaos, Endurance, Scalability).
 * Every validation orchestrator implements IValidationOrchestrator and produces
 * ValidationResult with ValidationEvidence for the PQF evidence pipeline.
 */

import type { TraceID, ExecutionID } from '../observability/types';

// ---------------------------------------------------------------------------
// Status & Severity
// ---------------------------------------------------------------------------

export type ValidationStatus = 'PASS' | 'FAIL' | 'WARNING' | 'RUNNING' | 'SKIPPED';

export type ValidationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

// ---------------------------------------------------------------------------
// Provenance — links every result to its origin
// ---------------------------------------------------------------------------

export interface ValidationProvenance {
  traceId: TraceID;
  executionId: ExecutionID;
  gitSha: string;
  platformVersion: string;
  timestamp: string;
  generatorId: string;
  generatorVersion: string;
  parentEvidenceHashes?: string[];
}

// ---------------------------------------------------------------------------
// Evidence — immutable record attached to every validation result
// ---------------------------------------------------------------------------

export interface ValidationEvidence {
  provenance: ValidationProvenance;
  contentHash: string;          // SHA-256 of the serialized evidence payload
  metrics?: Record<string, number>;
  logs?: string[];
  traces?: string[];
  artifacts?: string[];
  resourceProfile?: {
    peakMemoryMB: number;
    peakCpuPercent: number;
    gpuMemoryMB?: number;
  };
  digitalTwinSnapshot?: string; // Path or hash reference
}

// ---------------------------------------------------------------------------
// Result — the uniform output of any validation run
// ---------------------------------------------------------------------------

export interface ValidationResult {
  id: string;
  name: string;
  domain: ValidationDomain;
  status: ValidationStatus;
  score: number;                // 0–100
  durationMs: number;
  timestamp: string;
  message?: string;
  evidence: ValidationEvidence;
  children?: ValidationResult[];
  blockingIssues?: BlockingIssue[];
}

export type ValidationDomain =
  | 'chaos'
  | 'endurance'
  | 'scalability'
  | 'benchmark'
  | 'certification'
  | 'security'
  | 'governance'
  | 'architecture'
  | 'replay';

// ---------------------------------------------------------------------------
// Blocking Issues — prevent qualification from passing
// ---------------------------------------------------------------------------

export interface BlockingIssue {
  id: string;
  severity: ValidationSeverity;
  domain: ValidationDomain;
  description: string;
  evidence?: string;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// Orchestrator Contract — every validation domain implements this
// ---------------------------------------------------------------------------

export interface IValidationOrchestrator {
  readonly domain: ValidationDomain;
  execute(profileId: string): Promise<ValidationResult>;
  getAvailableProfiles(): string[];
}
