# Technical Debt Assessment

## Overview
This document assesses the technical debt incurred during the evolution of AegisOS prior to the Platform-Centric shift, and identifies the necessary refactoring to align the codebase with the new OS Constitution.

## 1. Subsystem Orchestration (High Debt)
- **Current State**: Subsystems frequently instantiate other subsystems directly, bypassing the `CompositionRoot` or relying on imperative logic.
- **Impact**: Makes lifecycle management and failure recovery impossible for the Platform Kernel.
- **Remediation**: Extract all instantiation logic. Define declarative module manifests for the Platform Service Registry. The Kernel State Machine must take over orchestration.

## 2. Hardcoded Business Rules (High Debt)
- **Current State**: Security rules, sandbox selections, and trust thresholds are hardcoded in TypeScript classes.
- **Impact**: Violates the Policy Governance Fabric principle. It cannot be audited or hot-reloaded.
- **Remediation**: Migrate imperative logic to the declarative Policy Fabric. Implement PEPs (Policy Enforcement Points) at subsystem boundaries.

## 3. Resource Allocation (Medium Debt)
- **Current State**: Background workers and LLM orchestrators allocate threads, GPU memory, and network connections directly.
- **Impact**: Leads to resource starvation, OOMs, and violates the Resource Fabric negotiation principle.
- **Remediation**: Rewrite resource-heavy subsystems to submit `ResourceIntent` requests. Implement asynchronous wait patterns for lease fulfillment.

## 4. Parameter Drilling & Context Loss (Medium Debt)
- **Current State**: Correlation IDs and Tenant IDs are passed manually through function signatures. Async context is frequently lost in promise chains.
- **Impact**: Obscures telemetry and breaks multi-tenant isolation guarantees.
- **Remediation**: Standardize on the `IExecutionContextProvider`. Remove identity/tenant parameters from internal function signatures and rely on the globally propagated context.

## Summary
The transition to Platform Governance requires a significant upfront refactoring effort. The primary objective is **deletion**: removing imperative orchestration, resource management, and policy evaluation from the subsystems, and replacing it with declarative registration and negotiation.
