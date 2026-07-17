# Platform Lifecycle Governance — AegisOS API & Component Roadmap

| Field | Value |
|---|---|
| **Document ID** | PLG-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Platform Governance |
| **Owner** | Release Train Engineer |

---

## 1. Versioning Standards (SemVer 2.0.0)

AegisOS coordinates release versioning strictly using Semantic Versioning (`MAJOR.MINOR.PATCH`):
* **MAJOR**: Backward incompatible API alterations, schema breaking changes, or removal of deprecated components.
* **MINOR**: Addition of new backward-compatible capabilities, extension points, or new non-breaking APIs.
* **PATCH**: Backward-compatible bugfixes, security patches, self-healing updates, and performance tuning.

---

## 2. API Deprecation Schedule

To ensure client stability, all public, extension, and stable internal interfaces follow a formal deprecation schedule before deletion:

```
+------------------+       1 Minor Release       +------------------+       1 Major Release       +-----------------+
|   Active Stage   | --------------------------> | Deprecated Stage | --------------------------> |  Retired Stage  |
| - Fully supported|                             | - Warning logs   |                             | - Code deleted  |
| - Primary choice |                             | - Out of support |                             | - Returns error |
+------------------+                             +------------------+                             +-----------------+
```

### 2.1 Deprecation Phases
1. **Active**: Fully supported; the primary integration choice.
2. **Deprecated**: Interface remains functional but triggers developer warnings (console output, HTTP Headers `Warning: 199 - "Deprecated API"`). Outdated interfaces must remain deprecated for at least **one minor version** before removal.
3. **Retired**: The interface is deleted from the codebase. Calls return HTTP `410 Gone` or throw compile-time type errors.

---

## 3. Backward Compatibility Commitments

* **Stable REST APIs**: `/api/v1/` routes must remain compatible across all minor and patch versions. Breaking changes necessitate a route namespace increment (e.g., `/api/v2/`).
* **Extension Interface Contracts**: Methods on sandboxed global execution namespaces (e.g., `aegis.eventBus`) cannot modify their signature in minor releases. Extra optional properties can be appended to event payloads.
* **Database Migration Guarantees**: Database schema updates in minor versions must support backward compatibility (e.g., only nullable/default columns can be added). Destructive migrations (dropping tables, renaming fields) are deferred to major releases.

---

## 4. Feature Gating & Flags

To safely test new capabilities, features transition through three phases controlled by database configs or environment variables (`Aegis_FEATURES_...`):

| Phase | Target Users | Default State | SLA & Support | Breaking Changes |
|---|---|---|---|---|
| **Experimental**| Internal Developers | Disabled | No SLA; data loss possible | Frequent; subject to quick redesign |
| **Preview** | Beta Testers / Opt-in | Disabled | Support provided; bug fixes prioritized | Allowed with minor warning periods |
| **General Availability**| All Production Users | Enabled | Core Enterprise SLA; full support | Forbidden without deprecation cycle |

---

## 5. Long-Term Support (LTS) Policy

AegisOS designates specific minor versions as LTS releases:
* **Cadence**: Every 12 months.
* **Support Window**: LTS releases are supported for **24 months** (12 months Active Support for bug fixes/features + 12 months Maintenance Support for critical security CVE resolutions).
* **Upgrade Path**: Guaranteed upgrade scripts are maintained supporting direct transitions from `LTS N` to `LTS N+1`.
