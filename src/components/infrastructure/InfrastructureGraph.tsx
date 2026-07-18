// ============================================================================
// Infrastructure Topology Graph — Pure React + SVG Canvas
// ============================================================================

"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Search, Columns, Rows } from "lucide-react";

export type InfraNodeType =
  | "host"
  | "operating_system"
  | "gpu"
  | "process"
  | "service"
  | "database"
  | "container"
  | "ai_runtime"
  | "model"
  | "artifact"
  | "knowledge"
  | "projects";

export interface GraphNode {
  id: string;
  label: string;
  type: InfraNodeType;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  description?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface InfrastructureGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
}

export const InfrastructureGraph: React.FC<InfrastructureGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId
}) => {
  const [zoom, setZoom] = React.useState(0.65);
  const [pan, setPan] = React.useState({ x: 150, y: 50 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<InfraNodeType | "all">("all");
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [layoutMode, setLayoutMode] = React.useState<"horizontal" | "vertical">("vertical");

  const containerRef = React.useRef<SVGSVGElement>(null);

  // Lay out nodes dynamically depending on vertical or horizontal orientation
  const laidOutNodes = React.useMemo(() => {
    // Group nodes by type
    const groups: Record<InfraNodeType, GraphNode[]> = {
      host: [],
      operating_system: [],
      gpu: [],
      process: [],
      service: [],
      database: [],
      container: [],
      ai_runtime: [],
      model: [],
      artifact: [],
      knowledge: [],
      projects: []
    };

    nodes.forEach(node => {
      if (groups[node.type]) {
        groups[node.type].push(node);
      }
    });

    const columns: InfraNodeType[] = [
      "host",
      "operating_system",
      "gpu",
      "container",
      "process",
      "service",
      "database",
      "ai_runtime",
      "model",
      "knowledge",
      "projects",
      "artifact"
    ];

    const layout: Record<string, { x: number; y: number }> = {};

    if (layoutMode === "horizontal") {
      const colWidth = 220;
      const rowHeight = 70;
      columns.forEach((type, colIndex) => {
        const nodesInCol = groups[type] || [];
        const totalHeight = (nodesInCol.length - 1) * rowHeight;
        const startY = 250 - totalHeight / 2;

        nodesInCol.forEach((node, rowIndex) => {
          layout[node.id] = {
            x: 40 + colIndex * colWidth,
            y: startY + rowIndex * rowHeight
          };
        });
      });
    } else {
      // Vertical Waterfall Flow: top-to-bottom
      const levelHeight = 110;
      const nodeSpacing = 200;
      columns.forEach((type, levelIndex) => {
        const nodesInLevel = groups[type] || [];
        const totalWidth = (nodesInLevel.length - 1) * nodeSpacing;
        const startX = 350 - totalWidth / 2;

        nodesInLevel.forEach((node, rowIndex) => {
          layout[node.id] = {
            x: startX + rowIndex * nodeSpacing,
            y: 40 + levelIndex * levelHeight
          };
        });
      });
    }

    return layout;
  }, [nodes, layoutMode]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Check if target is background or node
    const targetTag = (e.target as HTMLElement).tagName;
    if (targetTag === "circle" || targetTag === "text" || targetTag === "rect") {
      return; // Don't drag the canvas when interacting with node
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
    setZoom(Math.min(Math.max(newZoom, 0.15), 3));
  };

  const filteredNodes = React.useMemo(() => {
    return nodes.filter(node => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || node.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [nodes, searchTerm, selectedType]);

  const filteredNodeIds = React.useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Color mappings
  const getNodeColor = (type: InfraNodeType) => {
    switch (type) {
      case "host":
        return { fill: "#10B981", stroke: "#047857", text: "#A7F3D0" };
      case "operating_system":
        return { fill: "#3B82F6", stroke: "#1D4ED8", text: "#BFDBFE" };
      case "gpu":
        return { fill: "#8B5CF6", stroke: "#6D28D9", text: "#DDD6FE" };
      case "process":
        return { fill: "#F59E0B", stroke: "#B45309", text: "#FDE68A" };
      case "service":
        return { fill: "#3B82F6", stroke: "#1D4ED8", text: "#BFDBFE" };
      case "database":
        return { fill: "#EF4444", stroke: "#B91C1C", text: "#FEE2E2" };
      case "container":
        return { fill: "#06B6D4", stroke: "#0E7490", text: "#CFFAFE" };
      case "ai_runtime":
        return { fill: "#6366F1", stroke: "#4338CA", text: "#E0E7FF" };
      case "model":
        return { fill: "#EC4899", stroke: "#BE185D", text: "#FCE7F3" };
      case "artifact":
        return { fill: "#EAB308", stroke: "#A16207", text: "#FEF9C3" };
      case "knowledge":
        return { fill: "#14B8A6", stroke: "#0F766E", text: "#CCFBF1" };
      case "projects":
        return { fill: "#6366F1", stroke: "#4338CA", text: "#E0E7FF" };
      default:
        return { fill: "#6B7280", stroke: "#374151", text: "#E5E7EB" };
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border/40 rounded-xl overflow-hidden bg-card/25 backdrop-blur-md relative select-none">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-border/40 bg-secondary/20 gap-4 z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search components..."
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
              <option value="all">All Layers</option>
              <option value="host">Host Node</option>
              <option value="operating_system">Operating System</option>
              <option value="gpu">GPU Node</option>
              <option value="process">Processes</option>
              <option value="service">Services</option>
              <option value="database">Databases</option>
              <option value="container">Containers</option>
              <option value="ai_runtime">AI Runtime</option>
              <option value="model">AI Models</option>
              <option value="knowledge">Knowledge</option>
              <option value="projects">Projects</option>
              <option value="artifact">Artifacts</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-secondary/30 p-1.5 rounded-lg border border-border/20">
            <button
              onClick={() => setLayoutMode("horizontal")}
              title="Horizontal Layout"
              className={`p-1.5 rounded transition-colors ${
                layoutMode === "horizontal" ? "bg-primary text-white" : "hover:bg-secondary/50 text-foreground"
              }`}
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayoutMode("vertical")}
              title="Vertical Layout"
              className={`p-1.5 rounded transition-colors ${
                layoutMode === "vertical" ? "bg-primary text-white" : "hover:bg-secondary/50 text-foreground"
              }`}
            >
              <Rows className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary/30 p-1.5 rounded-lg border border-border/20">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
              title="Zoom In"
              className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.15))}
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoom(0.65);
                setPan(layoutMode === "vertical" ? { x: 150, y: 50 } : { x: 30, y: 120 });
              }}
              title="Reset View"
              className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrow-infra"
            viewBox="0 0 10 10"
            refX="25"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground) / 0.4)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges */}
          {edges.map((edge, idx) => {
            const sourcePos = laidOutNodes[edge.source];
            const targetPos = laidOutNodes[edge.target];

            if (!sourcePos || !targetPos) return null;

            const isSelectedLink = selectedNodeId === edge.source || selectedNodeId === edge.target;
            const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target || isSelectedLink;
            const isDimmed = hoveredNode !== null && !isHighlighted;

            return (
              <g key={idx}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isSelectedLink ? "rgb(99, 102, 241)" : isHighlighted ? "rgb(139, 92, 246)" : "hsl(var(--border) / 0.6)"}
                  strokeWidth={isSelectedLink ? 3.0 : isHighlighted ? 2.5 : 1.5}
                  markerEnd="url(#arrow-infra)"
                  className="transition-all duration-200"
                  opacity={isDimmed ? 0.15 : 0.7}
                />
              </g>
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const pos = laidOutNodes[node.id];
            if (!pos) return null;

            const colors = getNodeColor(node.type);
            const isMatch = filteredNodeIds.has(node.id);
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNode === node.id;
            const isDimmed =
              hoveredNode !== null &&
              !isHovered &&
              !edges.some(
                e =>
                  (e.source === node.id && e.target === hoveredNode) ||
                  (e.target === node.id && e.source === hoveredNode)
              );

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode?.(node)}
                opacity={isDimmed ? 0.2 : isMatch ? 1 : 0.3}
              >
                {/* Node Box */}
                <rect
                  x="-85"
                  y="-22"
                  width="170"
                  height="44"
                  rx="6"
                  fill="hsl(var(--card) / 0.85)"
                  stroke={isSelected ? "rgb(99, 102, 241)" : isHovered ? "rgb(139, 92, 246)" : colors.stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.2}
                  className="transition-all duration-200 shadow-md"
                />

                {/* Subtitle/Type Tag */}
                <rect x="-76" y="-16" width="36" height="10" rx="2" fill={colors.fill} opacity="0.15" />
                <text
                  x="-58"
                  y="-9"
                  textAnchor="middle"
                  fill={colors.fill}
                  fontSize="6.5"
                  fontWeight="bold"
                  className="uppercase tracking-wider font-mono"
                >
                  {node.type.replace("_", " ")}
                </text>

                {/* Status Dot */}
                <circle
                  cx="65"
                  cy="-10"
                  r="3.5"
                  fill={
                    node.status === "healthy"
                      ? "#10B981"
                      : node.status === "degraded"
                      ? "#F59E0B"
                      : "#EF4444"
                  }
                />

                {/* Main Label */}
                <text
                  x="0"
                  y="10"
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="9.5"
                  fontWeight="600"
                  className="font-mono truncate select-none"
                >
                  {node.label.length > 20 ? node.label.slice(0, 17) + "..." : node.label}
                </text>

                {/* Description Hover tooltip */}
                {isHovered && node.description && (
                  <g transform="translate(0, 32)" className="pointer-events-none">
                    <rect x="-75" y="-10" width="150" height="20" rx="4" fill="black" opacity="0.85" />
                    <text x="0" y="3" textAnchor="middle" fill="#E5E7EB" fontSize="8" className="font-mono">
                      {node.description}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-muted-foreground z-10 pointer-events-none">
        <span>Click node to inspect. Drag to pan. Scroll to zoom. Hover to trace links.</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Degraded
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> Critical
          </span>
        </div>
      </div>
    </div>
  );
};
