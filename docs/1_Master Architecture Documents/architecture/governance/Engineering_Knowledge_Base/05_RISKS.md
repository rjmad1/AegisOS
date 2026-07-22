# AegisOS Engineering Knowledge Base (EKB)
## 05_RISKS.md — Risk Register

This document tracks active platform risks, their impact, likelihood, trends, and mitigation plans.

---

### Active Risk Ledger

| ID | Description | Likelihood | Impact | Trend | Mitigation Plan |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **R-01** | **V8 Sandbox Escape:** Malicious extensions bypassing Node worker threads to access host filesystems. | Low | High | ➡️ Stable | Enforce container isolation (gVisor / Docker) for untrusted Tier 3 & Tier 4 packages. |
| **R-02** | **Graph Planning Hallucination:** Dynamic planning engine creating infinite execution loops or faulty DAG nodes. | Medium | Medium | ➡️ Stable | Implement strict validation checks on graph compilation and a maximum execution depth boundary. |
| **R-03** | **Process Crashes via Missing Dependencies:** Extension calls failing due to missing NPM/Pip packages on the host. | High | High | ➡️ Stable | Validate and run a dependency installer within the isolated worker workspace before activation. |
| **R-04** | **Latency Overhead in Worker Threads:** Performance drops caused by serialization over guest-host IPC bridges. | Medium | Low | ➡️ Stable | Cache state maps and batch IPC telemetry logs in-memory. |

---

### Resolved Risks
*(No risks have been resolved in this sprint cycle.)*
