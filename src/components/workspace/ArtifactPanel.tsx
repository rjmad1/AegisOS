"use client";

import * as React from "react";
import { FileText, Image, Code, BookMarked, Download, ExternalLink, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConversationStore } from "@/store/conversationStore";
import type { InlineArtifact } from "@/types/ai-workspace";

const typeIcons: Record<string, React.ElementType> = {
  markdown: FileText,
  architecture: BookMarked,
  code: Code,
  decision_log: BookMarked,
  pdf: FileText,
  image: Image,
};

export const ArtifactPanel: React.FC = () => {
  const { workspaceArtifacts, messages } = useConversationStore();
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  // Collect all artifacts from messages + panel state (deduped)
  const allArtifacts = React.useMemo(() => {
    const map = new Map<string, InlineArtifact>();
    workspaceArtifacts.forEach((a) => map.set(a.id, a));
    messages.forEach((m) => {
      m.artifacts?.forEach((a) => map.set(a.id, a));
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [workspaceArtifacts, messages]);

  const previewArtifact = previewId ? allArtifacts.find((a) => a.id === previewId) : null;

  return (
    <div className="p-4 space-y-4 text-left font-sans">
      {/* Panel Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-tight">Generated Artifacts</h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          {allArtifacts.length} items
        </Badge>
      </div>

      {/* Preview Modal */}
      {previewArtifact && (
        <Card className="bg-card border-primary/30 shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">{previewArtifact.title}</h4>
              <Button size="sm" variant="ghost" onClick={() => setPreviewId(null)} className="text-xs">
                Close
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-accent/20 border border-border/40 max-h-64 overflow-y-auto custom-scrollbar">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {previewArtifact.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artifact List */}
      {allArtifacts.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground space-y-3">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No Artifacts Yet</p>
            <p className="text-xs">
              Artifacts appear automatically as missions execute. Send an analysis prompt to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {allArtifacts.map((artifact) => {
            const Icon = typeIcons[artifact.type] || FileText;
            return (
              <Card
                key={artifact.id}
                className="bg-card/70 border-border/60 shadow-sm hover:border-primary/40 transition-colors group cursor-pointer"
                onClick={() => setPreviewId(previewId === artifact.id ? null : artifact.id)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground truncate pr-2">{artifact.title}</h4>
                        <Badge variant="secondary" className="text-[9px] font-mono capitalize shrink-0">
                          {artifact.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{artifact.summary}</p>
                      <div className="flex items-center space-x-3 pt-1 text-[10px] text-muted-foreground font-mono">
                        <span>{artifact.category}</span>
                        {artifact.fileSize && (
                          <>
                            <span>&bull;</span>
                            <span>{artifact.fileSize}</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{new Date(artifact.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions (shown on hover) */}
                  <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2"
                      leftIcon={<Eye className="h-3 w-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewId(artifact.id);
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2"
                      leftIcon={<ExternalLink className="h-3 w-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/artifacts/${artifact.id}`, "_blank");
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
