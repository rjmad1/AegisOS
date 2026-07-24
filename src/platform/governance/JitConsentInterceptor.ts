import { EventEmitter } from 'events';
import { logger } from '../../infrastructure/observability/structured-logger';
import { IdentityAwareToolContext, ToolConsentRequest, ToolConsentResult } from '../mcp/contracts';

export interface JitConsentConfig {
  defaultTimeoutMs?: number;
  autoApproveReadonlyTools?: boolean;
}

/**
 * JitConsentInterceptor pauses MCP tool invocations mid-flight when step-up user consent or authorization
 * is required, emitting approval events to Console/Mobile channels and awaiting dynamic user response.
 */
export class JitConsentInterceptor extends EventEmitter {
  private pendingRequests: Map<string, {
    request: ToolConsentRequest;
    resolve: (result: ToolConsentResult) => void;
    timer: NodeJS.Timeout;
  }> = new Map();

  private defaultTimeoutMs: number;
  private autoApproveReadonly: boolean;

  constructor(config?: JitConsentConfig) {
    super();
    this.defaultTimeoutMs = config?.defaultTimeoutMs || 300000; // 5 minutes default
    this.autoApproveReadonly = config?.autoApproveReadonlyTools ?? false;
  }

  /**
   * Determines if a tool invocation requires dynamic Just-In-Time user consent
   */
  public requiresConsent(toolName: string, args: Record<string, unknown>, context: IdentityAwareToolContext): boolean {
    const readonlyPrefixes = ['get', 'list', 'search', 'read', 'fetch', 'describe'];
    const isReadonly = readonlyPrefixes.some(prefix => toolName.toLowerCase().startsWith(prefix));

    if (isReadonly && this.autoApproveReadonly) {
      return false;
    }

    // Require consent for high-impact write operations or explicitly protected tool patterns
    const protectedKeywords = ['send', 'delete', 'update', 'post', 'create', 'execute', 'write', 'sharepoint', 'onedrive', 'drive'];
    const matchesProtected = protectedKeywords.some(keyword => toolName.toLowerCase().includes(keyword));

    return matchesProtected;
  }

  /**
   * Intercepts tool call execution, emitting JIT authorization request and returning a promise
   * that resolves when the user approves, rejects, or times out.
   */
  public async interceptAndRequestConsent(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
    context: IdentityAwareToolContext,
    requiredProviderId?: string,
    requiredScopes?: string[]
  ): Promise<ToolConsentResult> {
    const requestId = `jit-consent-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const request: ToolConsentRequest = {
      id: requestId,
      serverId,
      toolName,
      requiredProviderId,
      requiredScopes,
      context,
      arguments: args,
      createdAt: new Date(),
      status: 'PENDING',
    };

    logger.warn(`[JIT-CONSENT] Intercepting tool invocation "${toolName}" for User ${context.userId} / Agent ${context.agentId}`);

    return new Promise<ToolConsentResult>((resolve) => {
      const timer = setTimeout(() => {
        logger.error(`[JIT-CONSENT] Request ${requestId} timed out after ${this.defaultTimeoutMs}ms.`);
        this.pendingRequests.delete(requestId);
        resolve({
          approved: false,
          reason: `Step-up user authorization request timed out after ${this.defaultTimeoutMs / 1000}s.`,
        });
      }, this.defaultTimeoutMs);

      this.pendingRequests.set(requestId, { request, resolve, timer });

      // Emit event for AegisOS Console Portal WebSocket & Command Bus
      this.emit('consent_required', request);
    });
  }

  /**
   * Resolves a pending JIT consent request when user approves or rejects via Console or C2 Mobile
   */
  public resolveConsentRequest(requestId: string, result: ToolConsentResult): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      logger.warn(`[JIT-CONSENT] No pending request found for ID: ${requestId}`);
      return false;
    }

    clearTimeout(pending.timer);
    this.pendingRequests.delete(requestId);

    logger.info(`[JIT-CONSENT] Request ${requestId} resolved: Approved=${result.approved} by User ${result.authorizedByUserId || 'unknown'}`);
    pending.resolve(result);
    return true;
  }

  /**
   * Returns all active pending consent requests
   */
  public getPendingRequests(): ToolConsentRequest[] {
    return Array.from(this.pendingRequests.values()).map(p => p.request);
  }
}
