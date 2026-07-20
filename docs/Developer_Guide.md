# Developer Guide

| Metadata | Value |
|---|---|
| **Document ID** | DG-2026-001 |
| **Version** | 1.2.0 (Active) |
| **Last Synced** | 2026-07-20 05:40:00 |
| **Classification** | Public — Developer Onboarding |
| **Authority** | Platform Governance Board |

This guide details the conventions, structures, and APIs used to build, extend, and test AegisOS.

---

## 1. Project Organization

The AegisOS application is structured around a strict layered system under the `src/` directory:

```
src/
├── api/            # API client interceptors, repos, and REST wrappers
├── app/            # App Router pages and v1 API routes
│   ├── (console)/  # Admin UI pages (models, settings, workflows, EIP dashboard)
│   └── api/v1/     # REST endpoint routing definitions
├── components/     # Reusable React UI component libraries
├── infrastructure/ # Core adapters (db, events, logs, secure secrets, scheduler)
├── modules/        # Evolved console UI domain feature packages
├── platform/       # Core platform planes, kernel, and registries
│   ├── auth/       # Authentication (JWT cookie) and RBAC verification
│   ├── certification/ # Merkle Evidence Graph, release signer, verifiers
│   ├── control-plane/ # ECP, Digital Twin Graph Kernel, Convergence Engine
│   ├── kernel/     # Platform boot, PECS, PRM, PPS, PAOS services
│   ├── module-registry/ # Custom module dynamic loading lifecycles
│   └── qualification/ # PQF orchestrators, PMI maturity, and remediation
├── repositories/   # Relational data access mapper (Prisma clients)
├── services/       # EIP intelligence, runtime, and workflow services
├── store/          # Zustand global frontend state management hooks
└── types/          # Shared TypeScript type definitions
```

---

## 2. API Contract Guidelines

Following **ADR-001 (Contract-First Versioned API Boundaries)**, all REST endpoints must reside under `/src/app/api/v1/`.

### Creating API Route Endpoints
Define GET/POST handlers returning standard JSON contracts. Handlers should leverage the Platform Kernel's services to ensure security policies and trace IDs are enforced:

```typescript
import { NextResponse } from "next/server";
import { PlatformKernel } from "@/platform/kernel/PlatformKernel";

export async function GET(request: Request) {
  // Retrieve the Policy Service (PPS) from the Kernel container
  const policyService = PlatformKernel.getService<any>('PPS');
  const user = { role: "Administrator" }; // Resolved from session
  
  if (!policyService.isAllowed(user.role, "read", "system:config")) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const configManager = PlatformKernel.getService<any>('PRM');
  return NextResponse.json({ status: "healthy", resources: configManager.getSummary() });
}
```

---

## 3. Extending the Platform (Custom Component Registration)

AegisOS supports plugin extensibility. You can register custom external modules into the Control Plane and Digital Twin topology via `PlatformOperationsControlPlane`:

```typescript
import { platformOperationsControlPlane } from "@/platform/control-plane/PlatformOperationsControlPlane";

const customId = platformOperationsControlPlane.registerPlatformComponent({
  name: "Slack Alert Dispatcher",
  category: "service",
  dependencies: ["service:control-plane"],
  capabilities: ["alert-routing"],
  healthHandler: async () => {
    // Custom logic checking connection health
    return { status: "healthy", message: "Connected to Slack API" };
  },
  metricsHandler: async () => {
    return { alertsDispatchedCount: 42 };
  }
});
```

---

## 4. Running the Development Server & Testing

### Running Console Dashboard
To start the dev server:
```bash
npm install
npx prisma db push
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Running Verification Tests
AegisOS employs Vitest for code unit testing and PowerShell for compliance audits.
- **Unit & Integration Tests**:
  ```bash
  npm run test
  ```
- **Continuous Compliance & Quality Check**:
  Run the master orchestrator in elevated PowerShell:
  ```powershell
  .\automation\VerifyExcellence.ps1
  ```
  This script will automatically type-check TypeScript, run lint audits, verify port bindings, and rebuild the master documentation index.
