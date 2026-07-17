// tests/unit/platform/skills.test.ts
// Unit tests for the AegisOS Skill Framework Registry, Discovery, Composition, Sandbox, and Telemetry

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { skillsService } from "@/services/skills.service";
import prisma from "@/infrastructure/db/prisma";

describe("AegisOS Skill Framework", () => {
  beforeEach(async () => {
    // Clear and initialize db schema push seed data
    await prisma.skillTelemetry.deleteMany({});
    await prisma.skillExecution.deleteMany({});
    await prisma.skill.deleteMany({});
    await skillsService.init(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should seed 23 default domains correctly on initialization", async () => {
    const skills = await skillsService.getSkills();
    expect(skills.length).toBe(23);

    // Verify system capabilities are present
    const ids = skills.map(s => s.id);
    expect(ids).toContain("ai-engineering");
    expect(ids).toContain("agent-engineering");
    expect(ids).toContain("prompt-engineering");
    expect(ids).toContain("security");
  });

  it("should successfully fetch a single skill definition", async () => {
    const skill = await skillsService.getSkill("ai-engineering");
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("AI Engineering");
    expect(skill?.domain).toBe("AI Engineering");
    expect(skill?.triggers).toContain("ollama");
  });

  it("should dynamically register and search a new skill", async () => {
    const customSkill = {
      id: "custom-test-skill",
      name: "Custom Test Skill",
      purpose: "Run custom integration validation tests.",
      domain: "AI Engineering",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: ["unit test"],
      prerequisites: [],
      dependencies: [],
      supportedTools: [],
      inputSchema: { type: "object", properties: { target: { type: "string" } } },
      outputSchema: { type: "object", properties: { result: { type: "string" } } },
      confidenceScore: 0.99,
      executionCost: 0.001,
      latencyMs: 50,
      sandboxPolicy: {
        allowNetwork: false,
        allowedHosts: [],
        allowFileSystem: false,
        allowedPaths: []
      },
      permissions: ["execute_tools"],
      metadata: {}
    };

    await skillsService.registerSkill(customSkill);
    const fetched = await skillsService.getSkill("custom-test-skill");
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe("Custom Test Skill");

    // Test intent-based discovery
    const discovered = await skillsService.discoverSkills("unit test");
    const discoveredIds = discovered.map(r => r.skill.id);
    expect(discoveredIds).toContain("custom-test-skill");
    
    const bestMatch = discovered.find(r => r.skill.id === "custom-test-skill");
    expect(bestMatch?.matchType).toBe("trigger");
    expect(bestMatch?.confidenceScore).toBeGreaterThan(0.5);
  });

  it("should throw circular dependency errors during registration", async () => {
    // Attempting to register circular chain
    const skillA = {
      id: "skill-a",
      name: "Skill A",
      purpose: "Circular A",
      domain: "Software Engineering",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: ["skill-b"],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    const skillB = {
      id: "skill-b",
      name: "Skill B",
      purpose: "Circular B",
      domain: "Software Engineering",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: ["skill-a"],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    await skillsService.registerSkill(skillA);
    // Registering B which references A (which already references B in dependencies parameter)
    await expect(skillsService.registerSkill(skillB)).rejects.toThrow("Circular dependency detected");
  });

  it("should validate and topologically sort skill composition chains", async () => {
    // Register custom skills with clear dependency relationships: test-diagram -> test-architecture -> test-research
    const testResearch = {
      id: "test-research",
      name: "Research Skill",
      purpose: "Research",
      domain: "Research",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: [],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    const testArch = {
      id: "test-architecture",
      name: "Architecture Skill",
      purpose: "Arch",
      domain: "Architecture",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: ["test-research"],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    const testDiag = {
      id: "test-diagram",
      name: "Diagram Skill",
      purpose: "Diag",
      domain: "Diagram Generation",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: ["test-architecture"],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    await skillsService.registerSkill(testResearch);
    await skillsService.registerSkill(testArch);
    await skillsService.registerSkill(testDiag);

    const composition = await skillsService.composeSkills(["test-diagram", "test-architecture", "test-research"]);
    expect(composition.compatible).toBe(true);
    
    const order = composition.pipeline;
    expect(order.indexOf("test-research")).toBeLessThan(order.indexOf("test-architecture"));
    expect(order.indexOf("test-architecture")).toBeLessThan(order.indexOf("test-diagram"));
  });

  it("should fail composition checks if schemas are incompatible", async () => {
    // Custom skill with missing output inputs schemas
    const producerSkill = {
      id: "producer-skill",
      name: "Producer",
      purpose: "Output schema",
      domain: "Software Engineering",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: [],
      supportedTools: [],
      inputSchema: { type: "object", properties: {} },
      outputSchema: { 
        type: "object", 
        properties: { 
          someOtherKey: { type: "string" } 
        } 
      },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    const consumerSkill = {
      id: "consumer-skill",
      name: "Consumer",
      purpose: "Input schema",
      domain: "Software Engineering",
      version: "1.0.0",
      status: "enabled" as const,
      triggers: [],
      prerequisites: [],
      dependencies: ["producer-skill"],
      supportedTools: [],
      inputSchema: { 
        type: "object", 
        properties: { 
          targetRequiredField: { type: "string" } 
        },
        required: ["targetRequiredField"]
      },
      outputSchema: { type: "object", properties: {} },
      confidenceScore: 0.9,
      executionCost: 0.01,
      latencyMs: 100,
      sandboxPolicy: { allowNetwork: false, allowedHosts: [], allowFileSystem: false, allowedPaths: [] },
      permissions: [],
      metadata: {}
    };

    await skillsService.registerSkill(producerSkill);
    await skillsService.registerSkill(consumerSkill);

    const composition = await skillsService.composeSkills(["consumer-skill", "producer-skill"]);
    expect(composition.compatible).toBe(false);
    expect(composition.errors[0]).toContain("Incompatibility: Step 'Producer' output does not provide required field(s)");
  });

  it("should enforce sandbox policy restrictions on file system reads/writes", async () => {
    // ai-engineering is seeded by default with allowFileSystem = false
    const record = await skillsService.executeSkill("ai-engineering", { path: "D:/sensitive-data" });
    expect(record.status).toBe("failed");
    expect(record.error).toContain("Sandbox Violation");
  });

  it("should enforce sandbox policy restrictions on outbound network hosts", async () => {
    // devops is seeded by default with allowNetwork = false
    const record = await skillsService.executeSkill("devops", { url: "http://malicious-endpoint.com" });
    expect(record.status).toBe("failed");
    expect(record.error).toContain("Sandbox Violation");
  });

  it("should successfully execute a skill and log telemetry metrics", async () => {
    const record = await skillsService.executeSkill("ai-engineering", { task: "Load LiteLLM Model" });
    expect(record.status).toBe("succeeded");
    expect(record.output).toBeDefined();
    expect(record.output?.selectedBackend).toBe("LiteLLM Router");

    // Verify telemetry metrics were logged
    const metrics = await skillsService.getSkillMetrics("ai-engineering");
    expect(metrics.totalExecutions).toBe(1);
    expect(metrics.successRate).toBe(1.0);
    expect(metrics.avgDurationMs).toBeGreaterThan(0);
  });
});
