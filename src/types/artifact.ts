export type ArtifactType =
  | "word"
  | "excel"
  | "powerpoint"
  | "pdf"
  | "markdown"
  | "image"
  | "csv"
  | "json"
  | "yaml"
  | "html"
  | "mermaid"
  | "svg"
  | "zip"
  | "text"
  | "unknown";

export type ArtifactLifecycleState =
  | "draft"
  | "processing"
  | "available"
  | "archived"
  | "deleted"
  | "failed";

export interface ArtifactMetadata {
  [key: string]: any;
}

export interface ArtifactRelationship {
  targetId: string;
  type: "parent" | "child" | "derivation" | "input" | "output" | "workflow" | "conversation";
  description?: string;
}

export interface ArtifactStorageRef {
  provider: "local" | "s3" | "gcs" | "database" | "custom";
  uri: string;
  checksum?: {
    algorithm: "sha256" | "md5";
    value: string;
  };
  compression?: "none" | "gzip" | "zip";
}

export interface ArtifactPreviewStatus {
  isAvailable: boolean;
  status: "unsupported" | "pending" | "ready" | "failed";
  location?: string;
  errorMessage?: string;
}

export interface ArtifactProcessingStatus {
  phase: "unprocessed" | "extracting" | "indexing" | "vectorizing" | "quantizing" | "completed" | "failed";
  progressPercentage: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface ArtifactSearchStatus {
  isIndexed: boolean;
  indexedAt?: string;
  indexId?: string;
  vectorStatus: "unindexed" | "pending" | "indexed" | "failed";
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  type: ArtifactType;
  mimeType: string;
  size: number; // in bytes
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  tags: string[];
  status: "active" | "archived" | "deleted"; // Kept for compatibility with legacy components
  lifecycleState: ArtifactLifecycleState;
  storage: ArtifactStorageRef;
  relationships: ArtifactRelationship[];
  preview: ArtifactPreviewStatus;
  processing: ArtifactProcessingStatus;
  search: ArtifactSearchStatus;
  thumbnail?: string;
  previewSupported: boolean;
  downloadSupported: boolean;
  deleteSupported: boolean;
  version: string;
  conversationId: string;
  workflowId: string;
  metadata: ArtifactMetadata;
}

export interface ArtifactFilter {
  type?: ArtifactType;
  search?: string;
  tags?: string[];
  conversationId?: string;
  workflowId?: string;
  lifecycleState?: ArtifactLifecycleState;
}
