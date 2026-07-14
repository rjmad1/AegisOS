import { deploymentManager } from "../deployment/deployment-manager";
import { platformHealth } from "../../platform/health/PlatformHealth";

export interface RecoveryValidationReport {
  targetComponent: string;
  remediationApplied: string;
  status: "verified" | "failed" | "pending";
  timestamp: string;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}

export class RecoveryValidator {
  private static instance: RecoveryValidator | null = null;

  private constructor() {}

  public static getInstance(): RecoveryValidator {
    if (!RecoveryValidator.instance) {
      RecoveryValidator.instance = new RecoveryValidator();
    }
    return RecoveryValidator.instance;
  }

  public async validateRecovery(
    componentId: string,
    remediation: string
  ): Promise<RecoveryValidationReport> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    let overallPassed = true;

    // 1. Validate based on component type
    if (componentId === "ollama" || componentId === "Ollama API") {
      const portActive = await deploymentManager.checkPort(11434);
      checks.push({
        name: "Socket listener verification on Port 11434",
        passed: portActive,
        message: portActive ? "Ollama socket is accepting traffic." : "Port 11434 refused connection."
      });
      if (!portActive) overallPassed = false;
    } else if (componentId === "litellm" || componentId === "LiteLLM Router Proxy") {
      const portActive = await deploymentManager.checkPort(4000);
      checks.push({
        name: "Socket listener verification on Port 4000",
        passed: portActive,
        message: portActive ? "LiteLLM socket is accepting traffic." : "Port 4000 refused connection."
      });
      if (!portActive) overallPassed = false;
    } else if (componentId === "aegisos" || componentId === "AegisOS Gateway") {
      const portActive = await deploymentManager.checkPort(18789);
      checks.push({
        name: "Socket listener verification on Port 18789",
        passed: portActive,
        message: portActive ? "AegisOS socket is accepting traffic." : "Port 18789 refused connection."
      });
      if (!portActive) overallPassed = false;
    } else {
      // General platform health check fallback
      const healthReport = await platformHealth.getHealthReport();
      const dbHealthy = healthReport.components.database.status === "healthy";
      checks.push({
        name: "Prisma DB connection live check",
        passed: dbHealthy,
        message: dbHealthy ? "Database query execution met SLO target." : "Database remains unresponsive."
      });
      if (!dbHealthy) overallPassed = false;
    }

    return {
      targetComponent: componentId,
      remediationApplied: remediation,
      status: overallPassed ? "verified" : "failed",
      timestamp: new Date().toISOString(),
      checks
    };
  }
}

export const recoveryValidator = RecoveryValidator.getInstance();
export default recoveryValidator;
