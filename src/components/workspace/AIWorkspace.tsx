"use client";

import * as React from "react";
import {
  Bot, User, Target, Cpu, BookOpen, FileText,
  ChevronRight, ChevronDown, Wrench, Sparkles, Search,
  Wifi, WifiOff, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConversationStore } from "@/store/conversationStore";
import { MissionPanel } from "./MissionPanel";
import { AgentPanel } from "./AgentPanel";
import { KnowledgePanel } from "./KnowledgePanel";
import { ArtifactPanel } from "./ArtifactPanel";
import { ContextMentionInput } from "./ContextMentionInput";
import type { AIWorkspaceMessage, InlineArtifact, ReasoningStep, ToolCallItem, PanelType } from "@/types/ai-workspace";

// ── Quick-Action Chips ──────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Analyze this repository", icon: Sparkles },
  { label: "Architecture Review", icon: Target },
  { label: "Security Assessment", icon: Cpu },
  { label: "Generate Documentation", icon: FileText },
];

// ── Panel Tab Configuration ─────────────────────────────────────────────
const PANEL_TABS: { key: PanelType; label: string; icon: React.ElementType }[] = [
  { key: "mission", label: "Mission", icon: Target },
  { key: "agent", label: "Agent", icon: Cpu },
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
  { key: "artifact", label: "Artifacts", icon: FileText },
];

// ── Inline Reasoning Accordion ──────────────────────────────────────────
const ReasoningAccordion: React.FC<{ steps: ReasoningStep[] }> = ({ steps }) => {
  const [open, setOpen] = React.useState(false);
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider hover:bg-purple-500/10 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Reasoning ({steps.length} steps)
      </button>
      {open && (
        <div className="px-3 pb-2 space-y-1.5">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-2 text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
              <div>
                <span className="font-semibold text-purple-300">{step.title}:</span>{" "}
                <span className="text-muted-foreground">{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Inline Tool Calls Display ───────────────────────────────────────────
const ToolCallsDisplay: React.FC<{ tools: ToolCallItem[] }> = ({ tools }) => {
  if (!tools || tools.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tools.map((tc) => (
        <span
          key={tc.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20"
        >
          <Wrench className="h-2.5 w-2.5" />
          {tc.toolName}
          {tc.durationMs != null && <span className="text-muted-foreground ml-1">({tc.durationMs}ms)</span>}
        </span>
      ))}
    </div>
  );
};

// ── Inline Artifact Card ────────────────────────────────────────────────
const InlineArtifactCard: React.FC<{ artifact: InlineArtifact }> = ({ artifact }) => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Card className="mt-3 bg-card/70 border-amber-500/30 shadow-sm hover:border-amber-500/50 transition-colors">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-foreground">{artifact.title}</span>
          </div>
          <Badge variant="secondary" className="text-[9px] font-mono capitalize">{artifact.type}</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{artifact.summary}</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-primary font-semibold hover:underline"
        >
          {expanded ? "Collapse" : "View Content"}
        </button>
        {expanded && (
          <pre className="p-3 rounded-lg bg-accent/20 border border-border/40 text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-48 overflow-y-auto custom-scrollbar">
            {artifact.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

// ── Message Bubble ──────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: AIWorkspaceMessage }> = ({ message }) => {
  const isAssistant = message.sender.role === "assistant";
  const isSystem = message.sender.role === "system";

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {/* Avatar */}
      {isAssistant && (
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 mt-1">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-1 max-w-[80%]">
        {/* Sender & Timestamp */}
        <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${isAssistant ? "justify-start" : "justify-end"}`}>
          <span className="font-bold">{message.sender.name}</span>
          <span>&bull;</span>
          <span className="font-mono">{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.missionStatus && (
            <Badge variant="default" className="text-[8px] font-mono capitalize ml-1">
              Mission: {message.missionStatus}
            </Badge>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`p-4 rounded-2xl border text-sm break-words whitespace-pre-wrap ${
            isAssistant
              ? "bg-card border-border/60 rounded-tl-none text-left"
              : isSystem
              ? "bg-accent/30 border-border/40 rounded-tl-none text-left italic"
              : "bg-primary text-primary-foreground border-transparent rounded-tr-none text-left"
          }`}
        >
          {message.content}
        </div>

        {/* Reasoning Steps */}
        {isAssistant && message.reasoningSteps && <ReasoningAccordion steps={message.reasoningSteps} />}

        {/* Tool Calls */}
        {isAssistant && message.toolCalls && <ToolCallsDisplay tools={message.toolCalls} />}

        {/* Inline Artifacts */}
        {message.artifacts?.map((art) => <InlineArtifactCard key={art.id} artifact={art} />)}

        {/* Duration */}
        {message.durationMs != null && (
          <span className="text-[10px] text-muted-foreground block font-mono">
            Inference: {(message.durationMs / 1000).toFixed(2)}s
          </span>
        )}
      </div>

      {/* User Avatar */}
      {!isAssistant && !isSystem && (
        <div className="p-2 rounded-lg bg-accent border border-border/40 text-muted-foreground shrink-0 mt-1">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

// ── Main AI Workspace Component ─────────────────────────────────────────
export const AIWorkspace: React.FC<{ threadId?: string }> = ({ threadId }) => {
  const {
    activeThread, messages, loadingMessages, sseStatus,
    activePanel, setActivePanel, isStreamingMessage,
    fetchThreads, selectThread, sendMessage, searchQuery, setSearchQuery,
  } = useConversationStore();

  const [inputValue, setInputValue] = React.useState("");
  const [panelOpen, setPanelOpen] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load thread on mount
  React.useEffect(() => {
    fetchThreads();
  }, []);

  React.useEffect(() => {
    if (threadId) {
      selectThread(threadId);
    }
  }, [threadId]);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleQuickAction = (label: string) => {
    setInputValue(label);
    sendMessage(label);
  };

  // Filtered messages (via search)
  const filteredMessages = searchQuery
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm shadow-lg">
      {/* ── Left: Conversation Stream ──────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Thread Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border/20 bg-card/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">
                {activeThread?.title || "AI Workspace"}
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                {filteredMessages.length} messages
                {activeThread?.missionId && ` · Mission: ${activeThread.missionId.slice(0, 8)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* SSE Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/20 border border-border/40 text-[10px] font-mono">
              {sseStatus === "connected" ? (
                <Wifi className="h-3 w-3 text-emerald-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-400 animate-pulse" />
              )}
              <span className={sseStatus === "connected" ? "text-emerald-400" : "text-red-400"}>
                {sseStatus === "connected" ? "Live" : sseStatus}
              </span>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent/20 border border-border/40 rounded-lg py-1.5 pl-7 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Panel Toggle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPanelOpen(!panelOpen)}
              className="p-2"
            >
              {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-accent/5 custom-scrollbar">
          {loadingMessages ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading conversation...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-foreground">Welcome to AI Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Everything begins with conversation. Ask a question, launch a mission, or reference your workspace knowledge.
                </p>
              </div>

              {/* Quick-Action Chips */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/30 border border-border/40 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all group"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}

          {/* Streaming Indicator */}
          {isStreamingMessage && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border/60 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick-Action Chips (when messages exist) */}
        {filteredMessages.length > 0 && (
          <div className="flex items-center gap-2 px-4 pt-2 border-t border-border/10 bg-card/40 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.slice(0, 3).map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 border border-border/30 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shrink-0"
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 border-t border-border/20 bg-card/60">
          <ContextMentionInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={isStreamingMessage}
          />
        </div>
      </div>

      {/* ── Right: Panel Drawer ──────────────────────────────────── */}
      {panelOpen && (
        <div className="w-[360px] shrink-0 border-l border-border/20 bg-card/60 flex flex-col overflow-hidden">
          {/* Panel Tabs */}
          <div className="flex items-center border-b border-border/20 bg-card/40 shrink-0">
            {PANEL_TABS.map((tab) => {
              const isActive = activePanel === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActivePanel(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold border-b-2 transition-all ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activePanel === "mission" && <MissionPanel />}
            {activePanel === "agent" && <AgentPanel />}
            {activePanel === "knowledge" && <KnowledgePanel />}
            {activePanel === "artifact" && <ArtifactPanel />}
          </div>
        </div>
      )}
    </div>
  );
};
