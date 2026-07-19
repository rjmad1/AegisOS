// src/platform/control-plane/digital-twin/core/edge.ts

export interface DigitalTwinEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  confidence: number; // 0.0 - 1.0
  evidence?: string;  // evidence hash
  properties: Record<string, any>;
}
