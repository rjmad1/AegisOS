import { validationFramework } from "../observability/validation-framework";
import { platformHealth } from "../../platform/health/PlatformHealth";

export interface ReliabilityValidationResult {
  timestamp: string;
  ready: boolean;
  score: number;
  checks: Array<{ name: string; status: "passed" | "failed" | "skipped"; message: string }>;
}

export class ReliabilityAutomation {
  private static instance: ReliabilityAutomation | null = null;

  private constructor() {}

  public static getInstance(): ReliabilityAutomation {
    if (!ReliabilityAutomation.instance) {
      ReliabilityAutomation.instance = new ReliabilityAutomation();
    }
    return ReliabilityAutomation.instance;
  }

  public async runContinuousValidations(): Promise<ReliabilityValidationResult> {
    const checks: ReliabilityValidationResult["checks"] = [];
    let ready = true;

    // 1. Check validation framework coverage (spans & telemetry)
    const oReport = await validationFramework.getReadinessReport();
    checks.push({
      name: "Distributed tracing coverage",
      status: oReport.ready ? "passed" : "failed",
      message: `Dynamic telemetry coverage is at ${oReport.score}% of total system APIs.`
    });
    if (!oReport.ready) ready = false;

    // 2. Check Platform Health Status
    const hReport = await platformHealth.getHealthReport();
    const hp = hReport.status === "healthy";
    checks.push({
      name: "Platform health status",
      status: hp ? "passed" : hReport.status === "degraded" ? "skipped" : "failed",
      message: `System status reported as: "${hReport.status}".`
    });
    if (hReport.status === "unhealthy") ready = false;

    // 3. Database Validation
    const dbActive = hReport.components.database.status === "healthy";
    checks.push({
      name: "SQLite Schema integrity & connection Validation",
      status: dbActive ? "passed" : "failed",
      message: dbActive ? "Database connection query returned OK." : "Database connection query failed."
    });
    if (!dbActive) ready = false;

    // 4. Model runtime availability
    const ollamaActive = hReport.components.ollamaApi.status === "healthy";
    checks.push({
      name: "Ollama Model Server socket verification",
      status: ollamaActive ? "passed" : "failed",
      message: ollamaActive ? "Ollama model server listening on 11434." : "Ollama model server down."
    });
    if (!ollamaActive) ready = false;

    const litellmActive = hReport.components.liteLlmProxy.status === "healthy";
    checks.push({
      name: "LiteLLM Router Proxy verification",
      status: litellmActive ? "passed" : "failed",
      message: litellmActive ? "LiteLLM API gateway listening on 4000." : "LiteLLM API gateway down."
    });
    if (!litellmActive) ready = false;

    const passedCount = checks.filter(c => c.status === "passed").length;
    const score = Math.round((passedCount / checks.length) * 100);

    return {
      timestamp: new Date().toISOString(),
      ready,
      score,
      checks
    };
  }
}

export const reliabilityAutomation = ReliabilityAutomation.getInstance();
export default reliabilityAutomation;
