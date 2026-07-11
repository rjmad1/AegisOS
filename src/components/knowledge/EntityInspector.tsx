// ============================================================================
// Entity Inspector — Universal Detail Sliding Inspection Panel (Step 13)
// ============================================================================

"use client";

import * as React from "react";
import {
  Info,
  Calendar,
  Layers,
  ArrowRight,
  GitBranch,
  Tag,
  Link as LinkIcon,
  Server,
  Zap,
  Activity,
  AlertCircle
} from "lucide-react";
import { KnowledgeEntity, Reference, Lineage } from "@/types/knowledge";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface EntityInspectorProps {
  entityId: string;
  onClose?: () => void;
  onFocusEntity?: (entityId: string) => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  entityId,
  onClose,
  onFocusEntity
}) => {
  const [entity, setEntity] = React.useState<KnowledgeEntity | null>(null);
  const [lineage, setLineage] = React.useState<Lineage | null>(null);
  const [references, setReferences] = React.useState<{ incoming: Reference[]; outgoing: Reference[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch details dynamically when entityId changes
  React.useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Entity
        const entRes = await fetch(`/api/v1/knowledge/entities?id=${entityId}`);
        if (!entRes.ok) throw new Error("Entity metadata not found");
        const entJson = await entRes.json();
        setEntity(entJson);

        // Fetch Lineage
        const linRes = await fetch(`/api/v1/knowledge/lineage?id=${entityId}`);
        if (linRes.ok) {
          const linJson = await linRes.json();
          setLineage(linJson);
        }

        // Fetch References
        const refRes = await fetch(`/api/v1/knowledge/references?id=${entityId}`);
        if (refRes.ok) {
          const refJson = await refRes.json();
          setReferences(refJson);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load entity details");
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchDetails();
    }
  }, [entityId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Inspecting relationships network...</span>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="p-6 text-center text-red-500 space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <h4 className="font-bold text-sm">Failed to Load Node</h4>
        <p className="text-xs text-muted-foreground">{error || "Entity not found in graph registry."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar text-left">
      {/* Title block */}
      <div className="border-b border-border/40 pb-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <Badge variant="secondary" className="uppercase text-[9px] font-mono tracking-wider mb-2">
              {entity.type}
            </Badge>
            <h3 className="text-lg font-bold font-mono tracking-tight text-foreground truncate max-w-[280px]" title={entity.name}>
              {entity.name}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xs font-bold border border-border/40 px-2 py-1 rounded bg-secondary/20"
            >
              Close
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {entity.description}
        </p>
      </div>

      {/* Metadata / Tags */}
      {entity.tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="h-3 w-3" /> Associated Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {entity.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="px-2 py-0.5 text-[9px] font-bold font-mono">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lineage pathway tracer (Step 5) */}
      {lineage && lineage.path && lineage.path.length > 1 && (
        <Card className="border-border/40 bg-accent/5">
          <CardHeader className="py-3 bg-secondary/10">
            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-primary" /> Trace Lineage Provenance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {lineage.path.map((nodeId, idx) => {
                const isCurrent = nodeId === entity.id;
                return (
                  <div key={idx} className="flex items-start gap-3 pl-5 relative">
                    <span className={`absolute left-0.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                      isCurrent ? "bg-primary border-primary" : "bg-card border-border"
                    }`}>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="flex flex-col text-left">
                      <button
                        onClick={() => onFocusEntity?.(nodeId)}
                        className={`text-xs font-mono font-bold hover:underline truncate max-w-[220px] ${
                          isCurrent ? "text-primary cursor-default" : "text-foreground"
                        }`}
                        disabled={isCurrent}
                      >
                        {nodeId.length > 25 ? nodeId.slice(0, 22) + "..." : nodeId}
                      </button>
                      {idx < lineage.path.length - 1 && lineage.relationships[idx] && (
                        <span className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                          &bull; {lineage.relationships[idx].type.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Metadata inspector */}
      <Card className="border-border/40">
        <CardHeader className="py-3 bg-secondary/10">
          <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" /> Object Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar text-xs font-mono space-y-2">
            <div className="flex justify-between border-b border-border/20 py-1">
              <span className="text-muted-foreground">Entity ID</span>
              <span className="font-semibold select-all text-foreground truncate max-w-[180px]" title={entity.id}>{entity.id}</span>
            </div>
            <div className="flex justify-between border-b border-border/20 py-1">
              <span className="text-muted-foreground">Type</span>
              <span className="font-semibold text-foreground uppercase">{entity.type}</span>
            </div>
            {Object.entries(entity.metadata || {}).map(([key, val]) => {
              if (typeof val === "object" && val !== null) {
                return (
                  <div key={key} className="border-b border-border/20 py-1 space-y-1">
                    <span className="text-muted-foreground block">{key}</span>
                    <pre className="text-[10px] bg-secondary/40 p-2 rounded max-h-24 overflow-y-auto scrollbar-thin select-all leading-normal whitespace-pre-wrap break-all text-left">
                      {JSON.stringify(val, null, 2)}
                    </pre>
                  </div>
                );
              }
              return (
                <div key={key} className="flex justify-between border-b border-border/20 py-1">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-semibold text-foreground truncate max-w-[180px]" title={String(val)}>{String(val)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reference connections */}
      {references && (references.incoming.length > 0 || references.outgoing.length > 0) && (
        <Card className="border-border/40">
          <CardHeader className="py-3 bg-secondary/10">
            <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> Reference Network (Links)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            {/* Outgoing links */}
            {references.outgoing.length > 0 && (
              <div className="space-y-2 text-left">
                <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Outgoing Dependencies</span>
                <div className="space-y-1.5">
                  {references.outgoing.map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-accent/5 border border-border/20 text-xs">
                      <div className="flex flex-col text-left">
                        <button
                          onClick={() => onFocusEntity?.(ref.targetId)}
                          className="font-mono font-bold hover:underline truncate max-w-[160px] text-foreground"
                        >
                          {ref.targetId.split("-")[0]}...
                        </button>
                        <span className="text-[9px] text-muted-foreground font-semibold mt-0.5">{ref.type}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incoming links */}
            {references.incoming.length > 0 && (
              <div className="space-y-2 text-left">
                <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wider">Incoming Consumers</span>
                <div className="space-y-1.5">
                  {references.incoming.map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-accent/5 border border-border/20 text-xs">
                      <div className="flex flex-col text-left">
                        <button
                          onClick={() => onFocusEntity?.(ref.sourceId)}
                          className="font-mono font-bold hover:underline truncate max-w-[160px] text-foreground"
                        >
                          {ref.sourceId.split("-")[0]}...
                        </button>
                        <span className="text-[9px] text-muted-foreground font-semibold mt-0.5">{ref.type}</span>
                      </div>
                      <LinkIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ingested: {new Date(entity.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(entity.modifiedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
