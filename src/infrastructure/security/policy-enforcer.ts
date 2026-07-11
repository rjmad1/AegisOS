export interface UserSession {
  userId: string;
  username: string;
  role: "admin" | "developer" | "reviewer";
}

export class PolicyEnforcer {
  private static instance: PolicyEnforcer | null = null;
  private users: Map<string, UserSession> = new Map();

  private constructor() {
    // Seed default session admin
    this.users.set("usr-admin-01", {
      userId: "usr-admin-01",
      username: "admin",
      role: "admin"
    });
  }

  public static getInstance(): PolicyEnforcer {
    if (!PolicyEnforcer.instance) {
      PolicyEnforcer.instance = new PolicyEnforcer();
    }
    return PolicyEnforcer.instance;
  }

  // 1. RBAC Enforcer
  public authorizeRole(userId: string, requiredRole: "admin" | "developer" | "reviewer"): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    const hierarchy = { admin: 3, developer: 2, reviewer: 1 };
    const userWeight = hierarchy[user.role] || 0;
    const requiredWeight = hierarchy[requiredRole] || 0;

    return userWeight >= requiredWeight;
  }

  // 2. ABAC Enforcer (environment constraints check)
  public authorizeContext(action: string, clientIp: string): boolean {
    // ponytail: enforce loopback constraints strictly on sensitive actions
    const sensitiveActions = ["system_shutdown", "change_config", "file_delete"];
    if (sensitiveActions.includes(action)) {
      const isLoopback = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost";
      if (!isLoopback) {
        console.warn(`[Security:ABAC] Blocked sensitive action "${action}" from non-loopback IP: ${clientIp}`);
        return false;
      }
    }
    return true;
  }

  // 3. Prompt Injection Defense
  public containsInjection(prompt: string): boolean {
    if (!prompt) return false;

    // Pattern matching common jailbreak vectors
    const injectionPatterns = [
      /ignore previous instructions/gi,
      /you are now a bypass/gi,
      /system override/gi,
      /instead of the instructions above/gi,
      /dan mode/gi
    ];

    const matched = injectionPatterns.some((pattern) => pattern.test(prompt));
    if (matched) {
      console.error(`[Security:Guardrails] Prompt injection attempt blocked! Prompt snippet: "${prompt.slice(0, 50)}..."`);
    }
    return matched;
  }

  // 4. PII Redaction Filter
  public maskPII(text: string): string {
    if (!text) return "";

    let redacted = text;
    // Redact Email addresses
    redacted = redacted.replace(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
    // Redact Credit card numbers
    redacted = redacted.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED_CARD]");
    // Redact IPv4 address sequences
    redacted = redacted.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, "[REDACTED_IP]");

    return redacted;
  }

  // 5. Tool command approval human gate
  public requireHumanApproval(command: string): boolean {
    const highRiskPrefixes = ["rm ", "del ", "format ", "gcloud ", "aws ", "docker rm"];
    return highRiskPrefixes.some((prefix) => command.trim().toLowerCase().startsWith(prefix));
  }
}

export const policyEnforcer = PolicyEnforcer.getInstance();
export default policyEnforcer;
