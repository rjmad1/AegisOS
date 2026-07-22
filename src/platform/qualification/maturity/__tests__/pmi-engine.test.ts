import { describe, it, expect } from "vitest";
import { assessmentEngine } from "../pmi-engine";
import { ValidationResult } from "../../../validation/types";

describe("PlatformMaturityIndexEngine extended governance metrics", () => {
  it("should evaluate dynamic PRI, KMM, GCM, and active CER exceptions from validation results", () => {
    const results: Record<string, ValidationResult> = {
      "architecture-drift": {
        score: 90,
        status: "PASS",
        timestamp: new Date().toISOString()
      },
      "engineering-quality": {
        score: 95,
        status: "PASS",
        timestamp: new Date().toISOString()
      },
      "chaos": {
        score: 92,
        status: "PASS",
        timestamp: new Date().toISOString()
      },
      "scalability": {
        score: 88,
        status: "PASS",
        timestamp: new Date().toISOString()
      },
      "compliance-rules": {
        score: 96,
        status: "PASS",
        timestamp: new Date().toISOString()
      },
      "ai-runtime": {
        score: 94,
        status: "PASS",
        timestamp: new Date().toISOString()
      }
    } as any;

    const assessment = assessmentEngine.evaluateAssessment(results);
    const maturity = assessment.maturity;

    expect(maturity.overall).toBeGreaterThan(0);
    expect(maturity.pri).toBe(93); // (92 + 96 + 88 + 94) / 4 = 92.5 => 93
    expect(maturity.kmm).toBe(4.8); // ((95 * 0.6 + 96 * 0.4) / 20) = 4.77 => 4.8
    expect(maturity.gcm).toBe(94); // (90 + 96 + 96) / 3 = 94
    expect(maturity.cerExceptionsCount).toBe(0);
  });
});
