// src/platform/pik/kernel/evolution/providers/types.ts
import { PropertyNode } from '@/types/knowledge-fabric';

export interface CanonicalAsset extends PropertyNode {
  // Reuses PropertyNode fields:
  // id, label, type, properties, lineageId, version, owner, confidence, trustScore, sourceReferences
}

export interface DiscoveryProvider {
  name: string;
  discover(): Promise<CanonicalAsset[]>;
}
