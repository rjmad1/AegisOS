// src/store/conversationStore.ts
// AegisOS Studio — AI Workspace Conversation Store

import { create } from "zustand";
import { 
  AIWorkspaceMessage, 
  AIWorkspaceThread, 
  ContextMention, 
  InlineArtifact, 
  PanelType, 
  SubagentNode, 
  ToolCallItem 
} from "@/types/ai-workspace";
import { Mission } from "@/types/mission";

export interface ConversationStoreState {
  // Threads & Active State
  threads: AIWorkspaceThread[];
  activeThreadId: string | null;
  activeThread: AIWorkspaceThread | null;
  messages: AIWorkspaceMessage[];
  loadingMessages: boolean;
  
  // 4 Live Panels State
  activePanel: PanelType; // 'mission' | 'agent' | 'knowledge' | 'artifact' | null
  activeMission: Mission | null;
  delegationTree: SubagentNode[];
  referencedKnowledge: ContextMention[];
  workspaceArtifacts: InlineArtifact[];
  
  // Streaming & Connection State
  sseStatus: "connecting" | "connected" | "reconnecting" | "error" | "disconnected";
  isStreamingMessage: boolean;
  
  // Context Mentions (@ in message input)
  attachedMentions: ContextMention[];
  
  // Filters & Search
  searchQuery: string;
  
  // Actions
  fetchThreads: () => Promise<void>;
  selectThread: (threadId: string) => Promise<void>;
  createThread: (title?: string, initialMessage?: string) => Promise<string>;
  sendMessage: (content: string, workspaceId?: string, projectId?: string) => Promise<void>;
  attachMention: (mention: ContextMention) => void;
  removeMention: (mentionId: string) => void;
  clearMentions: () => void;
  setActivePanel: (panel: PanelType) => void;
  setSearchQuery: (query: string) => void;
  pauseMission: () => Promise<void>;
  resumeMission: () => Promise<void>;
  reconnectSSE: () => void;
  loadContextSuggestions: (query: string) => Promise<ContextMention[]>;
}

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  activeThread: null,
  messages: [],
  loadingMessages: false,
  
  activePanel: "mission",
  activeMission: null,
  delegationTree: [
    {
      id: "main-orchestrator",
      name: "Main Orchestrator Agent",
      role: "Mission planning, context synthesis, & subagent dispatch",
      status: "idle",
      children: [
        {
          id: "developer-subagent",
          name: "Developer Subagent",
          role: "Codebase index scanning & structural inspection",
          status: "idle",
          activeTool: "edit"
        },
        {
          id: "reviewer-subagent",
          name: "Reviewer Subagent",
          role: "Architecture verification & security compliance check",
          status: "idle",
          activeTool: "skill_workshop"
        }
      ]
    }
  ],
  referencedKnowledge: [],
  workspaceArtifacts: [],
  
  sseStatus: "connected",
  isStreamingMessage: false,
  attachedMentions: [],
  searchQuery: "",

  fetchThreads: async () => {
    try {
      const res = await fetch("/api/v1/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const loadedThreads: AIWorkspaceThread[] = data.conversations.map((c: any) => ({
        id: c.id,
        title: c.title,
        startedAt: c.startedAt,
        updatedAt: c.updatedAt,
        status: c.status,
        messageCount: c.messageCount || 0,
        summary: c.summary,
        agentId: c.agentId || "main",
        metadata: c.metadata
      }));
      set({ threads: loadedThreads });
      
      // Auto-select first thread if none active
      if (!get().activeThreadId && loadedThreads.length > 0) {
        get().selectThread(loadedThreads[0].id);
      }
    } catch (e) {
      console.error("[ConversationStore] Failed to fetch threads:", e);
    }
  },

  selectThread: async (threadId: string) => {
    set({ activeThreadId: threadId, loadingMessages: true });
    try {
      const res = await fetch(`/api/v1/conversations/${threadId}`);
      if (!res.ok) throw new Error("Conversation fetch failed");
      const data = await res.json();
      
      const threadObj: AIWorkspaceThread = {
        id: data.id,
        title: data.title,
        startedAt: data.startedAt,
        updatedAt: data.updatedAt,
        status: data.status,
        messageCount: data.messageCount || 0,
        summary: data.summary,
        agentId: data.agentId || "main",
        metadata: data.metadata
      };

      const msgs: AIWorkspaceMessage[] = (data.messages || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId || threadId,
        sender: m.sender || { id: "user", name: "User", role: "user" },
        content: m.content || "",
        timestamp: m.timestamp || new Date().toISOString(),
        durationMs: m.durationMs,
        reasoningSteps: m.reasoningSteps || [],
        toolCalls: m.toolCalls || [],
        artifacts: m.artifacts || [],
        contextMentions: m.contextMentions || [],
        missionId: m.missionId,
        missionStatus: m.missionStatus
      }));

      // Fetch mission details if linked
      let mission: Mission | null = null;
      if (data.metadata?.missionId) {
        try {
          const mRes = await fetch(`/api/v1/missions/${data.metadata.missionId}`);
          if (mRes.ok) {
            mission = await mRes.json();
          }
        } catch (e) {}
      }

      set({
        activeThread: threadObj,
        messages: msgs,
        activeMission: mission,
        loadingMessages: false
      });
    } catch (e) {
      console.error("[ConversationStore] Failed to select thread:", e);
      set({ loadingMessages: false });
    }
  },

  createThread: async (title?: string, initialMessage?: string) => {
    const threadTitle = title || "New AI Conversation";
    try {
      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: threadTitle, initialMessage })
      });
      const data = await res.json();
      await get().fetchThreads();
      if (data.id) {
        await get().selectThread(data.id);
        return data.id;
      }
    } catch (e) {
      console.error("[ConversationStore] Failed to create thread:", e);
    }
    return "";
  },

  sendMessage: async (content: string, workspaceId?: string, projectId?: string) => {
    let threadId = get().activeThreadId;
    if (!threadId) {
      threadId = await get().createThread(content.slice(0, 35) + "...", content);
      if (!threadId) return;
    }

    const mentions = [...get().attachedMentions];
    get().clearMentions();

    // Optimistic user message append
    const userMsg: AIWorkspaceMessage = {
      id: `msg-${Date.now()}-user`,
      conversationId: threadId,
      sender: { id: "user", name: "Operator", role: "user" },
      content,
      timestamp: new Date().toISOString(),
      contextMentions: mentions
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreamingMessage: true
    }));

    try {
      const res = await fetch(`/api/v1/conversations/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          contextMentions: mentions,
          workspaceId,
          projectId
        })
      });

      if (!res.ok) throw new Error("Failed to post message");
      const result = await res.json();

      // Update active thread with response and updated mission details
      if (result.assistantMessage) {
        set((state) => ({
          messages: [
            ...state.messages.filter((m) => m.id !== userMsg.id),
            result.userMessage || userMsg,
            result.assistantMessage
          ],
          activeMission: result.mission || state.activeMission,
          workspaceArtifacts: result.artifacts ? [...state.workspaceArtifacts, ...result.artifacts] : state.workspaceArtifacts,
          referencedKnowledge: result.knowledgeReferences ? [...state.referencedKnowledge, ...result.knowledgeReferences] : state.referencedKnowledge,
          isStreamingMessage: false
        }));
      }
    } catch (e) {
      console.error("[ConversationStore] Send message error:", e);
      set({ isStreamingMessage: false });
    }
  },

  attachMention: (mention: ContextMention) => {
    set((state) => {
      if (state.attachedMentions.some((m) => m.id === mention.id)) return {};
      return { attachedMentions: [...state.attachedMentions, mention] };
    });
  },

  removeMention: (mentionId: string) => {
    set((state) => ({
      attachedMentions: state.attachedMentions.filter((m) => m.id !== mentionId)
    }));
  },

  clearMentions: () => set({ attachedMentions: [] }),

  setActivePanel: (panel: PanelType) => set({ activePanel: panel }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  pauseMission: async () => {
    const mission = get().activeMission;
    if (!mission) return;
    try {
      await fetch(`/api/v1/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" })
      });
      set({ activeMission: { ...mission, status: "PLANNING" } });
    } catch (e) {}
  },

  resumeMission: async () => {
    const mission = get().activeMission;
    if (!mission) return;
    try {
      await fetch(`/api/v1/missions/${mission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" })
      });
      set({ activeMission: { ...mission, status: "EXECUTING" } });
    } catch (e) {}
  },

  reconnectSSE: () => {
    set({ sseStatus: "connecting" });
    setTimeout(() => {
      set({ sseStatus: "connected" });
    }, 800);
  },

  loadContextSuggestions: async (query: string): Promise<ContextMention[]> => {
    const suggestions: ContextMention[] = [];
    const q = query.toLowerCase();

    // 1. Repos / Projects
    try {
      const projRes = await fetch("/api/v1/projects");
      if (projRes.ok) {
        const data = await projRes.json();
        const projs = data.projects || [];
        projs.forEach((p: any) => {
          if (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) {
            suggestions.push({
              id: `repo-${p.id}`,
              type: "repository",
              title: p.name,
              subtitle: `Branch: ${p.branch || "main"} • ${p.commitCount || 42} commits`,
              uri: p.repositoryUrl
            });
          }
        });
      }
    } catch (e) {}

    // 2. Knowledge Documents
    try {
      const kRes = await fetch("/api/v1/knowledge");
      if (kRes.ok) {
        const data = await kRes.json();
        const docs = data.documents || [];
        docs.forEach((d: any) => {
          if (!q || d.title.toLowerCase().includes(q)) {
            suggestions.push({
              id: `doc-${d.id}`,
              type: "document",
              title: d.title,
              subtitle: `${d.fileType || "doc"} • ${d.chunkCount || 12} vectors`,
              snippet: d.summary
            });
          }
        });
      }
    } catch (e) {}

    // 3. Artifacts
    try {
      const artRes = await fetch("/api/v1/artifacts?limit=10");
      if (artRes.ok) {
        const data = await artRes.json();
        const arts = data.artifacts || [];
        arts.forEach((a: any) => {
          if (!q || a.title.toLowerCase().includes(q)) {
            suggestions.push({
              id: `art-${a.id}`,
              type: "artifact",
              title: a.title,
              subtitle: `Artifact (${a.type}) • ${a.category}`,
              snippet: a.summary
            });
          }
        });
      }
    } catch (e) {}

    return suggestions;
  }
}));
