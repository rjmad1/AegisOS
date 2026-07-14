export type CommandType =
  // Infrastructure
  | "infrastructure:start_service"
  | "infrastructure:stop_service"
  | "infrastructure:restart_service"
  | "infrastructure:reload_service"
  | "infrastructure:update_configuration"
  | "infrastructure:health_check"
  // AI Runtime
  | "ai:load_model"
  | "ai:unload_model"
  | "ai:download_model"
  | "ai:delete_model"
  | "ai:switch_default_model"
  | "ai:benchmark_model"
  // Agent
  | "agent:start"
  | "agent:pause"
  | "agent:resume"
  | "agent:terminate"
  | "agent:assign_model"
  | "agent:assign_tools"
  // Knowledge
  | "knowledge:reindex"
  | "knowledge:refresh_embeddings"
  | "knowledge:import_documents"
  | "knowledge:delete_documents"
  // Workflow
  | "workflow:execute"
  | "workflow:pause"
  | "workflow:resume"
  | "workflow:cancel"
  | "workflow:retry"
  // System
  | "system:shutdown"
  | "system:restart"
  | "system:sleep"
  | "system:lock"
  | "system:update"
  | "system:backup";

export type CommandStatus =
  | "QUEUED"
  | "PENDING_APPROVAL"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ROLLED_BACK";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ApprovalType = "AUTO" | "MANUAL" | "MULTI_STAGE" | "EMERGENCY";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "BYPASSED";

export interface ApproverDecision {
  userId: string;
  userEmail: string;
  action: "APPROVED" | "REJECTED";
  timestamp: string;
  signature?: string; // Digital signature from device secure enclave
}

export interface CommandRequest {
  type: CommandType;
  priority?: Priority;
  payload: Record<string, any>;
  origin: "mobile" | "console" | "system";
  
  // Security parameters
  deviceId?: string;
  signature?: string;     // Cryptographic signature over command details
  replayNonce?: string;   // Unique string/UUID
  timestamp?: number;     // Epoch ms to protect against clock skew / replay
  
  // Override flag
  emergencyOverride?: boolean;
}

export interface CommandDefinition {
  id: string;
  type: CommandType;
  status: CommandStatus;
  priority: Priority;
  payload: Record<string, any>;
  riskLevel: RiskLevel;
  
  userId?: string | null;
  userEmail?: string | null;
  deviceId?: string | null;
  origin: string;
  signature?: string | null;
  replayNonce?: string | null;
  expiresAt?: Date | null;

  approvalType: ApprovalType;
  approvalStatus: ApprovalStatus;
  approvers: ApproverDecision[];
  approvalTimeout?: Date | null;

  scheduledAt: Date;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  
  retryCount: number;
  maxRetries: number;
  nextAttemptAt?: Date | null;
  errorMessage?: string | null;
  result?: Record<string, any> | null;
  rollbackResult?: Record<string, any> | null;

  rollbackPayload?: Record<string, any> | null;
  rolledBackAt?: Date | null;
  rolledBackBy?: string | null;
}
