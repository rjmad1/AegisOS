import { describe, it, expect, beforeEach } from "vitest";
import { workspaceService } from "@/services/workspace.service";
import { projectService } from "@/services/project.service";
import { missionRuntimeService } from "@/services/mission-runtime.service";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import { MemoryWorkspaceRepository } from "@/repositories/workspace.repository";
import { MemoryProjectRepository } from "@/repositories/project.repository";
import { MemoryMissionRepository } from "@/repositories/mission.repository";
import { MemoryExecutionRepository } from "@/repositories/execution.repository";

describe("Workspace Operating Environment Integration Tests", () => {
  beforeEach(() => {
    // Inject Memory repositories to isolate test execution
    workspaceService.setRepository(new MemoryWorkspaceRepository());
    projectService.setRepository(new MemoryProjectRepository());
    missionRuntimeService.setRepository(new MemoryMissionRepository());
    executionRuntimeService.setRepository(new MemoryExecutionRepository());
  });

  it("should create workspace, create project, launch mission, and verify proper context propagation", async () => {
    // 1. Create Workspace
    const workspace = await workspaceService.createWorkspace({
      tenantId: "tnt-test",
      organizationId: "org-test",
      name: "Engineering Division",
      slug: "engineering-division",
      description: "Primary engineering workspace context",
    });

    expect(workspace.id).toBeDefined();
    expect(workspace.name).toBe("Engineering Division");

    // 2. Create Project under Workspace
    const project = await projectService.createProject({
      tenantId: "tnt-test",
      organizationId: "org-test",
      workspaceId: workspace.id,
      name: "Regulatory Audit 2026",
      slug: "regulatory-audit-2026",
      description: "Audit compliance analysis project",
      goals: ["Audit tenant networks", "Verify role policies"],
    });

    expect(project.id).toBeDefined();
    expect(project.workspaceId).toBe(workspace.id);
    expect(project.goals.length).toBe(2);

    // 3. Create Mission within Workspace and Project
    const mission = await missionRuntimeService.createMission(
      "Conduct security audit report for compliance",
      [],
      { workspaceId: workspace.id, projectId: project.id }
    );

    expect(mission.id).toBeDefined();
    expect((mission as any).workspaceId).toBe(workspace.id);
    expect((mission as any).projectId).toBe(project.id);

    // 4. Verify baseline execution context inherits the workspace and project scoping
    const execution = await executionRuntimeService.getExecution(mission.activeExecutionId!);
    expect(execution).toBeDefined();
    expect(execution?.workspaceContext?.workspacePath).toBe(workspace.id);
    expect(execution?.projectContext?.projectId).toBe(project.id);
  });
});
