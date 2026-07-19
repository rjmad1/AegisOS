// src/platform/control-plane/digital-twin/projections/projection-types.ts
import { DigitalTwinNode } from '../core/node';
import { DigitalTwinEdge } from '../core/edge';

export interface GraphProjection {
  nodes: DigitalTwinNode[];
  edges: DigitalTwinEdge[];
  metadata: {
    projectionType: string;
    nodeCount: number;
    edgeCount: number;
    timestamp: number;
  };
}

export interface TopologyProjection extends GraphProjection {
  metadata: {
    projectionType: 'Topology';
    nodeCount: number;
    edgeCount: number;
    timestamp: number;
    healthyCount: number;
    degradedCount: number;
    criticalCount: number;
  };
}

export interface CapabilityProjection extends GraphProjection {
  capabilities: {
    id: string;
    name: string;
    status: string;
    providersCount: number;
  }[];
}

export interface DependencyProjection extends GraphProjection {
  cyclesDetected: boolean;
  violationsCount: number;
}
