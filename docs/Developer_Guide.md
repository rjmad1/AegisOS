# Developer Guide

This guide details the conventions and structures used to build and maintain the Next.js Console administrative dashboard.

## 1. Project Organization

The console dashboard is a Next.js 16 application located under the `src/` directory:

```
src/
├── api/            # API clients, hooks, errors, and type definitions
├── app/            # App Router pages and v1 API route endpoints
│   ├── (console)/  # Grouped dashboard screens (artifacts, models, settings, etc.)
│   ├── api/v1/     # REST endpoint routing definitions
│   └── login/      # Auth login screen
├── components/     # UI components (buttons, tabs, datagrid) and AppShell
├── infrastructure/ # Adapter framework contracts, providers, registry, and mappers
├── repositories/   # Data repositories (artifact queries and mutations)
├── services/       # Core business service logic layers
└── store/          # Zustand global state management hooks
```

---

## 2. API Contract Guidelines

Following **ADR-001 (Contract-First Versioned API Boundaries)**, all endpoints returning platform operations must reside under `/api/v1/` and return a standard `501 Not Implemented` payload containing schema specs when active adapters are offline:

### Adding or Modifying Endpoints
1. Create a `route.ts` file under `src/app/api/v1/<endpoint_name>/`.
2. Define GET/POST handlers returning `NextResponse.json` with a description of target schemas:
   ```typescript
   import { NextResponse } from "next/server";
   
   const CONTRACT = {
     endpoint: "/api/v1/custom-endpoint",
     status: "Not Implemented",
     methods: { GET: { description: "Custom action description." } }
   };
   
   export async function GET() {
     return NextResponse.json(CONTRACT, { status: 501 });
   }
   ```

---

## 3. Running the Development Server

To start the Console dashboard locally:

```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the administrative console dashboard.

To compile production bundles:
```bash
npm run build
```
The application compiles into the `.next/` directory. Ensure no TypeScript or ESLint errors are reported.
