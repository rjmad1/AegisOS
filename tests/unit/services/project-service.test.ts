// tests/unit/services/project-service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { projectService } from "../../../src/services/project.service";
import { MemoryProjectRepository } from "../../../src/repositories/project.repository";

describe("ProjectService", () => {
  let memoryRepo: MemoryProjectRepository;

  beforeEach(() => {
    memoryRepo = new MemoryProjectRepository();
    projectService.setRepository(memoryRepo);
  });

  it("should create a project with default settings", async () => {
    const project = await projectService.createProject({
      tenantId: "tenant-1",
      organizationId: "org-1",
      workspaceId: "ws-1",
      name: "Alpha Project",
      slug: "alpha-proj",
      description: "Test description",
    });

    expect(project.id).toMatch(/^proj-/);
    expect(project.name).toBe("Alpha Project");
    expect(project.status).toBe("active");
    expect(project.settings.defaultAiModel).toBe("ollama:gemma2:9b");
  });

  it("should get, list, update, and delete projects", async () => {
    const p1 = await projectService.createProject({
      tenantId: "t1",
      organizationId: "o1",
      workspaceId: "ws-1",
      name: "Project One",
      slug: "proj-1",
      description: "Desc",
    });

    const found = await projectService.getProject(p1.id);
    expect(found?.name).toBe("Project One");

    const list = await projectService.listProjects("ws-1");
    expect(list.length).toBe(1);

    const updated = await projectService.updateProject(p1.id, {
      name: "Updated Name",
      goals: ["Goal 1", "Goal 2"],
    });
    expect(updated.name).toBe("Updated Name");
    expect(updated.goals).toEqual(["Goal 1", "Goal 2"]);

    await projectService.deleteProject(p1.id);
    const deleted = await projectService.getProject(p1.id);
    expect(deleted).toBeNull();
  });

  it("should handle project memory and timeline aggregations gracefully", async () => {
    const p = await projectService.createProject({
      tenantId: "t1",
      organizationId: "o1",
      workspaceId: "ws-1",
      name: "Project Memory Test",
      slug: "proj-mem",
      description: "Desc",
    });

    const memory = await projectService.getMemory(p.id);
    expect(memory.projectId).toBe(p.id);
    expect(Array.isArray(memory.decisions)).toBe(true);

    const timeline = await projectService.getTimeline(p.id);
    expect(Array.isArray(timeline)).toBe(true);
  });
});
