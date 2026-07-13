# Quality Engineering Framework

| Field | Value |
|---|---|
| **Document ID** | QEF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Quality Standard |
| **Owner** | Principal QA Architect |

---

## 1. Testing & Quality Strategy

We implement a **shift-left** quality strategy. Quality checks are automated and run locally during development, centrally during integration, and continuously post-merge in staging/production.

### 1.1 The Test Pyramid

```
      /\
     /  \   End-to-End Testing (e.g., Playwright E2E UI tests) - 10%
    /----\
   /      \  Integration & Contract Testing (e.g., API matching, DB schemas) - 30%
  /--------\
 /          \ Unit Testing (e.g., Vitest platform kernel mock tests) - 60%
/____________\
```

* **Unit Tests (60%)**: Focus on functions, class boundaries, event emitters, and state updates (using `vitest`).
* **Integration & Contract Tests (30%)**: Verify database CRUD routes, file storage providers, SSE streaming endpoints, and model configuration structures.
* **End-to-End Tests (10%)**: Simulate complete user journeys (e.g., user authentication, Visual Workflow configuration design, and command palette execution) in isolated browser contexts.

---

## 2. Readiness and Completion Standards

### 2.1 Definition of Ready (DoR)
A feature issue is "Ready" for engineering only when it meets the following criteria:
* **Clear Value**: Business value and target user personas are defined.
* **Acceptance Criteria**: Formulated using Behavior-Driven Development (BDD) style: `Given [context] / When [action] / Then [outcome]`.
* **Design Approval**: UX layouts and API/database contracts have been reviewed and approved by the UX Lead and Distinguished Software Architect.
* **Dependency Resolution**: External services or third-party packages are identified and approved.

### 2.2 Definition of Done (DoD)
A feature PR is "Done" and ready for merge to `main` only when it meets the following criteria:
* **Clean Code**: Code compiles without warnings and passes ESLint styling rules.
* **Test Coverage**: Code coverage meets or exceeds the target minimums.
* **Green Pipeline**: All unit, integration, and contract tests pass in the CI runner.
* **Documentation**: Inline docstrings are updated, and associated markdown guides are revised.
* **Audit Logs**: Any new operational paths emit proper audit logs and correlation IDs.

---

## 3. Advanced Testing Methodologies

### 3.1 Performance & Load Testing
* **Target Boundaries**: Establish maximum concurrent users and execution load limits (e.g., 200 concurrent active SSE transport connections).
* **Load Runner**: Simulated load runs using `k6` scripts hitting `/api/v1/search` and event streaming paths.
* **Stress Thresholds**: Load test to failure (e.g., DB locking behavior during 1000 concurrent database write attempts) to document memory leak thresholds and recovery time windows.

### 3.2 Chaos Engineering
Chaos testing validates the platform's self-healing capabilities:
* **Network Latency Simulation**: Artificially inject latency on local model endpoints (e.g. port 11434). Verify that connection pools gracefully roll back and retry without crashing the Node process.
* **Disk Saturation**: Fill the local disk space to 99%. Verify that the artifact processor suspends executions and raises a warning toast notification instead of corrupting SQLite records.
* **Service Termination**: Terminate Ollama or LiteLLM services during active agent execution. Verify that `self-healer.ts` detects port failures and records issues in the diagnostics log.

### 3.3 Security & Accessibility (a11y) Testing
* **SAST / DAST**: Static security scanning via GitHub code scanning (e.g. CodeQL) and dynamic security analysis on staging APIs.
* **Accessibility (a11y)**: Automated Axe-core runs verify WCAG 2.1 AA criteria (contrast ratios, keyboard focus rings, screen reader aria-labels) across all Console pages.
* **Browser Compatibility**: Playwright cross-browser runs confirm functional alignment on Chrome, Firefox, Safari, and Microsoft Edge.

### 3.4 Mutation Testing
To assess test suite quality:
* **Engine**: Stryker Mutator.
* **Goal**: Target a Mutation Score > 75%. This ensures tests verify logic rather than merely executing paths.

---

## 4. Release and Quality Gates

### 4.1 Test Code Coverage Targets
The platform enforces strict code coverage minimums:

| Component | Line Coverage | Branch Coverage | Function Coverage |
|---|---|---|---|
| **Platform Kernel** | 90% | 85% | 90% |
| **Authentication & Auth** | 95% | 90% | 95% |
| **Workflow Engine** | 85% | 80% | 85% |
| **Services / Repositories** | 80% | 75% | 80% |

### 4.2 Release Gates

```
[ Developer PR ] 
   │
   ▼
[ Gate 1: Code Quality ] ── (Fail if Type compiler fails or Lint warnings exist)
   │
   ▼
[ Gate 2: Security Gate ] ── (Fail if High CVEs in dependencies or hardcoded Secrets)
   │
   ▼
[ Gate 3: Test Coverage ] ── (Fail if overall coverage falls below 80% or regression > 1%)
   │
   ▼
[ Gate 4: Performance Gate ] ── (Fail if search API endpoint p95 latency > 200ms)
   │
   ▼
[ Approved Release Candidate ]
```

---

## 5. Defect Management & Risk Matrix

### 5.1 Defect Classification

* **Severity 1 (Blocker)**: System crash, data corruption, security breach, or complete loss of core capability (e.g., SSE streaming fails). Resolved within 4 hours.
* **Severity 2 (High)**: Major capability broken with no workaround (e.g., cron scheduler fails to trigger). Resolved within 24 hours.
* **Severity 3 (Medium)**: Component broken with a viable manual workaround (e.g., command palette command fails to route, but sidebar link works). Resolved within 1 sprint cycle.
* **Severity 4 (Low)**: Minor UI alignment drifts or documentation errors. Resolved on backlog priority.

### 5.2 Test Data Management & Synthetic Data Strategy
To ensure security and compliance:
* **Zero Production Data in Tests**: Testing must never use production customer databases containing email logs or OAuth credentials.
* **Synthetic Generation**: Use automated generators to construct mock database records (e.g. mock users, configurations, and execution events) during integration test runs.
