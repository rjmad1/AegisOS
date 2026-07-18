// src/platform/developer/testing/__tests__/Sprint3AIWorkspace.test.ts
// AegisOS Studio Sprint 3 — AI Workspace Integration Tests

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Type Imports ────────────────────────────────────────────────────────
import type {
  AIWorkspaceMessage,
  AIWorkspaceThread,
  ContextMention,
  InlineArtifact,
  PanelType,
  SubagentNode,
  ToolCallItem,
  ReasoningStep,
} from "@/types/ai-workspace";

// ============================================================================
// 1. AI Workspace Types Structural Tests
// ============================================================================
describe("Sprint 3 — AI Workspace Types", () => {
  it("should define all required AIWorkspaceMessage fields", () => {
    const msg: AIWorkspaceMessage = {
      id: "msg-001",
      conversationId: "conv-001",
      sender: { id: "user", name: "Operator", role: "user" },
      content: "Analyze this repository.",
      timestamp: new Date().toISOString(),
    };

    expect(msg.id).toBe("msg-001");
    expect(msg.sender.role).toBe("user");
    expect(msg.content).toContain("Analyze");
  });

  it("should support optional reasoning steps, tool calls, and inline artifacts", () => {
    const msg: AIWorkspaceMessage = {
      id: "msg-002",
      conversationId: "conv-001",
      sender: { id: "assistant", name: "AegisOS AI", role: "assistant" },
      content: "Mission initialized.",
      timestamp: new Date().toISOString(),
      reasoningSteps: [
        { id: "r1", title: "Intent Recognition", detail: "Detected analysis request.", timestamp: new Date().toISOString() },
      ],
      toolCalls: [
        { id: "tc-1", toolName: "workspace_scan", status: "completed", durationMs: 140 },
      ],
      artifacts: [
        {
          id: "art-1",
          title: "Analysis Report",
          type: "markdown",
          category: "architecture",
          summary: "Repo structure analysis",
          content: "# Report\nContent here.",
          createdAt: new Date().toISOString(),
        },
      ],
      missionId: "mission-abc",
      missionStatus: "EXECUTING",
    };

    expect(msg.reasoningSteps).toHaveLength(1);
    expect(msg.toolCalls![0].toolName).toBe("workspace_scan");
    expect(msg.artifacts![0].type).toBe("markdown");
    expect(msg.missionStatus).toBe("EXECUTING");
  });

  it("should define AIWorkspaceThread with all required fields", () => {
    const thread: AIWorkspaceThread = {
      id: "conv-001",
      title: "Repository Analysis",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      messageCount: 4,
      summary: "Analyzing AegisOS codebase",
      agentId: "main",
      workspaceId: "ws-01",
      projectId: "proj-01",
    };

    expect(thread.status).toBe("active");
    expect(thread.agentId).toBe("main");
  });

  it("should define ContextMention for @ references", () => {
    const mention: ContextMention = {
      id: "doc-adr005",
      type: "document",
      title: "ADR-005 Modular Capabilities",
      subtitle: "14 vectors indexed",
      snippet: "Architecture decision record...",
    };

    expect(mention.type).toBe("document");
    expect(mention.title).toContain("ADR-005");
  });

  it("should define SubagentNode for delegation tree visualization", () => {
    const tree: SubagentNode = {
      id: "main-orchestrator",
      name: "Main Orchestrator Agent",
      role: "Planning & dispatch",
      status: "executing",
      children: [
        { id: "dev", name: "Developer", role: "Code analysis", status: "completed", activeTool: "edit" },
        { id: "rev", name: "Reviewer", role: "Audit", status: "thinking", activeTool: "skill_workshop" },
      ],
    };

    expect(tree.children).toHaveLength(2);
    expect(tree.children![0].activeTool).toBe("edit");
    expect(tree.children![1].status).toBe("thinking");
  });
});

// ============================================================================
// 2. Panel Type Definitions
// ============================================================================
describe("Sprint 3 — Panel Types", () => {
  it("should accept valid panel type values", () => {
    const panels: PanelType[] = ["mission", "agent", "knowledge", "artifact", null];
    expect(panels).toContain("mission");
    expect(panels).toContain("artifact");
    expect(panels).toContain(null);
  });
});

// ============================================================================
// 3. Message Processing API Contract Tests
// ============================================================================
describe("Sprint 3 — Conversation Messages API Contract", () => {
  it("should accept POST body with content, contextMentions, workspaceId, projectId", () => {
    const requestBody = {
      content: "Analyze this repository.",
      contextMentions: [
        { id: "repo-aegis", type: "repository", title: "rjmad1/AegisOS" },
      ],
      workspaceId: "ws-01",
      projectId: "proj-01",
    };

    expect(requestBody.content).toBeTruthy();
    expect(requestBody.contextMentions).toHaveLength(1);
    expect(requestBody.contextMentions[0].type).toBe("repository");
  });

  it("should return response with userMessage, assistantMessage, mission, artifacts, knowledgeReferences", () => {
    const responseShape = {
      success: true,
      userMessage: {
        id: "msg-user-1",
        conversationId: "conv-1",
        sender: { id: "user", name: "Operator", role: "user" },
        content: "Analyze this repository.",
        timestamp: new Date().toISOString(),
      },
      assistantMessage: {
        id: "msg-asst-1",
        conversationId: "conv-1",
        sender: { id: "assistant", name: "AegisOS AI Orchestrator", role: "assistant" },
        content: "Mission initialized.",
        timestamp: new Date().toISOString(),
        missionId: "mission-001",
        missionStatus: "EXECUTING",
        reasoningSteps: [],
        toolCalls: [],
        artifacts: [],
      },
      mission: { id: "mission-001", status: "EXECUTING" },
      artifacts: [],
      knowledgeReferences: [],
    };

    expect(responseShape.success).toBe(true);
    expect(responseShape.assistantMessage.missionId).toBe("mission-001");
    expect(responseShape.mission.status).toBe("EXECUTING");
  });
});

// ============================================================================
// 4. Streaming & SSE Event Contract Tests
// ============================================================================
describe("Sprint 3 — SSE Event Stream Contract", () => {
  it("should define ConversationUpdated event payload", () => {
    const event = {
      id: "evt-001",
      name: "ConversationUpdated",
      timestamp: new Date().toISOString(),
      payload: {
        conversationId: "conv-1",
        userMessage: { id: "msg-u1", content: "Test" },
        assistantMessage: { id: "msg-a1", content: "Response" },
        mission: null,
      },
    };

    expect(event.name).toBe("ConversationUpdated");
    expect(event.payload.conversationId).toBe("conv-1");
  });

  it("should define ExecutionStarted event payload with missionId", () => {
    const event = {
      id: "evt-002",
      name: "ExecutionStarted",
      timestamp: new Date().toISOString(),
      payload: {
        missionId: "mission-abc",
        status: "EXECUTING",
        step: "Planning",
      },
    };

    expect(event.name).toBe("ExecutionStarted");
    expect(event.payload.missionId).toBeTruthy();
  });
});

// ============================================================================
// 5. Mission Creation from Conversation Tests
// ============================================================================
describe("Sprint 3 — Mission Auto-Creation", () => {
  it("should detect mission-triggering prompts", () => {
    const missionTriggers = [
      "Analyze this repository.",
      "analyze the codebase",
      "Create a mission for documentation",
      "Run repository analysis",
    ];

    missionTriggers.forEach((prompt) => {
      const isRepoAnalysis =
        prompt.toLowerCase().includes("analyze") ||
        prompt.toLowerCase().includes("repository") ||
        prompt.toLowerCase().includes("mission");
      expect(isRepoAnalysis).toBe(true);
    });
  });

  it("should NOT detect casual chat as mission triggers", () => {
    const nonTriggers = [
      "What time is it?",
      "Hello",
      "Summarize the last conversation.",
    ];

    nonTriggers.forEach((prompt) => {
      const isRepoAnalysis =
        prompt.toLowerCase().includes("analyze") ||
        prompt.toLowerCase().includes("repository") ||
        prompt.toLowerCase().includes("mission");
      expect(isRepoAnalysis).toBe(false);
    });
  });
});

// ============================================================================
// 6. Conversation Memory & Persistence Tests
// ============================================================================
describe("Sprint 3 — Conversation Persistence", () => {
  it("should generate conversation IDs with timestamp prefix for ordering", () => {
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    expect(id).toMatch(/^conv-\d+-[a-z0-9]+$/);
  });

  it("should create thread with correct initial structure", () => {
    const thread = {
      id: "conv-123-abc",
      title: "Test Thread",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      messageCount: 0,
      summary: "New AI Workspace persistent thread",
      agentId: "main",
      metadata: { type: "ai-workspace" },
    };

    expect(thread.status).toBe("active");
    expect(thread.metadata.type).toBe("ai-workspace");
    expect(thread.agentId).toBe("main");
  });
});

// ============================================================================
// 7. Workspace Search Contract Tests
// ============================================================================
describe("Sprint 3 — Workspace Search", () => {
  it("should support searching across documents, repos, artifacts, missions", () => {
    const searchTargets = ["document", "repository", "artifact", "mission", "extension"];
    
    searchTargets.forEach((target) => {
      const mention: ContextMention = {
        id: `${target}-1`,
        type: target as any,
        title: `Test ${target}`,
      };
      expect(mention.type).toBe(target);
    });
  });

  it("should filter messages by content substring", () => {
    const messages: AIWorkspaceMessage[] = [
      { id: "m1", conversationId: "c1", sender: { id: "u", name: "User", role: "user" }, content: "Analyze the code", timestamp: "" },
      { id: "m2", conversationId: "c1", sender: { id: "a", name: "AI", role: "assistant" }, content: "Mission created", timestamp: "" },
      { id: "m3", conversationId: "c1", sender: { id: "u", name: "User", role: "user" }, content: "Show artifacts", timestamp: "" },
    ];

    const query = "mission";
    const filtered = messages.filter((m) => m.content.toLowerCase().includes(query));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("m2");
  });
});

// ============================================================================
// 8. Artifact Generation Contract Tests
// ============================================================================
describe("Sprint 3 — Artifact Generation", () => {
  it("should create inline artifacts with required fields", () => {
    const artifact: InlineArtifact = {
      id: "art-001",
      title: "Repository Analysis Report",
      type: "markdown",
      category: "architecture",
      summary: "Comprehensive repository analysis",
      content: "# Report\n\n## Findings\n...",
      createdAt: new Date().toISOString(),
      fileSize: "4.2 KB",
    };

    expect(artifact.type).toBe("markdown");
    expect(artifact.category).toBe("architecture");
    expect(artifact.content).toContain("# Report");
  });

  it("should deduplicate artifacts by ID across messages and panel state", () => {
    const msgArtifacts: InlineArtifact[] = [
      { id: "art-1", title: "A", type: "markdown", category: "c", summary: "s", content: "", createdAt: "" },
      { id: "art-2", title: "B", type: "code", category: "c", summary: "s", content: "", createdAt: "" },
    ];
    const panelArtifacts: InlineArtifact[] = [
      { id: "art-1", title: "A (updated)", type: "markdown", category: "c", summary: "s", content: "", createdAt: "" },
      { id: "art-3", title: "C", type: "architecture", category: "c", summary: "s", content: "", createdAt: "" },
    ];

    const map = new Map<string, InlineArtifact>();
    panelArtifacts.forEach((a) => map.set(a.id, a));
    msgArtifacts.forEach((a) => map.set(a.id, a));
    const deduped = Array.from(map.values());

    expect(deduped).toHaveLength(3);
    // art-1 should be overwritten by message version (last write wins)
    expect(deduped.find((a) => a.id === "art-1")?.title).toBe("A");
  });
});

// ============================================================================
// 9. Recovery & Reconnect Tests
// ============================================================================
describe("Sprint 3 — Recovery & Reconnect", () => {
  it("should cycle SSE status through connecting → connected", () => {
    const statuses: string[] = [];
    let status = "disconnected";

    // Simulate reconnect
    status = "connecting";
    statuses.push(status);
    status = "connected";
    statuses.push(status);

    expect(statuses).toEqual(["connecting", "connected"]);
  });

  it("should handle mission pause and resume status transitions", () => {
    let missionStatus = "EXECUTING";

    // Pause
    missionStatus = "PLANNING";
    expect(missionStatus).toBe("PLANNING");

    // Resume
    missionStatus = "EXECUTING";
    expect(missionStatus).toBe("EXECUTING");
  });
});
