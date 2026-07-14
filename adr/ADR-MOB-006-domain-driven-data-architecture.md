# ADR-MOB-006: Domain-Driven Data & Encryption Architecture

*   **Status**: Proposed
*   **Decided by**: Mobile Architecture Team
*   **Date**: 2026-07-13

---

## Context & Problem Statement
AegisOS Mobile operates as a secure companion in a local-first environment. Key challenges include:
1.  Ensuring offline operational availability for conversations, metrics, and actions queue.
2.  Protecting highly sensitive LLM context and system commands cached on the mobile device.
3.  Resolving conflicts when changes are applied concurrently on the workstation host and the companion.

## Decision
We select **Drift (reactive SQLite binding)** with **SQLCipher** for database storage, structured as a clean Domain-Driven Design layer.

```
[Presentation: Widgets] -> [Application: Use Cases] -> [Domain: Repo Contracts]
                                                            ^
                                                            | (Implements)
                                                    [Infrastructure: Drift DB]
```

### Key Technical Aspects
1.  **Encrypted-At-Rest Storage**: SQLCipher with 256-bit AES-GCM. The encryption key is derived on-device from a salt stored in the Keychain/EncryptedSharedPreferences and a private key derived inside the hardware Secure Enclave.
2.  **Unidirectional Database Binding**: Drift handles typed reactive tables. Feature packages listen to reactive streams (`Stream<List<Message>>`).
3.  **Synchronization Layering**: The Drift database maintains an `offline_actions_queue` table. Writes that fail due to connection loss are queued as commands. They are pushed in order (FIFO) upon connection restoration.

## Alternatives Considered

| Option | Pros | Cons | Verdict |
| :--- | :--- | :--- | :--- |
| **Hive / Isar** | Super fast, NoSQL key-value format, easy Flutter integrations. | Harder to run complex SQL joins for analytics; weak mTLS / certificate mappings. | Rejected |
| **Vanilla SQLite** | Native, no package dependencies. | Boilerplate parsing code; no reactive stream binders out-of-the-box. | Rejected |
| **Drift + SQLCipher** | Strong types, reactive, hardware-key encrypted, relational schema joins. | Requires code generation (`build_runner`); larger binary size (~10MB overhead). | **Selected** |

## Consequences
*   **Code Generation Overhead**: Introducing `build_runner` requires run commands before building.
*   **Binary Size**: The inclusion of SQLCipher native binaries increases package size on both Android and iOS.
*   **Zero-Knowledge Recovery**: If biometrics or keys are wiped from the device Secure Enclave, data cannot be recovered. Since the host holds the master data, we mitigate this by prompting a full resync from the host workstation after re-pairing.
