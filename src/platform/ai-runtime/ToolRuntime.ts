import { ToolDefinition, ToolExecutionMetrics, AIRuntimeContext } from "./types";
import { policyEnforcer } from "../../infrastructure/security/policy-enforcer";

export class ToolRuntime {
  private static instance: ToolRuntime | null = null;
  private tools: Map<string, ToolDefinition> = new Map();
  private metrics: Map<string, ToolExecutionMetrics> = new Map();
  private auditLogs: { timestamp: string; toolId: string; status: string; userId?: string; error?: string }[] = [];

  private constructor() {
    this.seedDefaultTools();
  }

  public static getInstance(): ToolRuntime {
    if (!ToolRuntime.instance) {
      ToolRuntime.instance = new ToolRuntime();
    }
    return ToolRuntime.instance;
  }

  private seedDefaultTools(): void {
    const defaultTools: ToolDefinition[] = [
      {
        id: "tool:filesystem:read",
        name: "Read Local File",
        description: "Reads the text contents of a file on the local filesystem.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to local file." },
          },
          required: ["path"],
        },
        permissionsRequired: ["fs:read"],
        sandboxLevel: "partial",
        version: "1.0.0",
        enabled: true,
      },
      {
        id: "tool:filesystem:write",
        name: "Write Local File",
        description: "Overwrites or creates a file on the local filesystem. DANGEROUS.",
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path." },
            content: { type: "string", description: "File content payload." },
          },
          required: ["path", "content"],
        },
        permissionsRequired: ["fs:write", "fs:read"],
        sandboxLevel: "none", // High risk
        version: "1.0.0",
        enabled: true,
      },
      {
        id: "tool:web:search",
        name: "Web Crawler Search",
        description: "Executes a web search query for external information retrieval.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query string." },
          },
          required: ["query"],
        },
        permissionsRequired: ["network:outbound"],
        sandboxLevel: "full",
        version: "1.2.0",
        enabled: true,
      },
    ];

    for (const t of defaultTools) {
      this.registerTool(t);
    }
  }

  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
    this.metrics.set(tool.id, {
      invocations: 0,
      successRate: 1.0,
      avgLatencyMs: 0,
      lastExecution: "",
      errorsCount: 0,
    });
  }

  public getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  public getMetrics(id: string): ToolExecutionMetrics | undefined {
    return this.metrics.get(id);
  }

  public getAuditLogs(): typeof this.auditLogs {
    return this.auditLogs;
  }

  /**
   * Executes a tool in the simulated sandbox, checking security policies,
   * RBAC authorization, and tracking usage telemetry.
   */
  public async executeTool(
    id: string,
    params: Record<string, any>,
    context: AIRuntimeContext
  ): Promise<any> {
    const start = Date.now();
    const tool = this.getTool(id);
    const m = this.metrics.get(id)!;

    if (!tool) {
      throw new Error(`ToolRuntime: Tool "${id}" not found.`);
    }

    if (!tool.enabled) {
      throw new Error(`ToolRuntime: Tool "${id}" is disabled.`);
    }

    // 1. Policy check: Check if user has necessary roles for requested permissions
    const userId = context.userId || "usr-admin-01";
    // Check RBAC permissions
    if (tool.permissionsRequired.includes("fs:write")) {
      const isAuthorized = policyEnforcer.authorizeRole(userId, "admin");
      if (!isAuthorized) {
        this.logAudit(id, "permission_denied", userId, "User role unauthorized for write operations");
        m.invocations++;
        m.errorsCount++;
        m.successRate = (m.invocations - m.errorsCount) / m.invocations;
        throw new Error(`ToolRuntime: Access denied. Action requires Admin role.`);
      }
    }

    // 2. Policy check: Guardrails for dangerous system calls
    if (id === "tool:filesystem:write") {
      const dangerousPrefix = policyEnforcer.requireHumanApproval(`rm ${params.path}`);
      if (dangerousPrefix) {
        this.logAudit(id, "approval_required", userId, "Write matches dangerous shell patterns");
        throw new Error(`ToolRuntime: Execution blocked. Requires human-in-the-loop manual approval.`);
      }
    }

    // 3. Simulated Sandbox Execution
    try {
      let result: any = null;

      // Sandbox constraint simulations
      if (tool.sandboxLevel === "full") {
        // Full sandbox executes in hyper-isolated simulator
        result = `[Sandbox:Full] Executed search for: "${params.query || ""}". Returns: 3 Mock results matching query.`;
      } else if (tool.sandboxLevel === "partial") {
        // Read file mock
        result = `[Sandbox:Partial] Read file path: "${params.path || ""}". Content: Mock content of ${params.path}.`;
      } else {
        // No sandbox (raw execution simulator)
        result = `[Sandbox:None] Executed filesystem write to ${params.path}. Success.`;
      }

      const elapsed = Date.now() - start;
      
      // Update metrics
      m.invocations++;
      m.lastExecution = new Date().toISOString();
      m.avgLatencyMs = (m.avgLatencyMs * (m.invocations - 1) + elapsed) / m.invocations;
      m.successRate = (m.invocations - m.errorsCount) / m.invocations;

      this.logAudit(id, "success", userId);

      return result;
    } catch (err: any) {
      const elapsed = Date.now() - start;
      m.invocations++;
      m.errorsCount++;
      m.avgLatencyMs = (m.avgLatencyMs * (m.invocations - 1) + elapsed) / m.invocations;
      m.successRate = (m.invocations - m.errorsCount) / m.invocations;
      m.lastExecution = new Date().toISOString();

      this.logAudit(id, "failed", userId, err.message);
      throw err;
    }
  }

  private logAudit(toolId: string, status: string, userId?: string, error?: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      toolId,
      status,
      userId,
      error,
    };
    this.auditLogs.push(entry);
    console.log(`[ToolRuntime:Audit] Tool: ${toolId} | Status: ${status} | User: ${userId} ${error ? `| Error: ${error}` : ""}`);
  }
}
export default ToolRuntime;
