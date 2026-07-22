import { describe, it, expect, beforeEach } from "vitest";
import { CloudSpilloverRouter } from "@/infrastructure/providers/cloud-spillover-router";

describe("CloudSpilloverRouter - Predictive VRAM Velocity", () => {
  let router: CloudSpilloverRouter;

  beforeEach(() => {
    router = new CloudSpilloverRouter({
      maxVramUsage: 0.9,
      maxContextTokens: 32000,
      maxVramVelocityRatioPerSec: 0.10 // 10%/sec threshold
    });
  });

  it("should calculate zero velocity when insufficient telemetry samples exist", () => {
    const velocity = router.calculateVramVelocityRatioPerSec();
    expect(velocity).toBe(0);
  });

  it("should detect high VRAM growth velocity and trigger predictive spillover", async () => {
    const now = Date.now();
    // Sample 1: 20% usage 5 seconds ago
    router.recordTelemetrySample({
      timestampMs: now - 5000,
      vramUsedBytes: 2 * 1024 * 1024 * 1024,
      vramTotalBytes: 10 * 1024 * 1024 * 1024,
      usageRatio: 0.20
    });

    // Sample 2: 80% usage now (growth rate: 60% over 5s = 12%/sec, exceeding 10%/sec limit)
    router.recordTelemetrySample({
      timestampMs: now,
      vramUsedBytes: 8 * 1024 * 1024 * 1024,
      vramTotalBytes: 10 * 1024 * 1024 * 1024,
      usageRatio: 0.80
    });

    const velocity = router.calculateVramVelocityRatioPerSec();
    expect(velocity).toBeCloseTo(0.12, 2);

    const model = { sizeBytes: 1 * 1024 * 1024 * 1024, sizeDisplay: "1GB" };
    const result = await router.shouldSpillover(model, 1000);
    expect(result).toBe(true); // Should spill over due to velocity breach
  });

  it("should spillover when context token limit is exceeded", async () => {
    const model = { sizeBytes: 1 * 1024 * 1024 * 1024 };
    const result = await router.shouldSpillover(model, 40000); // Exceeds 32,000 threshold
    expect(result).toBe(true);
  });
});
