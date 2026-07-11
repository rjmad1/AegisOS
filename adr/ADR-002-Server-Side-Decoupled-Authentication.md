# ADR-002: Server-Side Decoupled Authentication

## Status
Approved

## Context
Credentials (`admin` / `AdminPassword123!`) were previously checked inside client-side components and state stores (`src/store/authStore.ts`). This exposed credentials inside static JavaScript bundles.

## Decision
Extract credentials from the source code, moving them to environmental variables (`OPS_ADMIN_USERNAME` and `OPS_ADMIN_PASSWORD`), and delegate authentication verification to the server-side endpoint `/api/v1/auth/login`.

## Alternatives Considered
- **Stateless OAuth**: Over-engineering for a local workstation single-user console dashboard.
- **Client-Side Mocks**: Rejected due to credentials exposure in bundles.

## Trade-offs
- *Pros*: Secures user credentials by maintaining verification inside Next.js server-side route context.
- *Cons*: Requires server-side environment variables to be populated.

## Consequences
- Protects administrative paths from inspection.
- Provides standard environment variables configuration layout.
