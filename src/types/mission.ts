// src/types/mission.ts

export type MissionStatus =
  | "CREATED"
  | "PLANNING"
  | "EXECUTING"
  | "REFLECTING"
  | "COMPLETED"
  | "FAILED";

export interface MissionMetrics {
  totalExecutions: number;
  totalDurationMs: number;
  failuresCount: number;
  costUsd: number;
  tokensSpent: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  score?: number;
  confidence?: number;
  completeness?: number;
  quality?: number;
  coverage?: number;
  risk?: number;
}

export interface MissionEvaluation {
  timestamp: string;
  score: number;             // Overall Score (0-100)
  confidence: number;        // Confidence (0-100)
  completeness: number;      // Completeness (0-100)
  quality: number;           // Quality (0-100)
  coverage: number;          // Coverage (0-100)
  risk: number;              // Risk (0-100)
  remainingWork: string[];   // Remaining Work items
  decision: "continue" | "expand_graph" | "spawn_agent" | "escalate_hitl" | "complete" | "failed";
}

export interface MissionReflection {
  timestamp: string;
  objectiveAchieved: boolean;
  artifactsComplete: boolean;
  confidenceThresholdsMet: boolean;
  additionalResearchRequired: boolean;
  failuresAffectQuality: boolean;
  shouldContinue: boolean;
  shouldSpawnAgents: boolean;
  shouldExpandWorkflows: boolean;
  gapAnalysis: string[];
}

export interface Mission {
  id: string;
  name: string;
  goals: string[];
  constraints: string[];
  status: MissionStatus;
  history: string[]; // Timeline events of the mission
  decisions: string[]; // Decision logs
  artifacts: string[]; // Generated artifacts (paths/ids)
  evaluations: MissionEvaluation[];
  confidence: number; // threshold, e.g. 80.0
  lessons: string[];
  metrics: MissionMetrics;
  createdAt: string;
  updatedAt: string;
  activeExecutionId?: string;
}
