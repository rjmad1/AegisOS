# AegisOS Knowledge Base: 16_DEPENDENCY_CATALOG.md

## Package & Core Tooling Dependencies

### Node.js / NPM Ecosystem (`package.json`)
* **Framework**: Next.js `15.x`, React `19.x`
* **API Ingress**: Fastify `4.x`, `@node-saml/node-saml` `4.x`
* **Agentic Standard**: `@modelcontextprotocol/sdk` `1.x`
* **Database & ORM**: `@prisma/client` `6.x`, Prisma `6.x`
* **Testing Framework**: Vitest `4.1.x`, Playwright `1.x`
* **Development & Linting**: TypeScript `5.x`, ESLint `9.x`, PostCSS, TailwindCSS

### Infrastructure & Runtime Dependencies
* **Local Inference**: Ollama `0.5.x` (Port 11434)
* **LLM Proxy**: LiteLLM `1.x` (Port 4000)
* **Job Queues & Caching**: Redis `7.x` (Port 6379)
* **Database Persistence**: PostgreSQL `16.x` / SQLite 3
* **Observability**: OpenTelemetry Collector `0.9x` (Ports 4317/4318), Prometheus (9090), Grafana (3002)
* **Mobile Runtime**: Flutter SDK `3.x` / Dart `3.x` (`aegis_mobile`)
