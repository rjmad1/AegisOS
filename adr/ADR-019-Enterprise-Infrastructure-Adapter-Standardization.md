# ADR-019: Enterprise Infrastructure Adapter Standardization & Decoupling

* **Status**: Accepted
* **Date**: 2026-07-24
* **Authors**: Principal Software Architect & Staff Platform Engineer
* **Decider**: Architecture Review Board

---

## Context and Problem Statement

Direct invocation of third-party SDKs (such as `@aws-sdk/client-s3`, `@azure/storage-blob`, `@google-cloud/storage`, `ioredis`, and un-wrappered native `fetch()` calls) exposes core AegisOS domain logic to external vendor contracts, breaking changes, and non-deterministic error behavior.

To ensure AegisOS remains local-first, highly maintainable, testable, and upgrade-friendly, third-party infrastructure capabilities must be isolated behind internal Anti-Corruption Layer (ACL) interfaces.

---

## Decision Drivers

* **Maintainability & Replaceability**: Infrastructure providers must be swappable without modifying core business services.
* **Testability**: Unit and integration tests require fast, predictable in-memory test double implementations without requiring live cloud endpoints.
* **Security & Resilience**: HTTP requests and secret access must have built-in timeout, retry backoff, and signal cancellation controls.

---

## Decision

AegisOS standardizes on Ports-and-Adapters (Hexagonal Architecture) for all third-party integrations:

1. **Contracts (Ports)**: All infrastructure capabilities are exposed via strongly typed interfaces placed in `src/infrastructure/contracts/` (e.g., `IHttpClient`, `ISecureVaultProvider`, `IArtifactProviderAdapter`, `ICacheProvider`).
2. **Adapters**: Concrete implementations reside in `src/infrastructure/adapters/` (e.g., `FetchHttpClientAdapter`, `EnvironmentVaultAdapter`, `LocalArtifactStorageProvider`).
3. **Factories**: Direct instantiation of concrete third-party SDKs in domain services is strictly prohibited. Services MUST obtain adapters via `HttpClientFactory` or the `ServiceRegistry`.

---

## Consequences

### Positive
* **Decoupled Architecture**: Domain services depend strictly on `IHttpClient` and `ISecureVaultProvider` interfaces rather than global state or raw third-party SDKs.
* **Zero Breaking Risk on Upgrades**: Third-party package major updates (e.g., AWS SDK v4 or Redis v6) are handled entirely inside adapter files.
* **100% Mockable**: Test suites can inject in-memory adapters without external network calls.

### Negative / Trade-offs
* Minor indirection overhead when tracing infrastructure execution paths.
