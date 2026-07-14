# Observability Guide

## Overview

AegisOS provides full observability through the three pillars: **metrics**, **traces**, and **logs**.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Application │────▶│ OTel Collector   │────▶│ Prometheus  │ (metrics)
│ (Next.js)   │     │ (port 4317/4318) │────▶│ Loki        │ (logs)
└─────────────┘     └──────────────────┘────▶│ Jaeger      │ (traces)
                                              └──────┬──────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  Grafana    │ (dashboards)
                                              │  (port 3001)│
                                              └─────────────┘
```

## Metrics

### Platform Metrics
| Metric | Type | Description |
|--------|------|-------------|
| `api_requests_total` | Counter | Total API requests by method and path |
| `api_errors_total` | Counter | Total API errors by method, path, and status |
| `api_latency_ms` | Gauge | Request latency in milliseconds |

### Access
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

## Traces

Every API request generates a distributed trace with:
- Trace ID propagation via W3C `traceparent` header
- Span attributes: `http.method`, `http.target`, `client.ip`, `http.status_code`
- Error spans include `errorMessage`

### Access
- **Jaeger UI**: http://localhost:16686

## Logs

### Structured Logging
Application logs include:
- Component prefix (e.g., `[Security Proxy]`, `[SessionService]`)
- Relevant context (IP address, user ID, operation)

### Log Aggregation
- **Loki**: http://localhost:3100
- Query via Grafana using LogQL

## Configuration

### OpenTelemetry Collector
Configuration: `configs/otel-collector-config.yaml`

### Prometheus
Configuration: `configs/prometheus.yml`

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://otel-collector:4318` | OTel collector endpoint |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js built-in telemetry |

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Application health check |
| `/ready` | Readiness probe (dependencies available) |
| `/live` | Liveness probe (process alive) |
| `/status` | Detailed system status |
