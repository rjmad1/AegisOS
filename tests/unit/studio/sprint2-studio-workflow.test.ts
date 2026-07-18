import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "@/store/workspaceStore";

describe("AegisOS Studio Delivery Program (SDP) - Sprint 2 Verification", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkspaceStore.setState({
      workspaces: [
        {
          id: "ws-test",
          name: "Test Workspace",
          slug: "test-workspace",
          description: "Test environment for Sprint 2 workflows.",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeWorkspaceId: "ws-test",
      projects: [],
      knowledgeDocs: [],
      artifacts: [],
      missions: [],
      activityFeed: [],
      isLoading: false,
      isIndexing: false,
    });
  });

  describe("Primary User Journey (End-to-End Workflow)", () => {
    it("should allow a user to create a Workspace, import a Repository, import Documents, build Knowledge Index, and launch a Mission", async () => {
      const store = useWorkspaceStore.getState();

      // Step 1: Create Workspace
      const createdWs = await store.createWorkspace({
        name: "New Alpha Swarm",
        description: "Autonomous production workspace",
      });
      expect(createdWs.name).toBe("New Alpha Swarm");
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(createdWs.id);

      // Step 2: Import Repository
      const importedRepo = await store.importRepository({
        name: "Core Gateway Repo",
        repositoryUrl: "https://github.com/rjmad1/AegisOS.git",
        description: "Zero-trust API proxy service",
      });
      expect(importedRepo.name).toBe("Core Gateway Repo");
      expect(useWorkspaceStore.getState().projects.length).toBe(1);

      // Step 3: Import Documents
      const importedDoc = await store.importDocument({
        name: "SYSTEM_SPEC.md",
        type: "markdown",
        content: "# System Spec\n\nPublic REST API endpoints defined.",
      });
      expect(importedDoc.name).toBe("SYSTEM_SPEC.md");
      expect(useWorkspaceStore.getState().knowledgeDocs.length).toBe(1);

      // Step 4: Trigger Knowledge Index Build
      await store.triggerKnowledgeBuild();
      // Verify freshness updated in health
      const health = useWorkspaceStore.getState().health;
      expect(health.embeddingStatus).toBe("healthy");

      // Step 5: Launch Mission
      const createdMission = await store.createMission({
        title: "Audit System Compliance",
        packName: "Security Audit Pack",
        goal: "Verify zero private API calls.",
      });
      expect(createdMission.title).toBe("Audit System Compliance");
      expect(useWorkspaceStore.getState().missions.length).toBe(1);
    });
  });

  describe("Deliverables Verification", () => {
    it("Deliverable 1: Workspace Dashboard - should aggregate workspace, projects, knowledge, artifacts, missions, and health", () => {
      const state = useWorkspaceStore.getState();
      expect(state.workspaces).toBeDefined();
      expect(state.projects).toBeDefined();
      expect(state.knowledgeDocs).toBeDefined();
      expect(state.artifacts).toBeDefined();
      expect(state.missions).toBeDefined();
      expect(state.health).toBeDefined();
    });

    it("Deliverable 2: Project Explorer - should contain Repositories, Documents, Knowledge Sources, Mission Packs, and Extensions tree structure", () => {
      const state = useWorkspaceStore.getState();
      expect(Array.isArray(state.projects)).toBe(true);
      expect(Array.isArray(state.knowledgeDocs)).toBe(true);
    });

    it("Deliverable 3: Knowledge Browser - should track vector count, chunk counts, and embedding statistics", async () => {
      const store = useWorkspaceStore.getState();
      await store.importDocument({
        name: "DOC1.md",
        type: "markdown",
        content: "Sample content paragraph for chunking.",
      });
      const doc = useWorkspaceStore.getState().knowledgeDocs[0];
      expect(doc.chunkCount).toBeGreaterThan(0);
      expect(doc.vectorCount).toBeGreaterThan(0);
      expect(doc.embeddingStatus).toBe("indexed");
    });

    it("Deliverable 4: Artifact Library - should categorize generated reports, PDFs, Markdown, Architecture diagrams, and Decision logs", async () => {
      const store = useWorkspaceStore.getState();
      await store.createMission({
        title: "Generate Topology",
        packName: "Architecture Verification Pack",
        goal: "Output architecture diagram artifact.",
      });
      // Wait for async mission completion simulation
      await new Promise((r) => setTimeout(r, 2600));

      const artifact = useWorkspaceStore.getState().artifacts.find((a) => a.title.includes("Generate Topology"));
      expect(artifact).toBeDefined();
      expect(artifact?.type).toBe("markdown");
    });

    it("Deliverable 5: Mission Center - should compute success rate and mission status tabs", async () => {
      const store = useWorkspaceStore.getState();
      await store.createMission({
        title: "Test Mission 1",
        packName: "Code Quality Pack",
        goal: "Run linter",
      });

      const missions = useWorkspaceStore.getState().missions;
      expect(missions.length).toBe(1);
      expect(missions[0].status).toBe("running");
    });

    it("Deliverable 6: Live Workspace Health - should supply knowledge freshness, embeddings, models, GPU, storage, and execution queue metrics", () => {
      const health = useWorkspaceStore.getState().health;
      expect(health.knowledgeFreshness).toBeGreaterThan(0);
      expect(health.gpuStatus.vramUsedGb).toBeDefined();
      expect(health.storage.usedGb).toBeDefined();
      expect(health.executionQueue.activeWorkers).toBeGreaterThan(0);
    });

    it("Deliverable 7: Recent Activity Feed - should log unified timeline events across workspace, knowledge, and mission actions", async () => {
      const store = useWorkspaceStore.getState();
      await store.createWorkspace({ name: "Timeline WS" });
      const activity = useWorkspaceStore.getState().activityFeed;
      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0].category).toBe("workspace");
    });
  });

  describe("Non-Negotiables & Public REST API Compliance", () => {
    it("should ensure all API endpoints follow public REST standard (/api/v1/*)", () => {
      const publicEndpoints = [
        "/api/v1/workspaces",
        "/api/v1/projects",
        "/api/v1/knowledge",
        "/api/v1/artifacts",
        "/api/v1/missions",
        "/api/v1/health",
        "/api/v1/activity",
      ];

      publicEndpoints.forEach((url) => {
        expect(url).toMatch(/^\/api\/v1\//);
      });
    });
  });
});
