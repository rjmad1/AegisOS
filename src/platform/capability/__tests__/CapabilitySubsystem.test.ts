// src/platform/capability/__tests__/CapabilitySubsystem.test.ts
// Unit test suite for AegisOS Adaptive Capability Lifecycle Subsystem

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CapabilityRegistry } from "../CapabilityRegistry";
import { CapabilityScheduler } from "../CapabilityScheduler";
import { CapabilityMetadata } from "../types";
import { ICapabilityStorageProvider, TenantContext } from "../../core/storage/types";
import { IEventPublisher } from "../../core/events/types";
import { CapabilityGarbageCollector } from "../CapabilityGarbageCollector";

describe("Capability Subsystem Lifecycle Integration", () => {
  let registry: CapabilityRegistry;
  let scheduler: CapabilityScheduler;
  let gc: CapabilityGarbageCollector;
  
  const mockStorage = {
    getCapability: vi.fn(),
    saveCapability: vi.fn(),
    listCapabilities: vi.fn()
  } as unknown as ICapabilityStorageProvider;

  const mockPublisher: IEventPublisher = {
    publish: vi.fn()
  };
  
  const mockOptimizer = { optimize: vi.fn() };
  const mockSandbox = { applyPolicy: vi.fn() };
  
  const mockContext: TenantContext = {
    tenantId: "t1",
    workspaceId: "w1"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    registry = new CapabilityRegistry(mockStorage);
    scheduler = new CapabilityScheduler(
      registry,
      mockOptimizer as any,
      mockSandbox as any,
      mockPublisher
    );
    gc = new CapabilityGarbageCollector(registry, scheduler);
  });

  it("should initialize capability registry and load capabilities", async () => {
    const mockCap: CapabilityMetadata = {
      id: "cap:mcp:filesystem",
      name: "MCP Filesystem Server",
      type: "MCP",
      version: "1.0",
      publisher: "AegisOS",
      repository: "",
      trustScore: 1.0,
      status: "UNLOADED",
      installedAt: new Date().toISOString(),
      usageCount: 0,
      averageLatencyMs: 0,
      memoryProfileKb: 0,
      cpuProfileRatio: 0,
      gpuProfileMb: 0,
      dependencyGraph: [],
      compatibilityProfile: { license: "MIT" },
      sandboxPolicy: { tier: "Tier2_ToolSandbox", allowNetwork: false, allowedHosts: [], allowFileSystem: true, allowedPaths: [], ramBudgetMb: 100, vramBudgetMb: 0, cpuQuotaRatio: 1 },
      securityPolicy: {},
      healthScore: 1.0,
      failureRate: 0,
      successRate: 1
    };

    (mockStorage.listCapabilities as any).mockResolvedValue([mockCap]);

    const list = await registry.listCapabilities(mockContext);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("cap:mcp:filesystem");
  });

  it("should transition capability states and allocate/reclaim sandbox resources", async () => {
    const id = "cap:mcp:filesystem";
    const mockCap: any = { id, status: "UNLOADED", version: "1.0.0", dependencyGraph: [], sandboxPolicy: { ramBudgetMb: 100, vramBudgetMb: 0 } };
    (mockStorage.getCapability as any).mockResolvedValue(mockCap);
    
    // Transition UNLOADED -> READY
    await scheduler.transition(id, "READY", "test", mockContext);
    
    expect(mockStorage.saveCapability).toHaveBeenCalled();
    expect(mockPublisher.publish).toHaveBeenCalled();
    expect(mockCap.status).toBe("READY");
  });

  it("should evaluate utility scores", async () => {
    const id = "cap:mcp:filesystem";
    const cap: any = { id, status: "UNLOADED", usageCount: 10, successRate: 0.9, failureRate: 0.1, averageLatencyMs: 50, sandboxPolicy: { ramBudgetMb: 100, vramBudgetMb: 0 } };
    
    const utility = scheduler.calculateUtility(cap, mockContext);
    expect(utility.score).toBeDefined();
    expect(utility.score).toBeGreaterThan(0);
  });
});
