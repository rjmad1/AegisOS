# Marketplace Seed Catalog

## 1. Objective
Demonstrate the power of the extension-first architecture by publishing high-quality, certified Marketplace assets. The platform core is frozen; all value is now delivered here.

## 2. Phase 1 Seed Assets

### Provider Packs
- **`provider-openai`:** Official implementation of the LLM API contract mapping to OpenAI.
- **`provider-anthropic`:** Official implementation of the LLM API contract mapping to Anthropic.
- **`provider-ollama`:** Official implementation of the local LLM API contract.

### Connector Packs
- **`connector-github`:** Integrates PR reviews, code analysis, and issue tracking into the PIK.
- **`connector-jira`:** Bidirectional sync for Engineering Missions and Jira tickets.

### Mission Packs
- **`mission-code-review`:** Standardized workflow for automated architecture and code quality review.
- **`mission-security-audit`:** Automated threat modeling and SAST scanning mission.

### Solution Packs
- **`solution-enterprise-architecture`:** A bundled solution of models, dashboards, and missions designed for Enterprise Architecture teams to model and validate internal systems.

## 3. Quality Standard
All seed assets must pass the Marketplace Certification pipeline (SBOM, linting, tests, and signature generation) before publication.
