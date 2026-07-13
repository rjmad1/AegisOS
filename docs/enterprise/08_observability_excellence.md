# Observability Excellence Framework

| Field | Value |
|---|---|
| **Document ID** | OEF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Telemetry Standard |
| **Owner** | Staff SRE |

---

## 1. Telemetry Architecture & OpenTelemetry

We standardize telemetry exports on the **OpenTelemetry (OTel)** framework. Local workstation nodes push traces, metrics, and logs to a central OTel Collector agent or local Prometheus/Jaeger endpoints.

```
 [Application Modules] & [Inference Service]
                      │ (OTel SDKs)
                      ▼
            [OTel Collector Agent]
            /         |          \
           ▼          ▼           ▼
      (Metrics)    (Traces)     (Logs)
     Prometheus     Jaeger    Elasticsearch
```

* **OTel Collector**: Resolves local hardware context, workstation IP, and container ID, appending these as resources attributes to every telemetry export.
* **Exporters**:
  * Prometheus: Pulls system metrics from `/metrics` endpoint.
  * OTLP HTTP/gRPC Traces Exporter: Streams spans to Jaeger/Zipkin.
  * OTLP Logs Exporter: Forwards JSON application logs to Elasticsearch/Fluentd.

---

## 2. Metrics Taxonomy

We implement three metrics classification models to monitor system state:

### 2.1 Golden Signals (System-Wide)
* **Latency**: Duration of API responses and model inferences (milliseconds).
* **Traffic**: Total active requests, event bus throughput, and concurrent web sessions.
* **Errors**: HTTP 5xx error rate, event DLQ inserts, and inference exception counts.
* **Saturation**: Memory consumption, CPU utilization, and SQLite write queue size.

### 2.2 RED Metrics (API Services)
For every microservice and API route:
* **Rate**: Request count per second (RPS).
* **Errors**: Number of failed requests (status >= 500).
* **Duration**: Execution duration histogram (p50, p90, p99).

### 2.3 USE Metrics (Resource Saturation)
For system hardware components (CPU, memory, disk, network, GPU):
* **Utilization**: Percentage of active resource busy time (e.g. GPU Compute Util = 78%).
* **Saturation**: Work queued waiting for the resource (e.g. CPU run queue length).
* **Errors**: Hardware error counts (e.g., CUDA out-of-memory errors).

---

## 3. Specialized Domain Metrics

To govern AI and workflow operations, the platform tracks specialized metrics:

| Metric Class | Metric Name | Unit | Target | Description |
|---|---|---|---|---|
| **GPU / Hardware** | `gpu.vram.utilization` | % | < 85% | Percentage of GPU VRAM allocated. |
| **GPU / Hardware** | `gpu.temperature` | °C | < 80°C | Temperature of CUDA cores. |
| **Model** | `llm.latency.ttft` | ms | < 150ms | Latency to first token generated. |
| **Model** | `llm.tokens.per_second` | tokens/s | > 15 t/s | Rate of token generation. |
| **Model** | `llm.fallback.count` | counts | 0 | Count of handovers to cloud fallback endpoints. |
| **Workflow** | `workflow.step.failure` | counts | 0 | Failures per workflow step execution. |
| **Workflow** | `workflow.queue.delay` | ms | < 500ms | Delay between job queue and execution start. |
| **Prompt** | `prompt.tokens.consumed` | tokens | N/A | Total prompt context tokens ingested. |
| **Business / Cost** | `ai.cost.estimated` | USD ($) | N/A | Estimated USD spent on cloud API fallback routes. |
| **Knowledge** | `knowledge.graph.sync.lag` | ms | < 1000ms | Time delay between file writes and graph updates. |

---

## 4. Structured Logging Standards

All application components must output logs in structured JSON formats. String logs (e.g. `console.log("Starting service")`) are forbidden in production.

### Standard JSON Log Layout
```json
{
  "timestamp": "2026-07-13T10:25:28.123Z",
  "level": "ERROR",
  "message": "Failed to resolve Ollama model inference connection.",
  "service": "ai-runtime-service",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "error": {
    "code": "ECONNREFUSED",
    "message": "connect ECONNREFUSED 127.0.0.1:11434",
    "stack": "Error: connect ECONNREFUSED ... at TCPConnectWrap.afterConnect"
  },
  "metadata": {
    "model": "smollm:135m",
    "port": 11434,
    "retryCount": 2
  }
}
```

---

## 5. Tracing Strategy

* **Context Propagation**: We enforce the W3C Trace Context standard. Distributed calls across API proxies, workflow workers, and local CLI tools must pass a standard `traceparent` header.
* **Span Correlation**: Every request must carry a unique `correlationId` to track events traversing the client-side `EventBus` and the server-side `hardenedEventBus`.
* **Span Annotations**: Database queries, RAG search checks, and LLM API calls must be wrapped in separate spans containing resource attributes (e.g. model name, token sizes, db queries).

---

## 6. Alert Suppression & Suppression Rules

To prevent alert fatigue:
* **Deduplication**: Suppress identical alerts within a 15-minute window.
* **Dependency Suppression**: If `Ollama Service Down` alert is active, suppress downstream `Inference Latency High` or `Workflow Step Failure` alerts.
* **Flapping Protection**: An alert must trigger only if a metric exceeds the threshold for 3 consecutive checks, and resolve only after returning to normal limits for 5 consecutive checks.
