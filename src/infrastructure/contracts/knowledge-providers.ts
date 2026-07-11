// ============================================================================
// Knowledge Provider Contracts — Phase 8
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";
import { KnowledgeEntity } from "@/types/knowledge";

export interface IKnowledgeProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  getEntities(): Promise<KnowledgeEntity[]>;
}

export interface IArtifactKnowledgeProvider extends IKnowledgeProvider {}
export interface IConversationKnowledgeProvider extends IKnowledgeProvider {}
export interface IExecutionKnowledgeProvider extends IKnowledgeProvider {}
export interface IWorkflowKnowledgeProvider extends IKnowledgeProvider {}
export interface IPromptKnowledgeProvider extends IKnowledgeProvider {}
export interface IModelKnowledgeProvider extends IKnowledgeProvider {}
export interface IConfigurationKnowledgeProvider extends IKnowledgeProvider {}
export interface IDocumentationProvider extends IKnowledgeProvider {}
export interface ILogProvider extends IKnowledgeProvider {}
export interface IEventProvider extends IKnowledgeProvider {}
