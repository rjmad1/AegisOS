# Conversa Master Reference

This document serves as the **central authority** for understanding the planning, implementation, and future evolution of the Conversa Cognitive Workspace.

---

## 1. Conversa Overview

**[Conversa](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/conversa_repo/README.md)** is the enterprise cognitive meeting and living workspace platform running on top of AegisOS. It ingests meeting transcripts/audio, runs crew agent debate loops, and publishes 3-hash cryptographically validated meeting minutes.

---

## 2. Hierarchical Architecture Plane Map

Conversa aligns with a strict 7-layer architecture stack frozen under the [Engineering Constitution](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/ENGINEERING_CONSTITUTION.md):

| Layer | Conversa Workspace Component |
| :--- | :--- |
| **Layer 6: Executive / Console** | Spatial Next.js Shell, Command Surface, Mobile Workspace layout |
| **Layer 5: Control / Policy** | Capability-Aware Routers, speaker claim validators, consensus generators |
| **Layer 4: Orchestration** | Managed Meeting Agency Crew, Event blackboards, Hono/Convex API handlers |
| **Layer 3: Capability** | Linkup Web Grounding, Semantic Publisher, Format-specific serializers |
| **Layer 2: Runtime** | Local LLM inference swappers, audio-to-text diarization pipelines |
| **Layer 1: Infrastructure** | Drift encrypted DB, SQLCipher, Convex local instances |
| **Layer 0: Hardware** | CUDA hardware, physical device key storages |

---

## 3. Subsystem Implementation Log (Verified Artifacts)

### 3.1 Conversa Enterprise Workspace
*   **Capability-Aware Router**: Dynamically matches extraction tasks (Action Items, Decisions, Risks) to the most cost-effective and compliant model.
*   **Debate Coordinator & Validation Engine**: Runs multi-agent debate loops to verify speaker claims, flags contradictions, and calculates cognitive confidence scores.
*   **Semantic Publisher**: Converts validated knowledge packages into executive summaries, engineering minutes, and stakeholder briefs.
*   **3-Hash Lineage Publisher**: Creates a lineage verification structure using semantic, content, and provenance hashes.
