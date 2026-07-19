# 04. Dashboard Architecture

Every dashboard in AegisOS serves a specific operational purpose and adheres to the rule: *No vanity metrics. Every widget must represent actionable platform state.*

## 1. Executive Dashboard
- **Purpose**: High-level platform health, aggregate qualification readiness, and certification compliance.
- **Widgets**: Platform Health Index (percentage), Global Alert Ticker, ERWC Compliance Badge, Resource Budget Burn Rate.
- **Refresh Strategy**: Aggregate 60-second polling or WebSocket push on critical state changes.

## 2. Platform Dashboard
- **Purpose**: Unified entry point for active operations.
- **Widgets**: Active Participants count, Running Workflows, Capability Utilization, PIAL Recommendations.
- **Refresh Strategy**: Real-time WebSocket connection to the PRM.

## 3. Architecture Dashboard (Explorer)
- **Purpose**: Topological mapping and digital twin monitoring.
- **Widgets**: Interactive D3.js/Mermaid node graph representing live capabilities, workflows, and participants.
- **Drill-downs**: Clicking a node routes to the specific Entity Detail page in Observability.

## 4. Certification & Qualification Dashboards
- **Purpose**: Evidence-driven release validation.
- **Widgets**: Release Manifest Checklists, Edge vs. Cloud readiness radars, Historical Regression trendlines.
- **Actions**: Trigger CI Validation Suite, Export Evidence Report.

## 5. Governance Dashboard
- **Purpose**: Constitutional Engine monitoring.
- **Widgets**: Architectural Budget gauges (Memory, Latency, Token Usage), Policy Violation Event Log, Security Boundary map.
