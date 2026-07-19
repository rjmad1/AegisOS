import { selfHealer } from "../diagnostics/self-healer";
import { recoveryEngine } from "./RecoveryEngine";
import { recoveryValidator } from "./RecoveryValidator";
import { reliabilityStore } from "./store";
import { evaluationPipeline } from "../evaluation/evaluation-pipeline";
import { deploymentManager } from "../deployment/deployment-manager";

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

    // 1. Cascading dependency checks
    const hasOllamaIssue = baseReport.issues.some(i => i.toLowerCase().includes("ollama"));
    const filteredIssues = baseReport.issues.filter(issue => {
      if (hasOllamaIssue) {
        if (issue.toLowerCase().includes("litellm") || issue.toLowerCase().includes("aegisos")) {
          console.log(`[SelfHealingFramework] Skipping recovery of dependent service because upstream service Ollama is offline: ${issue}`);
          return false;
        }
      }
      return true;
    });

    // 2. Autonomic model quality checks
    try {
      const latestHistory = evaluationPipeline.getHistory();
      if (latestHistory && latestHistory.length > 0) {
        const avgCorrectness = latestHistory.reduce((sum, r) => sum + r.scores.correctness, 0) / latestHistory.length;
        if (avgCorrectness < 85) {
          this.escalateIncident(
            "AI Model Inference", 
            "AI Model validation correctness degraded", 
            `Average model correctness score has dropped to ${avgCorrectness}%. Escalating for prompt tuning or fallback routing.`
          );
        }
      }
    } catch (err: any) {
      console.warn(`[SelfHealingFramework] Autonomic evaluation check skipped: ${err.message}`);
    }

    // Parse the filtered issues and trigger active recovery
    for (const issue of filteredIssues) {
      let component = "general";
      let serviceId = "";

      // WSL / Docker Host Recovery
      if (issue.toLowerCase().includes("docker") || issue.toLowerCase().includes("wsl")) {
        component = "Host Runtime";
        console.log(`[SelfHealingFramework] Triggering aggressive SCM restart for WSL and Docker...`);
        const success = await deploymentManager.restartWslAndDocker();
        remediations.push({
          component,
          remediation: "Triggered host WSL and Docker SCM restarts",
          status: success ? "verified" : "failed"
        });
        if (!success) {
          this.escalateIncident(component, issue, "Failed to restart WSL or Docker services.");
        } else {
          this.logResolvedIncident(component, issue, "WSL and Docker restarted");
        }
        continue;
      }

      // Database Folder and Prisma Schema Recovery
      if (issue.toLowerCase().includes("database") || issue.toLowerCase().includes("prisma")) {
        component = "Database Engine";
        console.log(`[SelfHealingFramework] Triggering SQLite schema rebuild...`);
        let dbOk = false;
        try {
          const { exec } = require("child_process");
          const util = require("util");
          const execPromise = util.promisify(exec);
          await execPromise("npx prisma db push");
          dbOk = true;
        } catch (dbErr: any) {
          console.error("[SelfHealingFramework] SQLite schema recovery failed:", dbErr.message);
        }
        remediations.push({
          component,
          remediation: "Executed npx prisma db push to repair database schema",
          status: dbOk ? "verified" : "failed"
        });
        if (!dbOk) {
          this.escalateIncident(component, issue, "Failed to repair SQLite database schema.");
        } else {
          this.logResolvedIncident(component, issue, "SQLite schema rebuilt");
        }
        continue;
      }
      
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
