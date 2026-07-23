import { describe, it, expect } from "vitest";
import { headroomCompressor } from "@/infrastructure/compression/headroom";
import { ponytailCompressor } from "@/infrastructure/compression/ponytail";
import { llmCouncilService } from "@/infrastructure/review/llm-council-service";
import { codeGraphClient } from "@/infrastructure/codegraph/codegraph-client";
import { safetyFirewall } from "@/infrastructure/security/safety-firewall";

describe("AegisOS Tool Embedding & Cognitive Optimizations Suite", () => {
  it("HeadroomCompressor should condense verbose instructions and minify JSON blocks", () => {
    const rawPrompt = `
      Please write a function in order to optimize context.
      \`\`\`json
      {
        "debug": true,
        "maxTokens": 100
      }
      \`\`\`
    `;

    const result = headroomCompressor.compressPrompt(rawPrompt);
    expect(result.compressed).toBeDefined();
    expect(result.compressed).toContain("write a function to optimize context");
    expect(result.compressed).toContain('{"debug":true,"maxTokens":100}');
    expect(result.ratio).toBeLessThanOrEqual(1.0);
  });

  it("PonytailCompressor should deduplicate repeated lines and condense old dialogue", () => {
    const rawContent = "Line A\nLine A\nLine B\nLine B\nLine C";
    const pruned = ponytailCompressor.pruneContent(rawContent);
    expect(pruned).toBe("Line A\nLine B\nLine C");

    const messages = [
      { role: "system" as const, content: "System Prompt" },
      { role: "user" as const, content: "Initial query 1" },
      { role: "assistant" as const, content: "Initial response 1" },
      { role: "user" as const, content: "Initial query 2" },
      { role: "assistant" as const, content: "Initial response 2" },
      { role: "user" as const, content: "Latest query" }
    ];

    const summarized = ponytailCompressor.summarizeHistory(messages, 2);
    expect(summarized.length).toBeLessThan(messages.length);
    expect(summarized.some((m) => m.content.includes("System Context Optimization Summary"))).toBe(true);
  });

  it("LLMCouncilService should enqueue async review tasks and manage reports", async () => {
    expect(llmCouncilService).toBeDefined();
    const reviewId = await llmCouncilService.triggerAsyncReview("code", "test-target.ts", "const x = 1;", "unit-test");
    expect(reviewId).toBeDefined();
    expect(reviewId.startsWith("rev-")).toBe(true);
    const reports = llmCouncilService.listReports();
    expect(Array.isArray(reports)).toBe(true);
  });

  it("CodeGraphClient should query AST symbols and dependencies", () => {
    expect(codeGraphClient).toBeDefined();
    const symbols = codeGraphClient.getSymbols();
    const deps = codeGraphClient.getDependencies();
    expect(Array.isArray(symbols)).toBe(true);
    expect(Array.isArray(deps)).toBe(true);
    expect(symbols.length).toBeGreaterThan(0);
  });

  it("SafetyFirewall should inspect prompts and scrub PII", () => {
    expect(safetyFirewall).toBeDefined();
    const check = safetyFirewall.inspectPrompt("Standard benign developer request for john.doe@example.com");
    expect(check.passed).toBe(true);
    expect(check.sanitizedPrompt).toBeDefined();
  });
});
