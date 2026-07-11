# Platform Handbook

This handbook indexes and describes the reusable components, models, databases, and agents integrated into the AI Workstation platform.

## 1. System Dependencies and Services

The core infrastructure operates using five interconnected services managed via NSSM (Non-Sucking Service Manager) or Docker Compose:

| Service | Executable / Entrypoint | Port | Role |
|---|---|---|---|
| **Ollama** | `C:\Program Files\Ollama\ollama.exe serve` | 11434 | Local model host |
| **LiteLLMService** | `C:\ProgramData\AI\bin\litellm.exe` | 4000 | Model routing proxy |
| **OpenClawService** | `openclaw/dist/index.js` | 18789 | Agent gateway / MCP host |
| **OmniRouteService** | `omniroute/server/index.js` | 20128 | Performance dashboard |
| **Open-WebUI Container** | `docker-compose.yml` (Image: ghcr.io/open-webui/open-webui:main) | 8090 | General chat UI |

---

## 2. Models Inventory

The platform is pre-configured to utilize the following GGUF, VRAM-optimized models:

| Model ID | Size | Purpose | Role |
|---|---|---|---|
| `gemma4:latest` | 9.6 GB | General Chat / Reasoning | Primary reasoning engine |
| `gemma2:9b` | 9.6 GB | Lightweight text generation | Secondary chat fallback |
| `qwen2.5:14b` | 9.3 GB | Code syntax / Multi-language | Coding expert |
| `qwen3:14b` | 9.3 GB | Task breakdown | Planning agent |
| `deepseek-r1:32b` | 19 GB | Logic / Deep code validation | Advanced code review |
| `all-minilm:latest` | 45 MB | Vector extraction | RAG Embeddings |
| `smollm:135m` | 91 MB | CPU fallback / Script validation | Tiny terminal runner |

---

## 3. Context & MCP Integration

Seven Model Context Protocol (MCP) servers are active on the gateway, allowing models to interact with the workstation:

1. **filesystem**: Reads/writes files in `D:\OpenClaw\Source`.
2. **git**: Examines local git repositories.
3. **github**: Integrates with remote Github repositories using `GITHUB_TOKEN`.
4. **sqlite**: Queries and modifies the agent database.
5. **fetch**: Downloads web HTML and parses it to clean Markdown.
6. **puppeteer**: Automated browser testing and screenshot captures.
7. **raja-knowledge-repository**: Custom semantic RAG pipeline over personal notes.

---

## 4. Reusable Configuration Manifests

Configuration settings are externalized to allow machine-independent deployments:

* **Ollama env variables**: Sets CUDA thresholds and model folder redirections.
* **LiteLLM routing rules**: `configs/litellm/config.yaml` describes fallback chains.
* **OpenClaw endpoints**: `configs/openclaw/openclaw.json` maps MCP parameters.
* **Next.js Console settings**: `console_config.json` sets relative paths for storage.
