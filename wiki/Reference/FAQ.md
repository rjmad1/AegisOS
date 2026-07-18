# Frequently Asked Questions

> **Purpose**: Common questions about AegisOS.
> **Status**: ACTIVE · CANONICAL

---

**Navigation**: [Home](../Home.md) · [Reference](Glossary.md) > FAQ

---

## General

**Q: What is AegisOS?**
A: An enterprise-ready, local-first, privacy-preserving AI Workstation platform. It runs AI inference locally via Ollama and LiteLLM, managed through a Next.js admin console. No data leaves your machine.

**Q: What hardware do I need?**
A: Minimum: 16GB RAM, NVIDIA GTX 1080 (8GB VRAM). Recommended: 32GB RAM, RTX 4070+ (16GB VRAM). See [Installation Guide](../Getting-Started/Installation.md) for full tiers.

**Q: What operating systems are supported?**
A: Windows 11 (preferred), Ubuntu 22.04/24.04 LTS, macOS Apple Silicon M1+.

## Installation

**Q: Do I need Docker?**
A: For development, no — you can run with `npm run dev` + local Ollama. For production, Docker Compose is recommended.

**Q: The platform won't start — "AUTH_SECRET missing or insecure"**
A: Generate a proper secret: `openssl rand -hex 64` and set it in your `.env` file. See [Configuration](../Getting-Started/Configuration.md).

**Q: Can I run without a GPU?**
A: Yes, but inference will be slow (CPU-only mode). Small models like `smollm:135m` work on CPU.

## Architecture

**Q: Can AegisOS connect to cloud AI providers?**
A: Yes — LiteLLM supports routing to OpenAI, Anthropic, Google, Azure, and other providers. The platform is designed for local-first but supports hybrid deployment.

**Q: How is data protected?**
A: All data stays on your machine. DPAPI encryption at rest, TLS in transit, Zero Trust auth on every request. See [Security Architecture](../Architecture/Security-Architecture.md).

---

**Previous**: [Glossary](Glossary.md) · **Next**: [Dependency Map](Dependency-Map.md) · **Parent**: [Reference](Glossary.md)
