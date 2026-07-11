"use client";

import * as React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Search, ShieldAlert, Cpu } from "lucide-react";
import type { RelationshipGraphData, GraphNode, GraphEdge, GraphNodeType } from "@/types/ai-runtime";

interface RelationshipGraphProps {
  data: RelationshipGraphData;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ data }) => {
  const [zoom, setZoom] = React.useState(0.85);
  const [pan, setPan] = React.useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<GraphNodeType | "all">("all");
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  const containerRef = React.useRef<SVGSVGElement>(null);

  // Lay out nodes in vertical/horizontal hierarchies (layered architecture layout)
  const laidOutNodes = React.useMemo(() => {
    // Group nodes by type
    const groups: Record<GraphNodeType, GraphNode[]> = {
      provider: [],
      gateway: [],
      alias: [],
      model: [],
      capability: [],
      runtime: [],
      dependency: []
    };

    data.nodes.forEach(node => {
      if (groups[node.type]) {
        groups[node.type].push(node);
      }
    });

    const columns: GraphNodeType[] = ["provider", "gateway", "alias", "model", "capability"];
    const layout: Record<string, { x: number; y: number }> = {};

    const colWidth = 240;
    const rowHeight = 90;

    columns.forEach((type, colIndex) => {
      const nodesInCol = groups[type] || [];
      const totalHeight = (nodesInCol.length - 1) * rowHeight;
      const startY = 300 - totalHeight / 2;

      nodesInCol.forEach((node, rowIndex) => {
        layout[node.id] = {
          x: 50 + colIndex * colWidth,
          y: startY + rowIndex * rowHeight
        };
      });
    });

    return layout;
  }, [data.nodes]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === "circle" || (e.target as HTMLElement).tagName === "text" || (e.target as HTMLElement).tagName === "rect") {
      return; // Don't pan if clicking directly on a node element
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

  const filteredNodes = React.useMemo(() => {
    return data.nodes.filter(node => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            node.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || node.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [data.nodes, searchTerm, selectedType]);

  const filteredNodeIds = React.useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Style helper for nodes
  const getNodeColor = (type: GraphNodeType) => {
    switch (type) {
      case "provider": return { fill: "#10B981", stroke: "#047857", text: "#A7F3D0" }; // Green
      case "gateway": return { fill: "#3B82F6", stroke: "#1D4ED8", text: "#BFDBFE" }; // Blue
      case "alias": return { fill: "#F59E0B", stroke: "#B45309", text: "#FDE68A" }; // Orange
      case "model": return { fill: "#8B5CF6", stroke: "#6D28D9", text: "#DDD6FE" }; // Purple
      case "capability": return { fill: "#EC4899", stroke: "#BE185D", text: "#FBCFE8" }; // Pink
      default: return { fill: "#6B7280", stroke: "#374151", text: "#E5E7EB" };
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border/40 rounded-xl overflow-hidden bg-card/25 backdrop-blur-md relative">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-border/40 bg-secondary/20 gap-4 z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search nodes..."
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
              <option value="provider">Underlying Providers</option>
              <option value="gateway">AI Gateways</option>
              <option value="alias">Aliases</option>
              <option value="model">Underlying Models</option>
              <option value="capability">Capabilities</option>
            </select>
          </div>
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
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.2))}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setZoom(0.85); setPan({ x: 100, y: 50 }); }}
            title="Reset View"
            className="p-1.5 rounded hover:bg-secondary/50 text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing select-none outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground) / 0.4)" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges */}
          {data.edges.map((edge, idx) => {
            const sourcePos = laidOutNodes[edge.source];
            const targetPos = laidOutNodes[edge.target];

            if (!sourcePos || !targetPos) return null;

            // Highlight connection if hovered
            const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
            const isDimmed = hoveredNode !== null && !isHighlighted;

            return (
              <g key={idx}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isHighlighted ? "rgb(139, 92, 246)" : "hsl(var(--border) / 0.6)"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.type === "aliases" ? "4,4" : undefined}
                  markerEnd="url(#arrow)"
                  className="transition-all duration-200"
                  opacity={isDimmed ? 0.15 : 0.7}
                />
                {edge.label && isHighlighted && (
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 8}
                    fill="rgb(167, 139, 250)"
                    fontSize="10"
                    textAnchor="middle"
                    className="font-mono bg-black"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render nodes */}
          {data.nodes.map((node) => {
            const pos = laidOutNodes[node.id];
            if (!pos) return null;

            const colors = getNodeColor(node.type);
            const isMatch = filteredNodeIds.has(node.id);
            const isHovered = hoveredNode === node.id;
            const isDimmed = hoveredNode !== null && !isHovered &&
                             !data.edges.some(e => (e.source === node.id && e.target === hoveredNode) ||
                                                    (e.target === node.id && e.source === hoveredNode));

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                opacity={isDimmed ? 0.2 : isMatch ? 1 : 0.3}
              >
                {/* Node Box */}
                <rect
                  x="-90"
                  y="-25"
                  width="180"
                  height="50"
                  rx="8"
                  fill="hsl(var(--card) / 0.85)"
                  stroke={isHovered ? "rgb(139, 92, 246)" : colors.stroke}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200 shadow-md"
                />

                {/* Subtitle/Type Tag */}
                <rect
                  x="-80"
                  y="-18"
                  width="40"
                  height="12"
                  rx="3"
                  fill={colors.fill}
                  opacity="0.2"
                />
                <text
                  x="-60"
                  y="-10"
                  textAnchor="middle"
                  fill={colors.fill}
                  fontSize="7"
                  fontWeight="bold"
                  className="uppercase tracking-wide font-mono"
                >
                  {node.type}
                </text>

                {/* Status Dot */}
                <circle
                  cx="70"
                  cy="-12"
                  r="4"
                  fill={node.status === "healthy" ? "#10B981" : node.status === "degraded" ? "#F59E0B" : "#EF4444"}
                />

                {/* Main Label */}
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="11"
                  fontWeight="600"
                  className="font-mono truncate select-none"
                >
                  {node.label.length > 20 ? node.label.slice(0, 17) + "..." : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-muted-foreground z-10 pointer-events-none">
        <span>Drag canvas to pan. Use mouse wheel or buttons to zoom. Hover on node to trace relationships.</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Healthy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Degraded</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Critical</span>
        </div>
      </div>
    </div>
  );
};

export default RelationshipGraph;
