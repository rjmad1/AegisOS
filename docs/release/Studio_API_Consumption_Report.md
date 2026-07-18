# AegisOS Studio API Consumption Report

## Overview
AegisOS Studio is a client-side interface that interacts with the AegisOS Platform solely through public REST endpoints. This report audits the API consumption pattern of the Studio Beta.

---

## API Endpoints Drills

| Endpoint | Method | Consumer Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/v1/briefing` | `GET` | Dashboard Briefing card | Aggregates system summaries |
| `/api/v1/missions` | `GET`/`POST` | Dashboard / Mission Center | Lists and launches missions |
| `/api/v1/missions/[id]` | `GET`/`POST` | Replay Console | Fetches logs and triggers runs |
| `/api/v1/executions` | `GET` | Executions Explorer | Lists background agent tasks |
| `/api/v1/executions/[id]` | `GET` | Replay Player / Viewer | Telemetry drill-down |
| `/api/v1/oil/timeline` | `GET` | Timeline Feed | Chronological events feed |
| `/api/v1/oil/recommendations` | `GET`/`POST` | Chief of Staff | SRE remediation actions |
| `/api/v1/workflows/approvals` | `GET`/`POST` | Approvals card | Decisions audit logs |
| `/api/v1/extensions` | `GET`/`POST` | Extensions status | Ingests updates and updates |

---

## Architecture Validation
- **No Direct Database Queries**: All queries pass through Next.js dynamic endpoints.
- **Payload compliance**: Payloads conform strictly to the Universal Execution Contract (UEC).
