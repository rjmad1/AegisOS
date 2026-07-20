# Platform Handbook

| Metadata | Value |
|---|---|
| **Document ID** | PH-2026-001 |
| **Version** | 1.2.0 (Active) |
| **Last Synced** | 2026-07-20 05:40:00 |
| **Classification** | Public — Registry & Component Index |
| **Authority** | Platform Operations Board |

This handbook indexes and describes the reusable services, models, platform registries, and kernel services integrated into the AegisOS Workstation.

---

## 1. System Services & Port Bindings

The core infrastructure operates using seven interconnected service boundaries managed via NSSM (Non-Sucking Service Manager) or Docker Compose, running under elevated loopback interfaces:

| Service | Executable / Entrypoint | Port | Role |
|---|---|---|---|
| **Ollama** | `C:\Program Files\Ollama\ollama.exe serve` | 11434 | Local GGUF model host |
| **LiteLLMService** | `C:\ProgramData\AI\bin\litellm.exe` | 4000 | Model routing proxy & load balancer |
| **AegisOSService** | `src/platform/kernel/boot.ts` | 18789 | Autonomic OS Kernel / ECP Gateway / MCP Host |
| **Console UI** | `npm run dev` | 3000 | Next.js Console administration dashboard |
| **OmniRoute** | `omniroute/server/index.js` | 20128 | Performance monitoring service |
| **Open-WebUI** | Docker Image: `ghcr.io/open-webui/open-webui:main` | 8090 | Thin-client general chat interface |
| **OTel Collector** | `configs/otel-collector-config.yaml` | 4317 / 4318| OpenTelemetry Collector |

---

## 2. Models Inventory

AegisOS is configured to utilize the following GGUF, VRAM-optimized models registered in [ModelManifest.json](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/ModelManifest.json):

| Model ID | Size | parameters | Alias | Role |
|---|---|---|---|---|
| `gemma4:latest` | 9.6 GB | ~9B | `gemma` | Primary chat and reasoning engine |
| `gemma2:9b` | 9.6 GB | 9B | `chat` | Lightweight chat fallback |
| `gemma4:26b` | 17.0 GB | 26B | `none` | Intermediate reasoning (idle) |
| `gemma4:31b` | 19.0 GB | 31B | `gemma31` | Large reasoning engine |
| `qwen2.5:14b` | 9.3 GB | 14B | `qwen` | High-performance text and coding |
| `qwen3:14b` | 9.3 GB | 14B | `planner` | Planning and task decomposition |
| `qwen3:30b` | 18.0 GB | 30B | `none` | Large reasoning engine (idle) |
| `qwen3.6:27b` | 17.0 GB | 27B | `vision` | Multimodal vision model |
| `deepseek-r1:32b` | 19.0 GB | 32B | `deepseek` | Deep reasoning and code review |
| `gpt-oss:20b` | 13.0 GB | 20B | `gptoss` | Open-source coding model |
| `all-minilm:latest` | 45 MB | embedding | `embeddings`| Semantic search embeddings |
| `smollm:135m` | 91 MB | 135M | `smollm` | Ultra-lightweight terminal fallback |

---

## 3. Platform Kernel Services (PECS, PRM, PPS, PAOS)

The Platform Kernel ([PlatformKernel.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/kernel/PlatformKernel.ts)) acts as the central orchestrator and dependency injection container. At boot time, it registers four vital built-in Kernel Services in the Service Registry:

### PECS: Platform Execution Context Service
- **Token**: `PECS`
- **Class**: `ExecutionContextService`
- **Role**: Manages the immutable execution contexts. Gathers and correlates transaction traces, active user sessions, token payloads, and correlation IDs to maintain full operational traceability.

### PRM: Platform Resource Manager
- **Token**: `PRM`
- **Class**: `ResourceManager`
- **Role**: Governs local system resource limits. Monitors CUDA thresholds, host VRAM allocations, active process mappings, and schedules model swap commands during idle slots.

### PPS: Platform Policy Service
- **Token**: `PPS`
- **Class**: `PolicyService`
- **Role**: Enforces declarative system policies. Inspects incoming command requests and payload arguments against authorization permissions, IP boundaries, and rate limits.

### PAOS: Platform Autonomic Optimization Service
- **Token**: `PAOS`
- **Class**: `OptimizationService`
- **Role**: Periodically analyzes service latency, tokens-per-second, and queue bottlenecks. Adjusts inference routing weights dynamically.

---

## 4. Platform Registries

AegisOS employs decentralized registries to manage custom extensions and runtime metadata:

### A. Module Registry
- **Class**: `ModuleRegistry`
- **Role**: Standard interface for discovering, loading, and unloading platform modules. Coordinates `onInit`, `onReady`, and `onDestroy` lifecycle phases.

### B. Command Registry
- **Class**: `CommandRegistry`
- **Role**: Indexes executable instructions (e.g. start container, backup database) mapped to their risk categories and approval levels (e.g., `AUTO` vs `MANUAL`).

### C. Service Registry
- **Class**: `ServiceRegistry`
- **Role**: Resolves dependency injection tokens for singletons and transients. Performs circular dependency validations at boot.
