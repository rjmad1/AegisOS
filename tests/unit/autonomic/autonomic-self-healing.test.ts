import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AutonomicSelfHealingDaemon } from "@/platform/autonomic/AutonomicSelfHealingDaemon";

describe("AutonomicSelfHealingDaemon", () => {
  let daemon: AutonomicSelfHealingDaemon;

  beforeEach(() => {
    daemon = AutonomicSelfHealingDaemon.getInstance();
  });

  afterEach(() => {
    daemon.stop();
  });

  it("should run diagnostic sweep across monitored services", async () => {
    const result = await daemon.runDiagnosticAndRecovery();
    expect(result).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.services.length).toBeGreaterThan(0);
    expect(["healthy", "degraded", "unhealthy"]).toContain(result.overallStatus);
  });

  it("should publish diagnostic report with valid service list", async () => {
    const result = await daemon.runDiagnosticAndRecovery();
    const serviceNames = result.services.map(s => s.name);
    expect(serviceNames).toContain("Console Portal");
    expect(serviceNames).toContain("AegisOS Gateway");
    expect(serviceNames).toContain("LiteLLM Router");
    expect(serviceNames).toContain("Ollama Inference");
  });
});
