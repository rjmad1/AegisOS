# Contributing to AegisOS

Welcome! This guide outlines how to configure your local workspace, use the AegisOS SDK, develop extensions, and sign your packages for execution.

---

## 1. Local Workspace Setup

AegisOS is built as a local-first platform running Next.js, LiteLLM, Ollama, and PostgreSQL.

### Prerequisites
* **Node.js**: v20 or newer
* **Docker / Docker Compose**: Required for running LiteLLM, Redis, and OTel local pipelines
* **Ollama**: Installed locally on the loopback interface (`localhost:11434`)

### Bootstrapping the Environment
Clone the repository and run the installation script:
```powershell
# On Windows (Elevated PowerShell)
.\Bootstrap.ps1 -Profile developer
```
This script will verify your local dependencies, start the services, and prepare the local environment variables.

---

## 2. Developing Extensions with the SDK

Extensions run under the **Tiered Runtime Isolation Architecture (TRIA)**. The sandbox level is determined dynamically using the package capabilities.

### Initializing the SDK
Include the `AegisSdk` in your project and call `initialize()` to negotiate capabilities:
```typescript
import { AegisSdk } from "./src/platform/sdk/MissionAwareSdk";

const sdk = new AegisSdk();
await sdk.initialize();

// Query platform status
const status = await sdk.runtime.getStatus();
console.log(`Node status: ${status.status}, Uptime: ${status.uptime}`);
```

### Manifest Declaration
Every extension or provider must specify a `package.json` manifest with a `platformConfig` section:
```json
{
  "name": "com.example.ext.myprovider",
  "version": "1.0.0",
  "platformConfig": {
    "capabilities": ["mission-execution"],
    "permissions": ["filesystem:read"],
    "trustLevel": 80
  }
}
```

---

## 3. Package Supply Chain & Signing

To maintain Zero-Trust security, all published packages must be cryptographically signed.

1. **Build the Package**: Use the `PlatformPackageGenerator` to package your extension:
   ```bash
   npm run build:package -- --src ./my-extension --out ./dist/my-extension.aegis
   ```
2. **Attest & Sign**: Generate a signature hash using your certified developer key:
   ```bash
   npm run sign:package -- --pkg ./dist/my-extension.aegis --key-file ./dev-private.pem
   ```
3. **Register**: Install the signed package via the Administrator Console or the `PlatformKernel` module registry.
