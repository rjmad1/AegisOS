import { selfHealingFramework } from "./SelfHealingFramework";
import { diagnosticsEngine } from "./DiagnosticsEngine";
import { capacityEngine } from "./CapacityEngine";
import { reliabilityAutomation } from "./ReliabilityAutomation";

export interface ControllerReport {
  timestamp: string;
  status: "running" | "degraded" | "failed";
  selfHealingActive: boolean;
  activeDiagnosticsIssuesCount: number;
  recommendations: string[];
}

export class AutonomousController {
  private static instance: AutonomousController | null = null;
  private loopInterval?: NodeJS.Timeout;
  private running = false;

  private constructor() {}

  public static getInstance(): AutonomousController {
    if (!AutonomousController.instance) {
      AutonomousController.instance = new AutonomousController();
    }
    return AutonomousController.instance;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    console.log("[AutonomousController] Central Platform Controller loop initialized.");

    // Run execution loop every 30s
    this.loopInterval = setInterval(async () => {
      try {
        await this.evaluatePlatform();
      } catch (err) {
        console.error("[AutonomousController] Loop execution failed:", err);
      }
    }, 30000);
  }

  public stop() {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
    }
    this.running = false;
    console.log("[AutonomousController] Central Platform Controller stopped.");
  }

  /**
   * Run one complete evaluation cycle.
   */
  public async evaluatePlatform(): Promise<ControllerReport> {
    // 1. Run self-healing check
    const healingResult = await selfHealingFramework.executeHealingCycle();

    // 2. Run diagnostics
    const diagnostics = await diagnosticsEngine.runDeepDiagnostics();
    const activeIssues = diagnostics.filter(d => d.status !== "healthy");

    // 3. Run reliability automations
    const autoReport = await reliabilityAutomation.runContinuousValidations();

    // 4. Run capacity planning forecast
    const capacityForecasts = await capacityEngine.getCapacityForecasts();

    // Compile recommendations
    const recommendations: string[] = [];
    if (healingResult.issuesDetected.length > 0) {
      recommendations.push(`Healed issues: ${healingResult.issuesDetected.join(", ")}.`);
    }
    if (activeIssues.length > 0) {
      activeIssues.forEach(i => {
        recommendations.push(`Diagnostic warning on [${i.name}]: ${i.message}`);
      });
    }
    if (!autoReport.ready) {
      recommendations.push("Reliability compliance gaps detected. Update security/config properties.");
    }
    capacityForecasts.forEach(c => {
      if (c.probabilityScore > 50) {
        recommendations.push(`Capacity Forecast alert: ${c.recommendation}`);
      }
    });

    return {
      timestamp: new Date().toISOString(),
      status: activeIssues.some(i => i.status === "critical") ? "failed" : activeIssues.length > 0 ? "degraded" : "running",
      selfHealingActive: healingResult.issuesDetected.length > 0,
      activeDiagnosticsIssuesCount: activeIssues.length,
      recommendations
    };
  }
}

export const autonomousController = AutonomousController.getInstance();
export default autonomousController;
