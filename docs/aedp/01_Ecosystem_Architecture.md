# AegisOS Ecosystem Architecture & API Contracts
## Ecosystem Architecture, System Taxonomy, and Core API Specification

> **Status**: APPROVED & OPERATIONAL  
> **Target Version**: AegisOS Ecosystem 1.0  
> **Audience**: Platform Architects, Extension Developers, SDK Engineers, Integration Partners  

---

## 1. Architectural Overview

The **AegisOS Ecosystem Architecture** defines a strict, layered abstraction model. Certified Core Platform services provide immutable low-level runtime primitives, while Ecosystem APIs expose safe, versioned interfaces for Extensions, Mission Packs, Reference Applications, and Marketplaces.

```mermaid
graph TD
    subgraph Layer 4: Reference Products & UI
        REF_DEV["Developer Workspace"]
        REF_PM["Product Manager Workspace"]
        REF_OPS["Enterprise Operations Center"]
        REF_RES["Research Studio"]
        REF_PERSONAL["Personal AI Workspace"]
        REF_EXEC["Executive Decision Center"]
    end

    subgraph Layer 3: Mission Packs & Solutions
        MP_SWE["Software Eng Pack"]
        MP_ARCH["Architecture Pack"]
        MP_SEC["Security Pack"]
        MP_OPS["Infra Ops Pack"]
        MP_PM["PM Pack"]
    end

    subgraph Layer 2: Ecosystem APIs & Extensions
        API_PLATFORM["Platform APIs"]
        API_EXT["Extension APIs"]
        API_MISSION["Mission APIs"]
        API_KNOWLEDGE["Knowledge APIs"]
        API_WS["Workspace APIs"]
        API_EXEC["Execution APIs"]
        API_ART["Artifact APIs"]
        API_MKT["Marketplace APIs"]
    end

    subgraph Layer 1: Core Platform Kernel (RC1 Certified)
        KERNEL["AegisOS Kernel & EventBus"]
        LITELLM["LiteLLM Inference Proxy"]
        OLLAMA["Ollama Local Model Engine"]
        DB["Prisma Relational Persistence"]
        MCP["MCP Context & Tool Gateway"]
    end

    REF_DEV --> API_WS
    REF_DEV --> API_MISSION
    REF_PM --> API_KNOWLEDGE
    MP_SWE --> API_MISSION
    MP_ARCH --> API_ART

    API_PLATFORM --> KERNEL
    API_EXT --> KERNEL
    API_MISSION --> KERNEL
    API_KNOWLEDGE --> MCP
    API_EXEC --> LITELLM
    API_EXEC --> OLLAMA
    API_ART --> DB
    API_MKT --> DB
```

---

## 2. Nine-Tier Ecosystem Capability Taxonomy

Every capability in the repository is mapped to a specific ecosystem tier:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REUSABLE CAPABILITY MAP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Core Platform     │ Kernel, EventBus, Auth, Storage, AI-Runtime         │
│ 2. Extensions        │ Logger, Translator, CodeGraph, Monitoring Adapters  │
│ 3. Mission Packs     │ SWE, Architecture, PM, Infra Ops, Security          │
│ 4. Reference Apps    │ Developer, PM, Ops, Research, Executive Workspaces  │
│ 5. SDK               │ `@aegisos/extension-sdk`, `@aegisos/mission-sdk`   │
│ 6. Tooling           │ Aegis CLI (`aegis-cli`), Test Runner, Emulator      │
│ 7. Templates         │ Extension Starter, Mission Pack Starter, App Spec   │
│ 8. Documentation     │ Architecture Handbook, API Reference, Guides        │
│ 9. Community         │ Community Extensions, Custom Prompts, Integrations │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Eight Core Ecosystem API Specifications

To enable safe external product development, AegisOS defines 8 standardized Ecosystem APIs. All APIs expose strongly-typed TypeScript interfaces, JSON schemas, and REST/gRPC contracts.

### 3.1 Platform APIs (`@aegisos/api-platform`)
Provides system-level capabilities including configuration management, system health, audit logging, and feature flags.

```typescript
export interface IAegisPlatformAPI {
  getSystemStatus(): Promise<SystemStatus>;
  getConfig<T = unknown>(key: string, defaultValue?: T): Promise<T>;
  logAuditEntry(entry: AuditLogParams): Promise<void>;
  getHealthDiagnostics(): Promise<HealthCheckReport>;
}
```

### 3.2 Extension APIs (`@aegisos/api-extension`)
Enables dynamic registration, lifecycle hook management, and inter-extension RPC over the AegisOS EventBus.

```typescript
export interface IAegisExtensionAPI {
  registerPlugin(manifest: ExtensionManifest): Promise<PluginRegistrationResult>;
  on(event: string, handler: EventHandler): Subscription;
  emit(event: string, payload: unknown): void;
  getLoadedExtensions(): Promise<ExtensionInfo[]>;
}
```

### 3.3 Mission APIs (`@aegisos/api-mission`)
Manages task definitions, goal decomposition, multi-step execution plans, verification gates, and step status reporting.

```typescript
export interface IAegisMissionAPI {
  registerMissionPack(pack: MissionPackDescriptor): Promise<void>;
  executeMission(missionId: string, parameters: MissionInput): Promise<MissionExecutionResult>;
  getMissionStatus(executionId: string): Promise<MissionExecutionState>;
  cancelMission(executionId: string): Promise<boolean>;
}
```

### 3.4 Knowledge APIs (`@aegisos/api-knowledge`)
Exposes vector indexing, semantic search, RAG retrieval, context caching, and Knowledge Item (KI) lifecycle management.

```typescript
export interface IAegisKnowledgeAPI {
  queryContext(query: KnowledgeQuery): Promise<KnowledgeSearchResult>;
  indexDocument(doc: DocumentDescriptor): Promise<IndexingStatus>;
  getKnowledgeItems(category?: string): Promise<KnowledgeItem[]>;
}
```

### 3.5 Workspace APIs (`@aegisos/api-workspace`)
Manages UI layouts, widget registration, panel state, user sessions, active document tracking, and themes.

```typescript
export interface IAegisWorkspaceAPI {
  registerWidget(widget: WidgetDefinition): void;
  updateLayout(layout: WorkspaceLayoutConfig): void;
  getActiveWorkspaceContext(): Promise<WorkspaceContextState>;
  notifyUser(notification: UserNotification): void;
}
```

### 3.6 Execution APIs (`@aegisos/api-execution`)
Handles LLM prompt execution, streaming model inference, LiteLLM gateway routing, model switching, and token budgeting.

```typescript
export interface IAegisExecutionAPI {
  completePrompt(request: CompletionRequest): Promise<CompletionResponse>;
  streamPrompt(request: CompletionRequest, callback: StreamCallback): Promise<void>;
  getAvailableModels(): Promise<ModelDescriptor[]>;
}
```

### 3.7 Artifact APIs (`@aegisos/api-artifact`)
Provides standardized document generation, versioning, diff tracking, and file storage for outputs generated by agents or missions.

```typescript
export interface IAegisArtifactAPI {
  createArtifact(params: CreateArtifactParams): Promise<ArtifactMetadata>;
  updateArtifact(id: string, updates: Partial<ArtifactMetadata>): Promise<ArtifactMetadata>;
  getArtifactContent(id: string): Promise<string>;
  listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMetadata[]>;
}
```

### 3.8 Marketplace APIs (`@aegisos/api-marketplace`)
Governs capability discovery, extension installation, mission pack purchasing/downloading, and signature verification.

```typescript
export interface IAegisMarketplaceAPI {
  searchMarketplace(query: MarketplaceSearchQuery): Promise<MarketplaceListing[]>;
  installAsset(assetId: string, version?: string): Promise<InstallationResult>;
  verifyAssetSignature(assetId: string): Promise<SignatureVerificationResult>;
}
```

---

## 4. Architectural Safeguards & Compatibility

1. **Strict Versioning**: All Ecosystem APIs follow Semantic Versioning (SemVer `v1.x`).
2. **Backward Compatibility Guarantee**: Core APIs maintain backward compatibility within major releases.
3. **Sandboxing**: Third-party extensions execute in isolated worker threads or web-workers with gated capabilities.
