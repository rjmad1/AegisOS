/**
 * Versioned public contracts for Identity-Aware Model Context Protocol (MCP) Subsystem in AegisOS.
 * Adheres to Article III of the AegisOS Engineering Constitution.
 */

export interface IdentityAwareToolContext {
  userId: string;
  agentId: string;
  tenantId?: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  sessionToken?: string;
  requestOrigin?: string;
}

export interface ToolConsentRequest {
  id: string;
  serverId: string;
  toolName: string;
  requiredProviderId?: string;
  requiredScopes?: string[];
  context: IdentityAwareToolContext;
  arguments: Record<string, unknown>;
  createdAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export interface ToolConsentResult {
  approved: boolean;
  authorizedByUserId?: string;
  reason?: string;
  approvedScopes?: string[];
}

export interface ToolExecutionOptions {
  timeoutMs?: number;
  environment?: Record<string, string>;
  sandboxMode?: 'PROCESS' | 'DOCKER' | 'NONE';
}

export interface SanitizedToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  executionDurationMs: number;
  secretsStrippedCount: number;
}
