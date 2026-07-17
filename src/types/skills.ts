// src/types/skills.ts
// Core interfaces and data models for the AegisOS Skill Framework

export interface SandboxPolicy {
  allowNetwork: boolean;
  allowedHosts: string[];
  allowFileSystem: boolean;
  allowedPaths: string[];
  maxMemoryMb?: number;
  cpuLimit?: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  purpose: string;
  domain: string;
  version: string;
  status: "enabled" | "disabled" | "degraded";
  triggers: string[];
  prerequisites: string[];
  dependencies: string[];
  supportedTools: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  confidenceScore: number;
  executionCost: number;
  latencyMs: number;
  sandboxPolicy: SandboxPolicy;
  permissions: string[];
  metadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillExecutionStep {
  id: string;
  name: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  timestamp: string;
  durationMs?: number;
  message?: string;
}

export interface SkillExecutionRecord {
  id: string;
  skillId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "paused";
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  durationMs?: number;
  cost?: number;
  trace: SkillExecutionStep[];
  retryCount: number;
  maxRetries: number;
  parentId?: string;
  workflowId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillMetric {
  skillId: string;
  totalExecutions: number;
  successRate: number;
  avgDurationMs: number;
  avgCost: number;
  sandboxViolations: number;
}

export interface DiscoveryResult {
  skill: SkillDefinition;
  confidenceScore: number;
  matchType: "trigger" | "domain" | "semantic";
}
