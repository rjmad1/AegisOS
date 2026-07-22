# Production Readiness Scorecard

## 1. Objective
Extend the static Platform Readiness Index into a dynamic, continuously computed Production Readiness Score (PRS) that trends over time.

## 2. Score Composition (100 Points Total)
The PRS is calculated based on objective telemetry across the following vectors:

1. **Reliability (15 pts):** Error Budgets intact, MTBF > 720h.
2. **Performance (10 pts):** P95 Latency within defined baselines.
3. **Security (15 pts):** Zero High/Critical CVEs, active SBOM tracking.
4. **Deployments (10 pts):** `verify-infra` pass rates, successful staging rollouts.
5. **Qualification (10 pts):** Evidence chains successfully verified by the PQF.
6. **Marketplace (10 pts):** Package certification rates, signature validity.
7. **Documentation (10 pts):** Zero broken links, 100% automated validation coverage.
8. **SDKs (10 pts):** SDK sync success rate against OpenAPI contracts.
9. **Operations (5 pts):** Runbook execution success rates.
10. **Governance (5 pts):** GCM compliance and approved CER exceptions.

## 3. Tracking and Visualization
- The PRS will be emitted as an OTel Gauge metric (`aegis.production.readiness.score`).
- Visualized in the core Administration Dashboard.
- Drops below the threshold (e.g., 90/100) will automatically block GA releases.
