// tests/unit/services/workspace-service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { workspaceService } from "../../../src/services/workspace.service";
import { MemoryWorkspaceRepository } from "../../../src/repositories/workspace.repository";

describe("WorkspaceService", () => {
  let memoryRepo: MemoryWorkspaceRepository;

  beforeEach(() => {
    memoryRepo = new MemoryWorkspaceRepository();
    workspaceService.setRepository(memoryRepo);
  });

  it("should create a workspace with default settings", async () => {
    const ws = await workspaceService.createWorkspace({
      tenantId: "tnt-1",
      organizationId: "org-1",
      name: "Engineering Workspace",
      slug: "eng-ws",
      description: "Engineering team workspace",
    });

    expect(ws.id).toMatch(/^ws-/);
    expect(ws.name).toBe("Engineering Workspace");
    expect(ws.settings.retentionDays).toBe(365);
    expect(ws.status).toBe("active");
  });

  it("should list workspaces and seed defaults when empty", async () => {
    const list = await workspaceService.listWorkspaces("tnt-default");
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].name).toBe("AegisOS Platform Core");
  });

  it("should get, update, and delete workspaces", async () => {
    const ws = await workspaceService.createWorkspace({
      tenantId: "tnt-2",
      organizationId: "org-2",
      name: "Original WS",
      slug: "orig-ws",
      description: "Desc",
    });

    const found = await workspaceService.getWorkspace(ws.id);
    expect(found?.name).toBe("Original WS");

    const updated = await workspaceService.updateWorkspace(ws.id, {
      name: "Updated WS",
      description: "Updated Description",
    });
    expect(updated.name).toBe("Updated WS");

    await workspaceService.deleteWorkspace(ws.id);
    const deleted = await workspaceService.getWorkspace(ws.id);
    expect(deleted).toBeNull();
  });

  it("should fetch associated resource catalogs for a workspace", async () => {
    const ws = await workspaceService.createWorkspace({
      tenantId: "tnt-3",
      organizationId: "org-3",
      name: "Resource Test WS",
      slug: "res-ws",
      description: "Desc",
    });

    const missions = await workspaceService.getMissions(ws.id);
    expect(Array.isArray(missions)).toBe(true);

    const executions = await workspaceService.getExecutions(ws.id);
    expect(Array.isArray(executions)).toBe(true);

    const artifacts = await workspaceService.getArtifacts(ws.id);
    expect(Array.isArray(artifacts)).toBe(true);

    const agents = await workspaceService.getAgents(ws.id);
    expect(Array.isArray(agents)).toBe(true);

    const knowledge = await workspaceService.getKnowledge(ws.id);
    expect(Array.isArray(knowledge)).toBe(true);
  });
});
