// ============================================================================
// Knowledge Graph Visualizer — Center-Focused Radial Layout
// ============================================================================

"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Search, Focus } from "lucide-react";
import { KnowledgeNode, KnowledgeEdge, KnowledgeEntityType } from "@/types/knowledge";

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeSelect?: (nodeId: string) => void;
  focusedNodeId?: string | null;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes,
  edges,
  onNodeSelect,
  focusedNodeId: externalFocusedId
}) => {
  const [zoom, setZoom] = React.useState(0.8);
  const [pan, setPan] = React.useState({ x: 350, y: 220 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<KnowledgeEntityType | "all">("all");
  const [hoveredNodeId, setHoveredNodeId] = React.useState<string | null>(null);
  
  // Local focus tracker if none passed from parent
  const [localFocusedId, setLocalFocusedId] = React.useState<string | null>(null);
  const activeFocusId = externalFocusedId !== undefined ? externalFocusedId : localFocusedId;

  // Set default initial focus node
  React.useEffect(() => {
    if (!activeFocusId && nodes.length > 0) {
      // Prefer prompt, workflow or conversation for center focus
      const pref = nodes.find(n => n.type === "workflow" || n.type === "conversation") || nodes[0];
      handleFocus(pref.id);
    }
  }, [nodes, activeFocusId]);

  const handleFocus = (nodeId: string) => {
    if (externalFocusedId === undefined) {
      setLocalFocusedId(nodeId);
    }
    if (onNodeSelect) {
      onNodeSelect(nodeId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName !== "svg" && (e.target as HTMLElement).tagName !== "line") {
      return; // Don't drag if clicking directly on a node
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scaleFactor = 1.05;
    const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
    setZoom(Math.min(Math.max(newZoom, 0.2), 3));
  };

  // Compile layout coordinates dynamically centered around the activeFocusId (Lazy load sub-graph)
  const graphLayout = React.useMemo(() => {
    const layout: Record<string, { x: number; y: number; level: number }> = {};
    if (!activeFocusId) return layout;

    // Level 0: Central Node
    layout[activeFocusId] = { x: 0, y: 0, level: 0 };

    // Find direct connections (Level 1)
    const level1Nodes = new Set<string>();
    edges.forEach(e => {
      if (e.source === activeFocusId && e.target !== activeFocusId) {
        level1Nodes.add(e.target);
      } else if (e.target === activeFocusId && e.source !== activeFocusId) {
        level1Nodes.add(e.source);
      }
    });

    const level1Array = Array.from(level1Nodes);
    level1Array.forEach((nodeId, idx) => {
      const angle = (idx / level1Array.length) * 2 * Math.PI;
      const R1 = 150;
      layout[nodeId] = {
        x: Math.round(R1 * Math.cos(angle)),
        y: Math.round(R1 * Math.sin(angle)),
        level: 1
      };
    });

    // Find level 2 connections (connected to level 1 but not level 0)
    const level2Nodes = new Set<string>();
    level1Array.forEach(parent => {
      edges.forEach(e => {
        let childId = "";
        if (e.source === parent) childId = e.target;
        else if (e.target === parent) childId = e.source;

        if (childId && childId !== activeFocusId && !level1Nodes.has(childId) && childId !== parent) {
          level2Nodes.add(childId);
        }
      });
    });

    const level2Array = Array.from(level2Nodes);
    level2Array.forEach((nodeId, idx) => {
      const angle = (idx / level2Array.length) * 2 * Math.PI;
      const R2 = 280;
      layout[nodeId] = {
        x: Math.round(R2 * Math.cos(angle)),
        y: Math.round(R2 * Math.sin(angle)),
        level: 2
      };
    });

    return layout;
  }, [activeFocusId, edges]);

  // Style helper by entity type
  const getNodeStyles = (type: KnowledgeEntityType) => {
    switch (type) {
      case "artifact":
        return { fill: "#10B981", stroke: "#047857" }; // Emerald
      case "conversation":
        return { fill: "#3B82F6", stroke: "#1D4ED8" }; // Blue
      case "execution":
        return { fill: "#F59E0B", stroke: "#B45309" }; // Orange
      case "workflow":
        return { fill: "#8B5CF6", stroke: "#6D28D9" }; // Purple
      case "model":
        return { fill: "#EC4899", stroke: "#BE185D" }; // Pink
      case "agent":
        return { fill: "#6366F1", stroke: "#4338CA" }; // Indigo
      case "tool":
        return { fill: "#06B6D4", stroke: "#0E7490" }; // Cyan
      case "documentation":
        return { fill: "#EAB308", stroke: "#A16207" }; // Yellow
      case "infrastructure":
        return { fill: "#EF4444", stroke: "#B91C1C" }; // Red
      case "event":
        return { fill: "#84CC16", stroke: "#4D7C0F" }; // Lime
      default:
        return { fill: "#6B7280", stroke: "#374151" };
    }
  };

  // Filters nodes that should be displayed
  const visibleNodes = React.useMemo(() => {
    return nodes.filter(node => {
      const isPositioned = graphLayout[node.id] !== undefined;
      const matchesSearch =
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || node.type === selectedType;

      return isPositioned && matchesSearch && matchesType;
    });
  }, [nodes, graphLayout, searchTerm, selectedType]);

  const visibleNodeIds = React.useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  return (
    <div className="flex flex-col h-[520px] border border-border/40 rounded-xl overflow-hidden bg-card/25 backdrop-blur-md relative select-none">
      {/* Search and control bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-border/40 bg-secondary/20 gap-4 z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/30 border border-border/30 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-secondary/30 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Object Types</option>
              <option value="artifact">Artifacts</option>
              <option value="conversation">Conversations</option>
              <option value="execution">Executions</option>
              <option value="workflow">Workflows</option>
              <option value="agent">Agents</option>
              <option value="tool">Tools</option>
              <option value="model">Models</option>
              <option value="documentation">Documentation</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-secondary/30 p-1.5 rounded-lg border border-border/20">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
            className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))}
            className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(0.8);
              setPan({ x: 350, y: 220 });
            }}
            className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <svg
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrow-knowledge"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground) / 0.4)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {edges.map((edge, idx) => {
            const sourcePos = graphLayout[edge.source];
            const targetPos = graphLayout[edge.target];

            if (!sourcePos || !targetPos) return null;

            // Highlight connection if node is hovered/focused
            const isRelated = hoveredNodeId === edge.source || hoveredNodeId === edge.target;
            const isActive = activeFocusId === edge.source || activeFocusId === edge.target;
            const isDimmed =
              (hoveredNodeId !== null && !isRelated) ||
              (hoveredNodeId === null && activeFocusId !== null && !isActive);

            return (
              <g key={idx}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isRelated ? "#6366f1" : isActive ? "rgb(139, 92, 246)" : "hsl(var(--border) / 0.5)"}
                  strokeWidth={isRelated ? 2.5 : isActive ? 2 : 1.2}
                  markerEnd="url(#arrow-knowledge)"
                  opacity={isDimmed ? 0.15 : 0.7}
                  className="transition-all duration-200"
                />
                {/* Edge relationship label text */}
                {(isRelated || isActive) && (
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 5}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="7.5"
                    className="font-mono bg-background px-1"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const pos = graphLayout[node.id];
            if (!pos) return null;

            const styles = getNodeStyles(node.type);
            const isCenter = node.id === activeFocusId;
            const isHovered = node.id === hoveredNodeId;
            
            // Hover dimming
            const isDimmed =
              hoveredNodeId !== null &&
              !isHovered &&
              !edges.some(
                e =>
                  (e.source === node.id && e.target === hoveredNodeId) ||
                  (e.target === node.id && e.source === hoveredNodeId)
              );

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => handleFocus(node.id)}
                opacity={isDimmed ? 0.25 : 1}
              >
                {/* Node circle */}
                <circle
                  r={isCenter ? 24 : isHovered ? 20 : 16}
                  fill="hsl(var(--card))"
                  stroke={isCenter ? "rgb(139, 92, 246)" : styles.stroke}
                  strokeWidth={isCenter ? 4 : isHovered ? 2.5 : 1.5}
                  className="transition-all duration-300 shadow-lg"
                />
                <circle
                  r={isCenter ? 12 : 8}
                  fill={styles.fill}
                  opacity="0.85"
                />

                {/* Focus indicator ring */}
                {isCenter && (
                  <circle
                    r="32"
                    fill="none"
                    stroke="rgb(139, 92, 246)"
                    strokeWidth="1"
                    strokeDasharray="4, 4"
                    className="animate-spin"
                    style={{ animationDuration: "12s" }}
                  />
                )}

                {/* Node Name Label */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize={isCenter ? "10.5" : "9"}
                  fontWeight={isCenter ? "bold" : "600"}
                  className="font-mono select-none"
                >
                  {node.label.length > 18 ? node.label.slice(0, 15) + "..." : node.label}
                </text>

                {/* Node Tag/Type below label */}
                <text
                  y="45"
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="7.5"
                  className="uppercase tracking-wider font-mono opacity-70"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Helper Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-muted-foreground z-10 pointer-events-none">
        <span>Click node to center-focus & load sub-network relationships. Drag to pan. Scroll to zoom.</span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span> Conversation
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Artifact
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span> Workflow
          </span>
        </div>
      </div>
    </div>
  );
};
