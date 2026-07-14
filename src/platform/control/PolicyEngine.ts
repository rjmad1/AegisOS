import { CommandType, RiskLevel, ApprovalType, CommandRequest } from "./types";

export class PolicyEngine {
  private static instance: PolicyEngine | null = null;

  private constructor() {}

  public static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  /**
   * Evaluates the risk score of a given command type
   */
  public determineRiskLevel(type: CommandType): RiskLevel {
    switch (type) {
      // LOW RISK (Read-only, localized config, safe model swaps)
      case "ai:load_model":
      case "ai:unload_model":
      case "ai:switch_default_model":
      case "agent:assign_model":
      case "agent:assign_tools":
      case "knowledge:reindex":
      case "knowledge:refresh_embeddings":
      case "infrastructure:health_check":
        return "LOW";

      // MEDIUM RISK (Orchestration changes, soft restarts, workflow runs)
      case "infrastructure:start_service":
      case "infrastructure:stop_service":
      case "infrastructure:restart_service":
      case "infrastructure:reload_service":
      case "agent:start":
      case "agent:pause":
      case "agent:resume":
      case "workflow:execute":
      case "workflow:pause":
      case "workflow:resume":
      case "workflow:cancel":
      case "workflow:retry":
      case "system:lock":
      case "system:backup":
        return "MEDIUM";

      // HIGH RISK (Resource destructive, heavy operations)
      case "ai:download_model":
      case "ai:delete_model":
      case "ai:benchmark_model":
      case "knowledge:import_documents":
      case "knowledge:delete_documents":
      case "infrastructure:update_configuration":
      case "agent:terminate":
      case "system:sleep":
        return "HIGH";

      // CRITICAL RISK (Immediate threat to connection, host availability, OS states)
      case "system:shutdown":
      case "system:restart":
      case "system:update":
        return "CRITICAL";

      default:
        return "HIGH";
    }
  }

  /**
   * Decides which approval strategy applies based on risk and override headers
   */
  public determineApprovalType(risk: RiskLevel, emergencyOverride?: boolean): ApprovalType {
    if (emergencyOverride) {
      return "EMERGENCY";
    }
    
    switch (risk) {
      case "LOW":
        return "AUTO";
      case "MEDIUM":
        return "MANUAL";
      case "HIGH":
      case "CRITICAL":
        return "MULTI_STAGE";
      default:
        return "MANUAL";
    }
  }

  /**
   * Validates if a user's role satisfies authorization policy limits
   */
  public validatePolicy(
    req: CommandRequest,
    userRole: string,
    risk: RiskLevel
  ): { authorized: boolean; reason?: string } {
    const role = userRole.toLowerCase();

    // 1. Viewers and Auditors are strictly forbidden from performing mutating commands
    if (role === "viewer" || role === "auditor") {
      return {
        authorized: false,
        reason: `Role '${userRole}' does not possess operational execute permissions.`,
      };
    }

    // 2. Operators can execute LOW and MEDIUM risk commands without secondary approvals,
    // but HIGH and CRITICAL commands require elevated checks.
    if (role === "operator") {
      if (risk === "CRITICAL" && req.emergencyOverride) {
        return {
          authorized: false,
          reason: "Emergency overrides for CRITICAL commands are restricted to Administrator roles.",
        };
      }
      return { authorized: true };
    }

    // 3. Administrators bypass standard restrictions
    if (role === "administrator" || role === "admin") {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: `Unknown user role: ${userRole}`,
    };
  }
}

export const policyEngine = PolicyEngine.getInstance();
export default policyEngine;
