# 2. Consolidated Architecture Knowledge Graph

## Core Nodes & Principles
- **Platform Kernel**: Enforces layer purity and isolation.
- **Durable Execution Platform (DEP)**: Ensures execution resilience and fault tolerance.
- **Transaction Coordinator**: The single execution pipeline to process durable commands.
- **Policy Engine**: Centralized validation and authorization entity.
- **Command Registry**: The singular dictionary of executable actions.
- **Model Runtime**: Pluggable backend for AI operations supporting both local (Ollama) and cloud (LiteLLM) providers via a unified interface.

## Extensibility Nodes
- **Agentic Swarm**: Orchestrated via `SpawnAgentSwarmCommand` utilizing the DEP.
- **Multi-Modal Engine**: Executed via `ProcessMultiModalTelemetryCommand` over vision and audio.
- **Thin Edge**: Ingestion mechanisms (e.g., `IngestMeetingCommand`) bound to the central Policy Engine.

## Dependency Rules
1. No architectural rewrites of core components permitted.
2. All database writes flow through repositories via the DEP.
3. No bypassing the Command Registry.
