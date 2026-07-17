# AegisOS Mobile â€” Technical Architecture Blueprint

Welcome to the technical architecture blueprint for the AegisOS Mobile Application. This suite of documents defines the production-grade mobile app architecture serving as the secure companion for the AegisOS local-first AI platform.

These documents establish the technical implementation details for all Sprints starting from Sprint Zero.

---

## Blueprint Index

### 1. [Executive Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/00_EXECUTIVE_ARCHITECTURE.md)
*   System Context (C4 Level 1)
*   Communication Flow Matrix
*   Network Security Zones
*   Deployment Topology
*   Architecture Decision Records (ADRs) Summary

### 2. [Mobile Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/01_MOBILE_ARCHITECTURE.md)
*   Framework Selection (Flutter vs React Native)
*   Project Folder Structure
*   Package Organization Strategy
*   Dependency Injection (Riverpod)
*   Declarative Navigation (`go_router`)
*   Background Workers (WorkManager & BGTaskScheduler)

### 3. [Layered Clean Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/02_LAYERED_ARCHITECTURE.md)
*   Presentation, Application, Domain, Infrastructure, Platform, Shared, Utilities, and Core Layers
*   Allowed and Forbidden Dependencies Matrix
*   Static Import Linter Enforcement Rules

### 4. [Feature Modules Hierarchy](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/archive/03_FEATURE_MODULES.md)
*   21 Feature Module Definitions (Auth, Dashboard, Mission Control, Chat, Approvals, Agents, Models, etc.)
*   Module Responsibilities, Interfaces, Dependencies, and Extension Points
*   Module Dependency Graph and Circular Dependency Prevention

### 5. [Backend API Gateway Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/04_BACKEND_API_ARCHITECTURE.md)
*   Next.js Mobile-Optimized `/api/v2/` Namespace Gateway Design
*   REST Endpoint Controllers, Services, and Repositories
*   WebSocket Hub for Telemetry (5Hz) and Agent Logs
*   Server-Sent Events (SSE) for Token Streaming
*   Rate Limiting, JWT Token Lifecycle, and API Versioning

### 6. [Synchronization Strategy](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/05_SYNCHRONIZATION.md)
*   Delta Sync Engine and Timestamp Anchoring
*   Conflict Resolution Policies (LWW, Vector Clocks, Server-Authoritative, 3-Way Merge)
*   Offline Actions Queue Schema & Execution Lifecycle
*   Exponential Backoff Retry Strategy & sliding cache eviction

### 7. [Local Database Design](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/06_LOCAL_DATABASE.md)
*   Drift ORM with SQLCipher (AES-256-GCM Encryption at Rest)
*   Full Entity-Relationship (ER) Schema Layout
*   Performance Optimization (VACUUM, Batch inserts)
*   Schema Migration System (onCreate / onUpgrade)

### 8. [Security & Cryptography Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/07_SECURITY_ARCHITECTURE.md)
*   Zero-Trust Device Pairing QR Flow
*   Mutual TLS (mTLS) with Host CA Pinning
*   Secure Enclave & Keystore Cryptographic Binding (ECDSA signatures)
*   Biometric Gates, Token Expiry, and Remote Wipe Protocol

### 9. [Communication & Design System Foundation](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/08_COMMUNICATION_AND_DESIGN_SYSTEM.md)
*   HTTP Client, SSE, and WebSocket Deflate Compression
*   Typography Scales, Spacing Tokens, and M3 Colors (Slate-Indigo Palette)
*   WCAG 2.2 AAA Accessibility Targets (Screen Readers, Dynamic Type, Contrast)
*   Adaptive Grids & Hinge-aware Foldable Grid Support

### 10. [State, Error, Logging & Observability](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/09_STATE_LOGGING_OBSERVABILITY.md)
*   Riverpod Unidirectional State Flow
*   Zero-Crash Typed Exception Hierarchy
*   Secure Logger with PII/JWT Redaction Interceptors
*   OpenTelemetry Metrics, Traces, and SRE Dashboards

### 11. [Testing, Documentation, ADR & Sprint Zero Plan](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/mobile/architecture/10_TESTING_DOCS_ADR_SPRINT0.md)
*   Testing Pyramids (Unit, Widget, Golden, E2E, Security)
*   Architecture Decision Records Registry (ADR-MOB-001 through ADR-MOB-005)
*   Sprint Zero Execution Tasks, Deliverables, and Risk Management

