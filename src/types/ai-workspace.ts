// src/types/ai-workspace.ts
// AegisOS Studio — AI Workspace & Conversation Types

import { Mission, MissionStatus } from "./mission";
import { ExecutionStep } from "./runtime";

export type PanelType = "mission" | "agent" | "knowledge" | "artifact" | "execution" | null;

export interface ContextMention {
  id: string;
  type: "document" | "repository" | "artifact" | "mission" | "extension" | "memory";
  title: string;
  subtitle?: string;
  uri?: string;
  snippet?: string;
  metadata?: Record<string, any>;
}

export interface InlineArtifact {
  id: string;
  title: string;
  type: "markdown" | "architecture" | "code" | "decision_log" | "pdf" | "image";
  category: string;
  summary: string;
  content: string;
  createdAt: string;
  fileSize?: string;
}

export interface SubagentNode {
  id: string;
  name: string;
  role: string;
  status: "idle" | "thinking" | "executing" | "completed" | "failed";
  currentTask?: string;
  activeTool?: string;
  model?: string;
  children?: SubagentNode[];
}

export interface ToolCallItem {
  id: string;
  toolName: string;
  category?: string;
  status: "running" | "completed" | "failed";
  input?: any;
  output?: any;
  durationMs?: number;
}

export interface ReasoningStep {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  agentId?: string;
}

export interface AIWorkspaceMessage {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    role: "user" | "assistant" | "system";
    avatar?: string;
  };
  content: string;
  timestamp: string;
  durationMs?: number;
  reasoningSteps?: ReasoningStep[];
  toolCalls?: ToolCallItem[];
  artifacts?: InlineArtifact[];
  contextMentions?: ContextMention[];
  missionId?: string;
  missionStatus?: MissionStatus;
  delegationTree?: SubagentNode[];
  isStreaming?: boolean;
}

export interface AIWorkspaceThread {
  id: string;
  title: string;
  startedAt: string;
  updatedAt: string;
  status: "active" | "completed" | "archived" | "paused";
  messageCount: number;
  summary: string;
  agentId: string;
  missionId?: string;
  workspaceId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}
