// src/platform/capability/__tests__/CapabilitySubsystem.test.ts
// Integration test suite for AegisOS Adaptive Capability Lifecycle Subsystem

// @ts-ignore
const { describe, it, expect, beforeEach, afterEach, vi } = (globalThis as any).describe ? (globalThis as any) : require("vitest");
import * as fs from "fs";
import * as path from "path";
import { CapabilityLifecycleManager } from "../CapabilityLifecycleManager";
import { CapabilityMetadata } from "../types";

describe("Capability Subsystem Lifecycle Integration", () => {
  let clm: CapabilityLifecycleManager;
  const stateDir = process.env.AEGISOS_STATE_DIR || "D:/AegisOS";
  const dbPath = path.join(stateDir, "Data", "capabilities");

  beforeEach(async () => {
    clm = CapabilityLifecycleManager.getInstance();
    (clm as any).isStarted = false;
    (clm.registry as any).isInitialized = false; 
    await clm.start();

    // Clear tables to prevent test leakage
    await clm.registry.getStore().clearTables();
    await (clm.registry as any).seedDefaultCapabilities();
  });

  afterEach(async () => {
    await clm.shutdown();
  });

  it("should initialize capability registry and seed default capabilities", async () => {
    const list = await clm.registry.listCapabilities();
    expect(list.length).toBeGreaterThan(0);

    const mcpFilesystem = await clm.registry.getCapability("cap:mcp:filesystem");
    expect(mcpFilesystem).toBeDefined();
    expect(mcpFilesystem?.name).toBe("MCP Filesystem Server");
    expect(mcpFilesystem?.type).toBe("MCP");
    expect(mcpFilesystem?.status).toBe("UNLOADED");
  });

  it("should assess task requirements correctly and handle Native/Cached/Acquirable/Impossible flows", async () => {
    // 1. Native/Cached (already seeded cap)
    const capId = "cap:mcp:filesystem";
    const assessment = await clm.discovery.assessTaskRequirements([capId]);
    expect(assessment[capId].status).toBe("Cached");
    expect(assessment[capId].capabilityId).toBe(capId);

    // 2. Acquirable (not in registry, but in remote trusted catalog)
    const acquirableId = "cap:mcp:postgres";
    const assessment2 = await clm.discovery.assessTaskRequirements([acquirableId]);
    expect(assessment2[acquirableId].status).toBe("Acquirable");
    expect(assessment2[acquirableId].acquisitionCostEstimateUsd).toBeDefined();

    // 3. Impossible (unknown and untrusted)
    const impossibleId = "cap:unknown:malicious";
    const assessment3 = await clm.discovery.assessTaskRequirements([impossibleId]);
    expect(assessment3[impossibleId].status).toBe("Impossible");
  });

  it("should reject untrusted capabilities based on trust policies", async () => {
    // Try to register an unsigned capability when requireSignature is enabled
    const unsignedCap: CapabilityMetadata = {
      id: "cap:skill:untrusted",
      name: "Untrusted Skill",
      type: "Skill",
      version: "1.0.0",
      publisher: "Unknown Hacker",
      repository: "https://github.com/hacker/malicious-skill",
      trustScore: 0.2, // very low
      status: "DISCOVERED",
      installedAt: new Date().toISOString(),
      usageCount: 0,
      averageLatencyMs: 10,
      memoryProfileKb: 1024,
      cpuProfileRatio: 0.1,
      gpuProfileMb: 0,
      dependencyGraph: [],
      compatibilityProfile: { license: "unknown" },
      sandboxPolicy: {
        tier: "Tier4_MicroVMSandbox",
        allowNetwork: true,
        allowedHosts: ["*"],
        allowFileSystem: true,
        allowedPaths: ["*"],
        ramBudgetMb: 100,
        vramBudgetMb: 0,
        cpuQuotaRatio: 1.0
      },
      securityPolicy: {},
      healthScore: 0.2,
      failureRate: 0.8,
      successRate: 0.2
    };

    const validation = await clm.trust.validate(unsignedCap);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("signature is missing");

    // Check with signature but low score
    unsignedCap.signature = "a".repeat(64);
    const validation2 = await clm.trust.validate(unsignedCap);
    expect(validation2.valid).toBe(false);
    expect(validation2.reason).toContain("Trust score");
  });

  it("should determine risk sandbox tiers proportionally", async () => {
    // 1. Native Core Team
    const coreCap = await clm.registry.getCapability("cap:mcp:filesystem");
    expect(clm.sandbox.determineTier(coreCap!)).toBe("Tier0_Native");

    // 2. High Trust Skill
    const skillCap = await clm.registry.getCapability("cap:skill:code-generation");
    expect(clm.sandbox.determineTier(skillCap!)).toBe("Tier1_RestrictedProcess");

    // 3. Regular MCP Server
    const discoverPostgres = await clm.discovery.discoverCapability("cap:mcp:postgres");
    expect(discoverPostgres).toBeDefined();
    expect(clm.sandbox.determineTier(discoverPostgres!)).toBe("Tier2_ToolSandbox");
  });

  it("should setup and teardown sandbox permissions dynamically", async () => {
    const coreCap = await clm.registry.getCapability("cap:mcp:filesystem");
    
    // Setup Sandbox
    const policy = await clm.sandbox.setupSandbox(coreCap!);
    expect(policy.tier).toBe("Tier0_Native");

    // Authorize execution inside allowed paths
    const allowed = await clm.sandbox.authorizeExecution(coreCap!, { path: "D:/AegisOS/Data/file.txt" });
    expect(allowed).toBe(true);

    // Block execution outside allowed paths
    await expect(
      clm.sandbox.authorizeExecution(coreCap!, { path: "C:/Windows/System32/cmd.exe" })
    ).rejects.toThrow("Security Exception");

    await clm.sandbox.teardownSandbox(coreCap!.id);
  });

  it("should transition capability states and allocate/reclaim sandbox resources", async () => {
    const id = "cap:mcp:filesystem";
    
    // Transition LOADED -> READY -> ACTIVE
    await clm.scheduler.transition(id, "LOADED", "test");
    let cap = await clm.registry.getCapability(id);
    expect(cap?.status).toBe("LOADED");

    await clm.scheduler.transition(id, "ACTIVE", "test");
    cap = await clm.registry.getCapability(id);
    expect(cap?.status).toBe("ACTIVE");
    expect(cap?.usageCount).toBe(1);

    // Transition back to IDLE
    await clm.scheduler.transition(id, "IDLE", "test");
    cap = await clm.registry.getCapability(id);
    expect(cap?.status).toBe("IDLE");
  });

  it("should evaluate utility scores and execute predictive preloading based on resources", async () => {
    const id = "cap:mcp:filesystem";
    const cap = await clm.registry.getCapability(id);
    expect(cap).toBeDefined();

    // Check utility score
    const utility = clm.scheduler.calculateUtility(cap!);
    expect(utility.score).toBeDefined();

    // Performance mode preloader triggers loading automatically
    clm.scheduler.setOperatingMode("Performance");
    await clm.scheduler.runPredictivePreloader();

    const preloaded = await clm.registry.getCapability(id);
    expect(preloaded?.status).toBe("READY");
  });

  it("should run garbage collector background daemon and reclaim idle capacities", async () => {
    const id = "cap:mcp:filesystem";
    
    // Mark as Active
    await clm.scheduler.transition(id, "ACTIVE", "test");

    // Stub lastUsed to be 5 minutes ago (longer than the 2 minute MCP server idle threshold)
    const cap = await clm.registry.getCapability(id);
    cap!.lastUsed = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await clm.registry.saveCapability(cap!);

    // Run GC manually
    await clm.gc.reclaimIdleCapabilities();

    // Re-check status (should have been soft-suspended to IDLE)
    let updated = await clm.registry.getCapability(id);
    expect(updated?.status).toBe("IDLE");

    // Stub again and run GC again to trigger unload
    updated!.lastUsed = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await clm.registry.saveCapability(updated!);
    await clm.gc.reclaimIdleCapabilities();

    updated = await clm.registry.getCapability(id);
    expect(updated?.status).toBe("UNLOADED");
  });

  it("should process continuous learning feedback loop", async () => {
    const id = "cap:mcp:filesystem";
    
    // Record execution outcome (e.g. latency 50ms, successful)
    await clm.learning.recordExecutionOutcome(id, { latencyMs: 50.0, success: true });

    const cap = await clm.registry.getCapability(id);
    expect(cap?.usageCount).toBe(1);
    expect(cap?.averageLatencyMs).toBe(50.0);
    expect(cap?.successRate).toBe(1.0);

    // Record a failure outcome
    await clm.learning.recordExecutionOutcome(id, { latencyMs: 150.0, success: false });

    const cap2 = await clm.registry.getCapability(id);
    expect(cap2?.usageCount).toBe(2);
    expect(cap2?.averageLatencyMs).toBe(100.0);
    expect(cap2?.successRate).toBe(0.5);
    expect(cap2?.failureRate).toBe(0.5);
  });

  it("should audit state changes and expose telemetry statistics", async () => {
    const id = "cap:mcp:filesystem";
    
    // Trigger assess and acquire gateway
    await clm.assessAndAcquire("test_query", [id]);

    const stats = await clm.telemetry.getSummaryStatistics();
    expect(stats.loadedCount).toBeGreaterThan(0);
    expect(stats.totalRamAllocatedMb).toBeGreaterThan(0);
    expect(stats.recentTransitions.length).toBeGreaterThan(0);
  });
});
