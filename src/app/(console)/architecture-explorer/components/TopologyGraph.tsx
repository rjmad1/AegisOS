"use client";

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { Cpu, Network, Box } from 'lucide-react';

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 25 }, data: { label: 'Platform Kernel (PRM)' }, type: 'input' },
  { id: '2', position: { x: 100, y: 150 }, data: { label: 'Participant A (Agent)' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Workflow DAG Executor' } },
  { id: '4', position: { x: 400, y: 250 }, data: { label: 'Tool Capability' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

export function TopologyGraph() {
  const { theme } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const bgColor = theme === 'dark' || theme === 'high-contrast' ? '#0a0a0a' : '#ffffff';
  const gridColor = theme === 'dark' || theme === 'high-contrast' ? '#333' : '#e5e5e5';

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode={theme === 'dark' || theme === 'high-contrast' ? 'dark' : 'light'}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color={gridColor} />
      </ReactFlow>
    </div>
  );
}
