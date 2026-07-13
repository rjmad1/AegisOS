// ============================================================================
// EKOS Advanced Types & Interfaces — Phase 9
// ============================================================================

import { KnowledgeEntity, Relationship, KnowledgeGraph } from "./knowledge";

// --- 1. Semantic Memory Types ---
export type MemoryType =
  | "entity"
  | "project"
  | "conversation"
  | "document"
  | "code"
  | "architecture"
  | "decision"
  | "adr"
  | "requirement"
  | "risk"
  | "issue"
  | "operational"
  | "workflow"
  | "agent"
  | "organization"
  | "customer";

export interface SemanticMemoryCell {
  id: string;
  type: MemoryType;
  name: string;
  content: string;
  ownerId: string;
  createdAt: string;
  modifiedAt: string;
  confidence: number;
  trustScore: number;
  sourceUri: string;
  linkedMemoryIds: string[];
  metadata?: Record<string, any>;
}

// --- 2. Advanced Graph Types ---
export interface PropertyNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  lineageId: string;
  version: string;
  owner: string;
  confidence: number;
  trustScore: number;
  sourceReferences: string[];
}

export interface AdvancedRelationship extends Relationship {
  id: string;
  weight: number;
  trustScore: number;
  provenance: string;
  metadata?: Record<string, any>;
}

// --- 3. Retrieval-Augmented Generation (RAG) Types ---
export interface RAGSearchParams {
  query: string;
  searchType: "hybrid" | "vector" | "keyword" | "graph" | "metadata" | "temporal";
  limit?: number;
  tenantId?: string;
  collections?: string[];
}

export interface GroundingVerification {
  isGrounded: boolean;
  score: number; // 0.0 to 1.0
  reasoning: string;
  unverifiedClaims: string[];
}

export interface RAGCitation {
  sourceId: string;
  sourceName: string;
  sourceUri: string;
  exactMatchText: string;
  confidence: number;
}

export interface RAGSearchResult {
  entity: KnowledgeEntity;
  score: number;
  citations: RAGCitation[];
  trustScore: number;
  freshnessScore: number;
}

export interface RAGQueryResponse {
  answer: string;
  confidence: number;
  results: RAGSearchResult[];
  grounding: GroundingVerification;
  latencyMs: number;
}

// --- 4. Governance & Quality Types ---
export type ApprovalStatus = "draft" | "pending_review" | "approved" | "certified" | "deprecated" | "expired";

export interface GovernanceRecord {
  entityId: string;
  approvalStatus: ApprovalStatus;
  stewardEmail: string;
  expirationDate?: string;
  certificationLevel: "gold" | "silver" | "bronze" | "none";
  qualityScore: number; // 0.0 to 1.0
  completeness: number; // 0.0 to 1.0
  consistency: number; // 0.0 to 1.0
  driftDetected: boolean;
  driftIndex: number;
  duplicateOf?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// --- 5. Organizational Intelligence Types ---
export interface CapabilityNode {
  id: string;
  name: string;
  description: string;
  maturityLevel: number; // 1 to 5
  ownerTeam: string;
  domainName: string;
}

export interface SMEProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  expertDomains: string[];
  capabilityIds: string[];
  confidence: number;
}

export interface KnowledgeGapReport {
  domain: string;
  expertCount: number;
  documentationCount: number;
  riskRating: "critical" | "high" | "medium" | "low";
  description: string;
}

// --- 6. Decision Intelligence Types ---
export type DecisionType =
  | "architecture"
  | "product"
  | "operational"
  | "security"
  | "ai"
  | "governance"
  | "incident";

export interface DecisionNode {
  id: string;
  type: DecisionType;
  title: string;
  description: string;
  status: "proposed" | "accepted" | "rejected" | "superseded";
  ownerEmail: string;
  createdAt: string;
  requirementIds: string[];
  codeFilePaths: string[];
  testFilePaths: string[];
  riskIds: string[];
  projectIds: string[];
}

// --- 7. Analytics & Scorecard Types ---
export interface ReadinessReport {
  overallScore: number; // 0 to 100
  graphDensity: number;
  totalEntities: number;
  totalRelationships: number;
  certifiedEntitiesCount: number;
  dataQualityAverage: number;
  averageTrustScore: number;
  knowledgeGapCount: number;
}

export interface TechDebtItem {
  id: string;
  entityId: string;
  entityName: string;
  debtType: "missing_owner" | "stale_content" | "low_trust" | "uncertified" | "broken_lineage";
  remediationCost: "low" | "medium" | "high";
  description: string;
}
