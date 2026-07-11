// ============================================================================
// Canonical Knowledge Models — Phase 8
// ============================================================================

export type KnowledgeEntityType =
  | "artifact"
  | "conversation"
  | "message"
  | "execution"
  | "workflow"
  | "agent"
  | "tool"
  | "provider"
  | "model"
  | "file"
  | "event"
  | "infrastructure"
  | "settings"
  | "documentation";

export interface KnowledgeScore {
  semanticScore: number;
  recencyScore: number;
  frequencyScore: number;
  totalScore: number;
}

export interface KnowledgeEntity {
  id: string;
  type: KnowledgeEntityType;
  name: string;
  description: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  modifiedAt: string;
  score?: KnowledgeScore;
}

export type CollectionType =
  | "project"
  | "conversation"
  | "workflow"
  | "research"
  | "reports"
  | "documentation"
  | "architecture"
  | "operations"
  | "infrastructure";

export interface KnowledgeCollection {
  id: string;
  name: string;
  description: string;
  type: CollectionType;
  entityIds: string[];
  metadata?: Record<string, any>;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: KnowledgeEntityType;
  status: "healthy" | "degraded" | "unhealthy" | "unknown" | string;
  metadata?: Record<string, any>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label: string; // e.g. "generated_by", "uses"
  type: string;  // e.g. "generated-by", "uses", "depends-on"
}

export type RelationshipType =
  | "generated_by"
  | "derived_from"
  | "references"
  | "depends_on"
  | "uses"
  | "produces"
  | "consumes"
  | "belongs_to"
  | "executed_by"
  | "triggered_by"
  | "contains"
  | "related_to"
  | "parent"
  | "child"
  | "version_of"
  | "supersedes"
  | "duplicate_of";

export interface Relationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType | string;
  metadata?: Record<string, any>;
}

export interface Reference {
  sourceId: string;
  targetId: string;
  type: string;
}

export interface Citation {
  entityId: string;
  sourceText: string;
  location?: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface Topic {
  name: string;
  description: string;
  score: number;
}

export interface Concept {
  id: string;
  name: string;
  definition: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Lineage {
  entityId: string;
  path: string[]; // List of entity IDs tracing back to origin
  relationships: Relationship[];
}

export interface Source {
  entityId: string;
  uri: string;
  type: string;
}

export interface Evidence {
  score: number;
  description: string;
  confidence: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  text: string;
  index: number;
  metadata?: Record<string, any>;
}

export interface EmbeddingReference {
  vector: number[];
  model: string;
  dimension: number;
}

export interface SemanticCluster {
  id: string;
  name: string;
  entityIds: string[];
  centroid?: number[];
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgePath {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface KnowledgeSnapshot {
  id: string;
  timestamp: number;
  graph: KnowledgeGraph;
}
