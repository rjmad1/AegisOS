# AegisOS Knowledge Base: 15_DATA_MODEL.md

## Core Entities & Schemas

### 1. HardenedEvent Schema
* `id`: `string` (UUID)
* `name`: `string` (Event name, e.g. `AutonomicHealthReport`, `HardwareTelemetryReport`)
* `timestamp`: `string` (ISO 8601)
* `source`: `string` (Architectural plane or service name)
* `version`: `string` (e.g. `v1`)
* `priority`: `"low" | "medium" | "high" | "critical"`
* `securityClassification`: `"public" | "internal" | "restricted"`
* `retentionPolicy`: `"temp" | "session" | "archive"`
* `correlationId`: `string`
* `traceId`: `string`
* `payload`: `any`

### 2. MonitoredService Entity
* `name`: `string`
* `endpoint`: `string`
* `type`: `"http" | "tcp"`
* `expectedPort`: `number`
* `status`: `"healthy" | "degraded" | "unhealthy" | "recovering"`
* `consecutiveFailures`: `number`
* `lastCheckedIso`: `string`
* `lastRecoveredIso`: `string`

### 3. TelemetrySample Entity
* `timestampMs`: `number`
* `vramUsedBytes`: `number`
* `vramTotalBytes`: `number`
* `usageRatio`: `number`
