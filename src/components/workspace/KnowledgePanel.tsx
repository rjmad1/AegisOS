"use client";

import * as React from "react";
import { BookOpen, FolderGit2, FileText, Lightbulb, Database, Hash, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useConversationStore } from "@/store/conversationStore";

export const KnowledgePanel: React.FC = () => {
  const { referencedKnowledge, activeMission } = useConversationStore();

  return (
    <div className="p-4 space-y-4 text-left font-sans">
      {/* Panel Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold tracking-tight">Knowledge Context</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          Auto-Referenced
        </Badge>
      </div>

      {/* Referenced Documents */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Indexed Documents</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">3 Docs</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-accent/20 border border-border/40 space-y-1 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">ADR-005 Modular Capabilities.md</span>
                <Badge variant="secondary" className="text-[9px] font-mono">14 vectors</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Architectural decision record governing platform module contracts.</p>
            </div>

            <div className="p-2.5 rounded-lg bg-accent/20 border border-border/40 space-y-1 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">AegisOS Engineering Constitution</span>
                <Badge variant="secondary" className="text-[9px] font-mono">32 vectors</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Supreme engineering authority governing platform implementation principles.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repositories & Workspace Index */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <div className="flex items-center space-x-2">
              <FolderGit2 className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Active Workspace Repo</span>
            </div>
            <Badge variant="success" className="text-[9px]">Indexed</Badge>
          </div>

          <div className="p-3 rounded-lg bg-accent/20 border border-border/40 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">rjmad1/AegisOS</span>
              <span className="font-mono text-[10px] text-muted-foreground">Branch: main</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Local path: <span className="font-mono text-foreground">d:/1_Projects/OpenClawOllamaLiteLLM_Transparency</span>
            </p>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-muted-foreground pt-1">
              <span>142 files</span>
              <span>&bull;</span>
              <span>16 modules</span>
              <span>&bull;</span>
              <span>CodeGraph Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Learned & Mission Memory */}
      <Card className="bg-card/70 border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-border/20 pb-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Lessons Learned & Memory</span>
          </div>

          {activeMission?.lessons && activeMission.lessons.length > 0 ? (
            <div className="space-y-2 text-xs">
              {activeMission.lessons.map((lesson, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <span className="font-bold block text-[10px]">Lesson #{idx + 1}</span>
                  <p className="text-[11px] mt-0.5">{lesson}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-accent/20 border border-border/40 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Workspace Memory Active</span>
              <p className="text-[11px]">
                Prior mission reflections stored in <span className="font-mono text-primary">mission_memory</span> registry. Reuse pattern applied automatically.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
