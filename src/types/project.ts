// src/types/project.ts

export interface ProjectSettings {
  defaultAiModel: string | null;
  knowledgeBaseIds: string[];
  enabledFeatures: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface Project {
  id: string;
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'archived' | 'completed' | 'deleted';
  settings: ProjectSettings;
  goals: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
