// src/platform/control-plane/digital-twin/core/node.ts
import { LifecycleState, HealthStatus } from '../../types';

export type TwinNodeType =
  | 'Topology'
  | 'Capability'
  | 'Dependency'
  | 'Workflow'
  | 'Provider'
  | 'Runtime'
  | 'Evidence'
  | 'Resource'
  | 'Governance';

export interface DigitalTwinNode {
  id: string;
  type: TwinNodeType;
  version: string;
  state: LifecycleState;
  health: HealthStatus;
  properties: Record<string, any>;
  labels: string[];
  source: string;
  timestamp: number;
}
