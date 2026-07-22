# Prioritized Remediation Roadmap

**Date**: 2026-07-21
**Objective**: Path to full Architecture Certification

## Phase 1: Governance & Execution Integrity (Immediate)
1. **Remove `ActionDispatcher` Legacy Bypass**
   - **Action**: Refactor `src/platform/console/ActionDispatcher.ts`. Remove synthetic command generation.
   - **Reason**: Closes the highest security and governance risk.
2. **Consolidate Registries**
   - **Action**: Merge the parallel `CommandRegistry`, `CapabilityRegistry`, and `ResourceManager` singletons.
   - **Reason**: Establishes the Single Source of Truth required by the Constitution.

## Phase 2: Metadata & UI Framework Compliance (Next Minor Release)
1. **Refactor Console Framework Layers**
   - **Action**: Modify `ConsoleShell.tsx` to strictly read from `MetadataEngine` domains rather than hardcoding route conditions.
   - **Reason**: Restores the Semantic UI Composition Model.
2. **Implement Adaptive Experience Engine**
   - **Action**: Inject an Intent evaluation layer before the Presentation layer.
   - **Reason**: Fulfills the Console Kernel architectural baseline.

## Phase 3: Extension Security (Next Major Release)
1. **CER Sandboxing**
   - **Action**: Implement Web Worker / Shadow DOM isolation for `CEREngine`.
   - **Reason**: Prevents extensions from crashing the host shell.
2. **Dynamic Schema Loading**
   - **Action**: Allow `MetadataEngine` to load schemas dynamically rather than relying on `boot.ts`.

## Phase 4: AI & Distributed Governance (Future)
1. **Integrate AI Copilot**
   - **Action**: Connect `AICopilotPanel.tsx` to the `CommandRegistry` and LLM runtime.
   - **Reason**: Moves AI from a UI scaffold to a governed participant.
2. **Durable Execution & Evidence**
   - **Action**: Connect the `ActionDispatcher` to the scaffolded Durable Execution Platform backend and PQF evidence generators.
