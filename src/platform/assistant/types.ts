export interface IntentResult {
  name: "service_control" | "model_management" | "telemetry_view" | "agent_control" | "knowledge_control" | "system_backup" | "explain_telemetry" | "general_chat";
  confidence: number;
}

export interface EntityResult {
  name: string;
  value: string;
}

export interface PlanStep {
  description: string;
  commandType: string;
  payload: Record<string, any>;
  estimatedDurationMs: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ExecutionPlan {
  steps: PlanStep[];
  totalDurationMs: number;
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rollbackAvailable: boolean;
  approvalRequired: boolean;
}

export interface AssistantMetrics {
  planningLatencyMs: number;
  llmLatencyMs: number;
  planSuccess: boolean;
}
