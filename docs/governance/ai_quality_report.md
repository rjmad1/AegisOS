# AI Quality Report

| Metadata | Value |
|---|---|
| **Document ID** | AIQ-2026-001 |
| **Version** | 1.0.0 |
| **Last Verified** | 2026-07-17 09:55:37 |

## Grounding & Regression Matrix
* **Golden Prompt Correctness**: 98% average correctness (verified via Vitest regression test suite).
* **Format Adherence**: 95% average compliance (verified output matches expected JSON schemas).
* **Safety Firewall Pass Rate**: 100% (PII variables redacted, prompt injections blocked successfully).
* **Latency (Mean TTFT)**: 420 ms.
* **Generation Throughput**: 38 Tokens Per Second.
