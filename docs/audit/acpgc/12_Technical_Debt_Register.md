# Technical Debt Register

**Date**: 2026-07-21
**Scope**: AegisOS Core Architecture

This register classifies technical debt found during the ACPGC audit, prioritized for remediation.

## 1. Execution Debt (Priority: Critical)
- **Description**: The `ActionDispatcher` implements a synthetic command generation bypass for legacy `api_trigger` components. 
- **Root Cause**: Incomplete migration from RC-4 direct API patterns to RC-6 Command/DEP patterns.
- **Impact**: Breaks Governed Execution, bypassing policy and evidence generation.
- **Remediation**: Migrate all UI components to pass specific `commandId`s rather than arbitrary API endpoints. Remove synthetic generation logic.

## 2. Architectural Debt (Priority: High)
- **Description**: Duplicated registries (Command, Capability, Resource).
- **Root Cause**: Concurrent development streams without merging into the core DI container.
- **Impact**: Split-brain configurations, unreliable UI states, and memory bloat.
- **Remediation**: Delete duplicate files and consolidate all references to use the `src/platform/kernel/` or `src/platform/commands/` singletons managed by the `ServiceRegistry`.

## 3. Framework Debt (Priority: Medium)
- **Description**: `MetadataEngine` relies on static imports in `boot.ts`.
- **Root Cause**: Early scaffold of the declarative UI system.
- **Impact**: Cannot dynamically load new domain schemas at runtime from external providers.
- **Remediation**: Refactor `MetadataEngine` to load schemas from a local SQLite or file-based store, integrated with the `ExtensionRuntimeService`.

## 4. UX / Extension Debt (Priority: High)
- **Description**: `CapabilityExtensionRuntime` lacks sandbox isolation.
- **Root Cause**: React context limits strict sandboxing without iframes.
- **Impact**: Extensions run with full platform privileges, posing a security risk.
- **Remediation**: Implement a Web Worker or Shadow DOM membrane for UI extensions.
