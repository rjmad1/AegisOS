import { diagnosticsEngine } from "./DiagnosticsEngine";

export interface FailurePrediction {
  targetComponent: string;
  failureType: string;
  probabilityScore: number; // 0 to 100
  estimatedTimeRemainingMinutes: number;
  recommendation: string;
}

export class FailurePredictor {
  private static instance: FailurePredictor | null = null;

  private constructor() {}

  public static getInstance(): FailurePredictor {
    if (!FailurePredictor.instance) {
      FailurePredictor.instance = new FailurePredictor();
    }
    return FailurePredictor.instance;
  }

  public async runFailurePredictions(): Promise<FailurePrediction[]> {
    const diagnostics = await diagnosticsEngine.runDeepDiagnostics();
    const predictions: FailurePrediction[] = [];

    for (const diag of diagnostics) {
      if (diag.status === "warning") {
        // Warning triggers low/mid-level predictions
        predictions.push({
          targetComponent: diag.name,
          failureType: this.mapToFailureType(diag.id),
          probabilityScore: 65,
          estimatedTimeRemainingMinutes: 180, // 3 hours
          recommendation: `Proactive remediation: execute auto-healing routine for ${diag.id}.`
        });
      } else if (diag.status === "critical") {
        // Critical triggers high probability predictions
        predictions.push({
          targetComponent: diag.name,
          failureType: this.mapToFailureType(diag.id),
          probabilityScore: 92,
          estimatedTimeRemainingMinutes: 15, // 15 mins
          recommendation: `CRITICAL action required: manually restart or apply failover policies immediately.`
        });
      }
    }

    // Default proactive forecast
    if (predictions.length === 0) {
      predictions.push({
        targetComponent: "Disk Space Capacity",
        failureType: "Storage Exhaustion",
        probabilityScore: 5,
        estimatedTimeRemainingMinutes: 43200, // 30 days
        recommendation: "System operating normally. Next routine disk vacuum in 24 hours."
      });
    }

    return predictions;
  }

  private mapToFailureType(id: string): string {
    switch (id) {
      case "cpu-saturation": return "CPU Saturation Crash";
      case "memory-leak": return "Out of Memory (OOM) Termination";
      case "gpu-saturation": return "GPU Allocation Blocking Exception";
      case "db-pool": return "Prisma Pool Deadlock Lockout";
      case "config-drift": return "Security Policy Out of Compliance Drift";
      case "cert-expiration": return "SSL Connection Rejection Outage";
      case "disk-exhaustion": return "Storage Out of disk Failure";
      default: return "Unexpected Operational Anomaly";
    }
  }
}

export const failurePredictor = FailurePredictor.getInstance();
export default failurePredictor;
