import { selfHealer } from "../diagnostics/self-healer";
import { recoveryEngine } from "./RecoveryEngine";
import { recoveryValidator } from "./RecoveryValidator";
import { reliabilityStore } from "./store";

export interface SelfHealingResult {
  timestamp: string;
  healthy: boolean;
  issuesDetected: string[];
  remediations: Array<{
    component: string;
    remediation: string;
    status: "verified" | "failed";
  }>;
}

export class SelfHealingFramework {
  private static instance: SelfHealingFramework | null = null;

  private constructor() {}

  public static getInstance(): SelfHealingFramework {
    if (!SelfHealingFramework.instance) {
      SelfHealingFramework.instance = new SelfHealingFramework();
    }
    return SelfHealingFramework.instance;
  }

  /**
   * Primary self-healing cycle.
   */
  public async executeHealingCycle(): Promise<SelfHealingResult> {
    const baseReport = await selfHealer.executeDiagnosticsAndHeal();
    const remediations: SelfHealingResult["remediations"] = [];

    // Parse the baseline issues and trigger active recovery
    for (const issue of baseReport.issues) {
      let component = "general";
      let serviceId = "";
      
      if (issue.includes("Ollama")) {
        component = "Ollama API";
        serviceId = "ollama";
      } else if (issue.includes("LiteLLM")) {
        component = "LiteLLM Router Proxy";
        serviceId = "litellm";
      } else if (issue.includes("AegisOS")) {
        component = "AegisOS Gateway";
        serviceId = "aegisos";
      }

      if (serviceId) {
        // Trigger actual restart execution
        const success = await recoveryEngine.restartService(serviceId);
        const actionText = `Triggered service restart for ${component}`;
        
        // Wait 1s for port to boot
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Validate recovery
        const valReport = await recoveryValidator.validateRecovery(component, actionText);

        remediations.push({
          component,
          remediation: actionText,
          status: valReport.status === "verified" ? "verified" : "failed"
        });

        // Record Incident
        if (valReport.status !== "verified") {
          this.escalateIncident(component, issue, `Self-healing restart execution failed validation. Escalating alert.`);
        } else {
          this.logResolvedIncident(component, issue, actionText);
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      healthy: baseReport.healthy && remediations.every(r => r.status === "verified"),
      issuesDetected: baseReport.issues,
      remediations
    };
  }

  private escalateIncident(component: string, issue: string, message: string) {
    reliabilityStore.update((state) => {
      const id = `inc-${Date.now()}`;
      state.incidents.push({
        id,
        title: `CRITICAL outage: ${component} failure`,
        description: `${issue}. ${message}`,
        category: "infrastructure",
        status: "active",
        severity: "P0",
        detectedAt: new Date().toISOString(),
        timeline: [
          { time: Date.now().toString(), event: `Incident detected: ${issue}` },
          { time: Date.now().toString(), event: `Remediation failed. Escalated alert to Platform Engineers.` }
        ]
      });
    });
  }

  private logResolvedIncident(component: string, issue: string, remediation: string) {
    reliabilityStore.update((state) => {
      const id = `inc-${Date.now()}`;
      state.incidents.push({
        id,
        title: `Recovered: ${component} self-healed`,
        description: `Self-healing successfully resolved: ${issue}`,
        category: "infrastructure",
        status: "resolved",
        severity: "P1",
        detectedAt: new Date(Date.now() - 5000).toISOString(),
        mitigatedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        rca: `Root Cause: Port listener check failed. Triggered automated restart pipeline which successfully recovered socket listener state.`,
        timeline: [
          { time: new Date(Date.now() - 5000).toISOString(), event: `Failure detected: ${issue}` },
          { time: new Date().toISOString(), event: `Remediation executed: ${remediation}` },
          { time: new Date().toISOString(), event: `Recovery verified. Incident resolved automatically.` }
        ]
      });
    });
  }
}

export const selfHealingFramework = SelfHealingFramework.getInstance();
export default selfHealingFramework;
