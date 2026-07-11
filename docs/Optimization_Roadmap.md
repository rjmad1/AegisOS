# Optimization Roadmap

This roadmap outlines structured recommendations for enhancing the performance, observability, and recoverability of the AI Workstation platform.

## 1. Observability and Monitoring

### A. Grafana and Prometheus Latency Metrics
* **Action**: Configure Prometheus to scrape LiteLLM's `/metrics` endpoint on port 4000. Deconstruct latency stats and VRAM usage on a local Grafana dashboard.
* **Benefit**: Real-time observability of inference performance and model routing distribution.

### B. OpenTelemetry Tracing via Arize Phoenix
* **Action**: Integrate Phoenix (port 6006) as an OpenTelemetry tracing sink for OpenClaw.
* **Benefit**: Visual debugging of prompt flows, similarity search scores, and MCP latency timelines.

---

## 2. Resource Fitting and Inference Performance

### A. Quantized KV Cache in Ollama
* **Action**: Enable quantized 8-bit (`q8_0`) KV caches in Ollama context configurations.
* **Benefit**: Reduces VRAM consumption by up to 30%, keeping large models like `deepseek-r1:32b` resident in the RTX 5080 VRAM without spilling layers to slow CPU memory.

### B. Proxy Gated Queue Control
* **Action**: Hard-code a queue limit of 2 in the LiteLLM proxy settings to restrict concurrent model requests.
* **Benefit**: Prevents GPU memory thrashing and thread lock-ups during concurrent developer queries.

---

## 3. Runtime Virtualization

### A. Isolated Portable Environments
* **Action**: Move runtime setups to local virtual environments (Node packages locked to local directory node modules, and Python runtimes isolated under `runtime/python/` via `uv venv`).
* **Benefit**: Guarantees zero version conflicts and enables true drive-agnostic, offline portability.
