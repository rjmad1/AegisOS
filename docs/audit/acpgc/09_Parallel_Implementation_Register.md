# Parallel Implementation Register

**Date**: 2026-07-21
**Scope**: AegisOS Core Architecture Components

This register documents competing or duplicate implementations of the same architectural primitive. Parallel implementations violate the Single Source of Truth and Single Authoritative Runtime principles (Article I of the Engineering Constitution).

## 1. Resource Manager Duplication

**Description**: There are two distinct `ResourceManager` implementations that appear to manage platform resources independently.
**Evidence**:
- [src/platform/resources/ResourceManager.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/resources/ResourceManager.ts) (Standalone singleton managing LLM models and token pools)
- [src/platform/kernel/ResourceManager.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/kernel/ResourceManager.ts) (Kernel-integrated service fulfilling `IPlatformResourceManager`)
**Impact**: High. Resources checked out from one manager may not be tracked by the other, leading to overallocation, race conditions, and unpredictable orchestration behavior.
**Recommendation**: Consolidate `src/platform/resources/ResourceManager.ts` into `src/platform/kernel/ResourceManager.ts` to ensure the Platform Kernel maintains the sole authoritative view of system resources.

## 2. Capability Registry Duplication

**Description**: There are two separate implementations of a `CapabilityRegistry` tracking extensions and capabilities.
**Evidence**:
- [src/platform/capability/CapabilityRegistry.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/capability/CapabilityRegistry.ts) (Part of the capability subsystem, manages semantic versions and dependencies)
- [src/infrastructure/registry/capability-registry.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/infrastructure/registry/capability-registry.ts) (Standalone singleton, writes manifests to the file system)
**Impact**: High. The Platform Kernel and the SDKs may query different capability stores, resulting in split-brain behavior where an extension is recognized by one system but unknown to the other.
**Recommendation**: Merge `capability-registry.ts` into `CapabilityRegistry.ts` and ensure it is managed exclusively via the Platform Kernel's dependency injection container.

## 3. Command Registry Duplication

**Description**: Commands are registered into two independent singleton registries.
**Evidence**:
- [src/platform/console/CommandRegistry.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/console/CommandRegistry.ts) (Console/UI scoped command registry `ConsoleCommandRegistry`)
- [src/platform/commands/CommandRegistry.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/commands/CommandRegistry.ts) (Backend `CommandRegistryImpl`)
**Impact**: High. The UI command palette (`CommandPalette.tsx`) accesses the backend registry, while `ActionDispatcher` references the console registry. Commands registered in one will fail to dispatch in the other.
**Recommendation**: Unify under `src/platform/commands/CommandRegistry.ts` as the single authoritative source of truth for command metadata. The UI should dynamically fetch or subscribe to this backend registry rather than maintaining a parallel state.

## 4. Execution Dispatching Bypass

**Description**: `ConsoleActionDispatcher` intercepts execution paths but has a bypass where synthetic commands are injected without full policy/transaction coordination.
**Evidence**:
- [src/platform/console/ActionDispatcher.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/console/ActionDispatcher.ts) (Line 91: `dispatch(syntheticCommandId, ...)`)
**Impact**: Medium. Creates a duplicate execution routing path that bypasses governed execution logging and transaction coordination.
**Recommendation**: Remove synthetic command generation. All executions must map to a statically defined and verified command in the authoritative `CommandRegistry`.
