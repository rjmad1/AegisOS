# AI Workstation Platform

An enterprise-ready, local-first, privacy-preserving AI Workstation platform integrating Ollama inference models routing proxy, multi-agent frameworks, Tailscale mesh VPN, and a Next.js Console administration dashboard.

## ðŸš€ Getting Started

To initialize the platform dependencies, SCM services, environment paths, and local models dynamically, run the interactive bootstrap installer:

```powershell
# Open an elevated PowerShell session (Run as Administrator)
# Execute:
.\Bootstrap.ps1
```

The bootstrap wizard will:
1. Load your chosen environment profile (development, personal, enterprise, offline).
2. Query physical logical partitions to establish `$PlatformRoot` (defaults to `D:\AIPlatform` or `C:\AIPlatform`).
3. Encrypt GITHUB/TELEGRAM API keys securely at rest using machine-scope DPAPI.
4. Set up directory structures, configure NSSM services registry values, and establish reparse point directory junctions (`%USERPROFILE%\.aegisos` -> `$PlatformRoot`).
5. Execute the validation suite.

---

## ðŸ“‚ Repository Information Architecture

The codebase is structured around clean architectural domains:

- **[adr/](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/)**: Architectural Decision Records (ADR-001 through ADR-012) capturing system boundaries, security contexts, and autonomic AI operating system specifications.
- **[docs/](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/)**: Canonical deployment guides, operations guides, disaster recovery runbooks, and handbooks.
  - **[Master Documentation Index](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/README.md)**
- **[automation/](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/automation/)**: Re-engineered automation suite (installation, configuration, backups, restore, and package generation).
  - Includes a shared helper library `libs/PlatformHelper.psm1`.
  - Deployment profiles (`profiles/`) and machine-readable catalogs (`catalogs/`).
- **[src/](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/)**: Next.js 16 Console frontend dashboard.

---

## ðŸ’» Running the Console Dashboard

Once bootstrapped, run the Next.js Console admin panel locally:

```bash
# Install dependencies
npm install

# Launch development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the console.
To compile the production build:
```bash
npm run build
```

