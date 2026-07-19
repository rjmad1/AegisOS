/**
 * Performance Governance Framework (PGF) Type Definitions
 * 
 * Treats benchmark baselines as versioned engineering contracts.
 */
import { BenchmarkProvenanceManifest } from '../benchmarking/types';

export enum RegressionCategory {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum RegressionDecision {
  NO_REGRESSION = 'NO_REGRESSION',
  EXPECTED_VARIATION = 'EXPECTED_VARIATION',
  WARNING = 'WARNING',
  CONFIRMED_REGRESSION = 'CONFIRMED_REGRESSION',
  CRITICAL_REGRESSION = 'CRITICAL_REGRESSION'
}

export interface ApprovedThresholds {
  [metricName: string]: {
    maxAcceptableValue: number;
    regressionCategory: RegressionCategory;
  }
}

export interface PerformanceContract {
  id: string;
  platformVersion: string;
  architectureVersion: string;
  gitCommit: string;
  benchmarkSuiteVersion: string;
  provenance: BenchmarkProvenanceManifest;
  hardwareProfile: Record<string, string>;
  runtimeConfiguration: Record<string, unknown>;
  observedMetrics: Record<string, number>;
  approvedThresholds: ApprovedThresholds;
  statisticalConfidence: number;
  approvalMetadata: {
    approvedBy: string;
    approvedAt: number;
  };
}

export interface PerformanceExceptionRecord {
  id: string;
  reason: string;
  affectedBenchmarks: string[];
  expirationTimestamp: number;
  owner: string;
  approval: {
    approvedBy: string;
    approvedAt: number;
  };
  rollbackPlan: string;
}

export interface BudgetAllocation {
  budget: string | number;
  unit: 'ms' | 'MB' | 'GB' | 'percent' | 'count';
}

export interface ArchitecturalBudgetContract {
  id: string;
  subsystem: string;
  allocations: Record<string, BudgetAllocation>;
}

export interface BudgetViolation {
  metric: string;
  budgeted: number;
  observed: number;
  unit: string;
  exceedancePercentage: number;
  message: string;
}

export interface BudgetEvaluationResult {
  passed: boolean;
  violations: BudgetViolation[];
}
