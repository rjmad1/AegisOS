# Operational Telemetry Validation — AegisOS

| Field | Value |
|---|---|
| **Document ID** | OTV-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Telemetry Audit |
| **Status** | Approved |
| **Owner** | SRE Lead & Observability Architect |

---

## 1. Telemetry Architecture & Data Sources

AegisOS aggregates data across three operational layers: system state (PlatformStateEngine), policies (PolicyEngine), and engineering debt (EOC). These metrics are consolidated into digital twin states, which are consumed by **Product Intelligence**, **Mission Control**, and the **Platform Transformation Office (PTO)**.

Telemetry is divided into three distinct classes to ensure data integrity and transparency.

---

## 2. Telemetry Classification Catalog

### 2.1 Measured Metrics (MEASURED)
Measured metrics are compiled via direct queries of host operating system configurations or database states:

* **Active Paired Devices**: Queried via `prisma.mobileDevice.count()` from the SQLite/PostgreSQL registry.
* **Database Sizing**: Calculated via Node `fs.statSync()` on the local SQLite file (`dev.db`), or retrieved via PostgreSQL database volume statistics.
* **TCP Socket Bindings**: Verified by establishing ephemeral TCP connections on local ports (`11434`, `4000`, `18789`).
* **Active User Sessions**: Queried via `prisma.session.count()`.
* **Code Dependency Count**: Extracted from parsing package.json dependency listings.
* **High-Risk Command Count**: Evaluated using `prisma.command.count()`.

### 2.2 Inferred Metrics (INFERRED)
Inferred metrics are derived mathematically using formulaic combinations of measured telemetry parameters:

* **Platform Health Index**: Calculated by averaging the workflow success rate, active ports status, and policy evaluation scores.
* **Feature Adoption Rate**: Determined by evaluating the ratio of active database pairings and execution counts.
* **Financial Savings**: Calculated by mapping processed LLM prompt/completion tokens against equivalent proprietary OpenAI API pricing models ($2.50/M prompt, $10.00/M completion).
* **Maturity Scores**: Evaluated from overall platform validation failures and compliance checklists.

### 2.3 Simulated Metrics (SIMULATED)
Simulated metrics are placeholder/fallback data points utilized when hardware engines or services are offline:

* **Biometric Lock Validation Uptime**: Set to `100%` baseline due to lack of direct secure enclave telemetry access on workstations.
* **Average Inference TPS**: Defaults to a fallback of `38 tokens/s` if Ollama's local service is unreachable or inactive during state checks.
* **Average Time-to-First-Token (TTFT)**: Defaults to a baseline of `420ms` if the OpenTelemetry metrics collector has not recorded recent inference latencies.

---

## 3. UI Display & Verification

To verify that operators can distinguish between these telemetry classes, the Mission Control frontend (`src/app/(console)/mission-control/page.tsx`) renders corresponding color-coded badges next to each metric:

* **Measured**: Rendered as a Green `[MEASURED]` Badge.
* **Inferred**: Rendered as a Blue `[INFERRED]` Badge.
* **Simulated**: Rendered as an Amber `[SIMULATED]` Badge.

This ensures full operational transparency for audits and readiness evaluations.
