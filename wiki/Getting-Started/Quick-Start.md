# Quick Start

> **Purpose**: Get AegisOS running in under 5 minutes.
> **Audience**: Developers who want to try AegisOS immediately
> **Status**: ACTIVE · CANONICAL
> **Owner**: Raja Jeevan Kumar Maduri

---

**Navigation**: [Home](../Home.md) · [Getting Started](Installation.md) > Quick Start
**Related**: [Installation](Installation.md) · [Configuration](Configuration.md) · [Deployment](../Operations/Deployment.md)

---

## Prerequisites

- Git, Node.js 20+, Docker 24+ installed
- NVIDIA GPU with CUDA drivers (recommended)
- Ollama installed ([ollama.com](https://ollama.com))

## Steps

### 1. Clone and Install

```bash
git clone https://github.com/rjmad1/AegisOS.git
cd AegisOS
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — replace all `CHANGE_ME` values. At minimum, set:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Session signing key — `openssl rand -hex 64` |
| `OPS_JWT_SECRET` | JWT encryption key — `openssl rand -hex 64` |
| `OPS_ADMIN_USERNAME` | Admin login username |
| `OPS_ADMIN_PASSWORD` | Admin login password |

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Start Services

```bash
# Terminal 1 — Start Ollama
ollama serve

# Terminal 2 — Start the Console
npm run dev
```

### 5. Open Console

Navigate to **[http://localhost:3000](http://localhost:3000)** and log in with your admin credentials.

### 6. Pull Your First Model

```bash
ollama pull llama3:8b
```

The model will appear automatically in the Console dashboard.

---

## What's Next?

- **[Configuration](Configuration.md)** — Fine-tune environment settings
- **[Deployment](../Operations/Deployment.md)** — Docker Compose, Kubernetes, Helm
- **[User Guide](../Administration/User-Guide.md)** — Managing models, plugins, and workflows
- **[Developer Guide](../Developer-Guide/Developer-Setup.md)** — Extend AegisOS

---

**Previous**: [Installation](Installation.md)
**Next**: [Configuration](Configuration.md)
**Parent**: [Home](../Home.md)
