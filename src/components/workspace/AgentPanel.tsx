"use client";

import * as React from "react";
import { Cpu, GitFork, Brain, Wrench, Shield, CheckCircle, Terminal, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useConversationStore } from "@/store/conversationStore";

export const AgentPanel: React.FC = () => {
  const { delegationTree, messages } = useConversationStore();

  // Extract latest reasoning step or thought stream from messages
  const lastAssistantMsg = [...messages].reverse().find(m => m.sender.role === "assistant");
  const latestThought = lastAssistantMsg?.reasoningSteps?.[lastAssistantMsg.reasoningSteps.length - 1];

  return (
    <div className="p-4 space-y-4 text-left font-sans">
      {/* Panel Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight">Agent & Delegation Panel</h3>
        </div>
        <Badge variant="success" className="text-[10px] font-mono">
          3 Agents Online
        </Badge>
      </div>

      {/* Primary Agent Card */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest block">Main Orchestrator</span>
              <h4 className="text-sm font-bold text-foreground">AegisOS Orchestrator Agent</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <div className="p-2 rounded-lg bg-accent/20 border border-border/40">
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Model Runtime</span>
              <span className="font-mono font-bold text-cyan-400">ollama/smollm:135m</span>
            </div>
            <div className="p-2 rounded-lg bg-accent/20 border border-border/40">
              <span className="text-[9px] text-muted-foreground block uppercase font-bold">Memory Provider</span>
              <span className="font-mono font-bold text-foreground">local-sqlite</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subagent Delegation Tree */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-border/20 pb-2">
            <GitFork className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider">Subagent Delegation Tree</span>
          </div>

          <div className="space-y-3 pl-2 border-l-2 border-primary/30">
            {delegationTree.map((rootNode) => (
              <div key={rootNode.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-foreground">{rootNode.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] capitalize font-mono">
                    {rootNode.status}
                  </Badge>
                </div>

                {rootNode.children && rootNode.children.length > 0 && (
                  <div className="pl-4 space-y-2 border-l border-border/40">
                    {rootNode.children.map((child) => (
                      <div key={child.id} className="p-2.5 rounded-lg bg-accent/20 border border-border/40 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{child.name}</span>
                          <Badge 
                            variant={child.status === "completed" ? "success" : "secondary"} 
                            className="text-[9px] font-mono capitalize"
                          >
                            {child.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{child.role}</p>
                        {child.activeTool && (
                          <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-amber-400 font-mono">
                            <Wrench className="h-3 w-3 shrink-0" />
                            <span>Tool: {child.activeTool}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Thought Stream / Reasoning */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Thought Stream</span>
          </div>

          <div className="p-3 rounded-lg bg-accent/15 border border-purple-500/20 text-xs font-mono space-y-1">
            <span className="text-purple-300 font-bold block text-[10px]">
              [{latestThought ? latestThought.title : "Context Synthesis"}]
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {latestThought 
                ? latestThought.detail 
                : "Analyzing prompt intent, loading workspace knowledge vectors, and preparing execution graph nodes..."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
