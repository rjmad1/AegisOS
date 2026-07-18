# AegisOS: AI Workstation Platform

An enterprise-ready, local-first, privacy-preserving AI Workstation platform integrating Ollama inference models routing proxy, multi-agent frameworks, and a Next.js Console administration dashboard.

---

## 📖 Canonical Documentation & Setup

To install, configure, and get started with AegisOS, please refer to the primary, authoritative guide:

### 🚀 **[AegisOS Installation & Getting Started Guide](wiki/Install-Guide.md)**

*This single guide contains comprehensive step-by-step instructions on hardware requirements, software prerequisites (Git, Node, Python, CUDA, Docker, Ollama, LiteLLM), repository setup, service startup order, first-time onboarding, verification checklists, and troubleshooting.*

---

## 📁 Repository Information Architecture

The codebase is structured around clean architectural domains:

- **[wiki/](wiki/)**: Authoritative operational documentation and getting started guides.
- **[adr/](adr/)**: Architectural Decision Records (ADR-001 through ADR-012) capturing system boundaries, security contexts, and autonomic AI operating system specifications.
- **[docs/](docs/)**: Domain-specific handbooks, checklists, and compliance reports.
  - **[Master Documentation Index](docs/README.md)**
- **[automation/](automation/)**: PowerShell automation suite (installation, configuration, backups, restore, and package generation).
  - Includes a shared helper library `libs/PlatformHelper.psm1`.
  - Deployment profiles (`profiles/`) and machine-readable catalogs (`catalogs/`).
- **[src/](src/)**: Next.js Console frontend dashboard interface.

---

## 💻 Running the Console Dashboard Locally

Once your environment is bootstrapped, run the Next.js Console administration dashboard:

```bash
# Restore project dependencies
npm install

# Start the local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To compile a production-ready optimized build:
```bash
npm run build
```
