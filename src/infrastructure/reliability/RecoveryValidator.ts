import { deploymentManager } from "../deployment/deployment-manager";
import { platformHealth } from "../../platform/health/PlatformHealth";
import { PortRegistry } from "../../platform/ports/PortRegistry";

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

  private async checkPortWithRetry(port: number, retries = 5, delayMs = 1000): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      const active = await deploymentManager.checkPort(port);
      if (active) return true;
      console.log(`[RecoveryValidator] Port ${port} not ready yet. Retrying in ${delayMs}ms (Attempt ${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
  }

  public async validateRecovery(
    componentId: string,
    remediation: string
  ): Promise<RecoveryValidationReport> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];
    let overallPassed = true;

    // 1. Validate based on component type
    if (componentId === "ollama" || componentId === "Ollama API") {
      const port = PortRegistry.getHostPort("ollama");
      const portActive = await this.checkPortWithRetry(port);
      checks.push({
        name: `Socket listener verification on Port ${port}`,
        passed: portActive,
        message: portActive ? "Ollama socket is accepting traffic." : `Port ${port} refused connection.`
      });
      if (!portActive) overallPassed = false;
    } else if (componentId === "litellm" || componentId === "LiteLLM Router Proxy") {
      const port = PortRegistry.getHostPort("litellm");
      const portActive = await this.checkPortWithRetry(port);
      checks.push({
        name: `Socket listener verification on Port ${port}`,
        passed: portActive,
        message: portActive ? "LiteLLM socket is accepting traffic." : `Port ${port} refused connection.`
      });
      if (!portActive) overallPassed = false;
    } else if (componentId === "aegisos" || componentId === "AegisOS Gateway") {
      const port = PortRegistry.getHostPort("aegisos");
      const portActive = await this.checkPortWithRetry(port);
      checks.push({
        name: `Socket listener verification on Port ${port}`,
        passed: portActive,
        message: portActive ? "AegisOS socket is accepting traffic." : `Port ${port} refused connection.`
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
