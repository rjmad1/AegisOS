# PHASE 8 — VALIDATION ENGINE

## Overview
The Validation Engine represents the core philosophy of the platform: **Assertions must be deterministic**. While the LLM decides *where* to go, the Validation Engine decides if the resulting state is *correct* using industry-standard, battle-tested tools. The LLM is only involved post-validation to explain failures in natural language.

## Responsibilities
- Execute a suite of deterministic checks on every state transition.
- Aggregate failures into structured reports.
- Invoke specialized LLM Auditors only when a failure requires contextual explanation.

## Interfaces
- `IValidationPipeline`: The orchestrator for running multiple validators concurrently.
- `IValidator`: Base interface for tools like axe-core, pixelmatch, etc.

## Data Structures
```typescript
interface ValidationSuiteResult {
  nodeId: string;
  passed: boolean;
  violations: ValidationFailure[];
}

interface ValidationFailure {
  validator: 'axe-core' | 'pixelmatch' | 'schemathesis' | 'network-idle';
  severity: 'minor' | 'moderate' | 'critical';
  rawOutput: any;
}
```

## Failure Modes
- **Validation Timeout**: A visual regression check on a massive DOM takes too long.
- **Flaky Validators**: A network validator flags a slow 3rd party tracker (e.g., Google Analytics) as a critical defect.

## Recovery
- **Timeout**: Strict 10-second timeout on all validators. If timed out, log as `unknown` and proceed.
- **Flakiness**: Implement allowlists/blocklists for network requests to ignore known 3rd party noise.

## Tradeoffs
- **Inline vs Asynchronous Validation**: Running axe-core on every click slows down exploration. *Tradeoff*: Validation tasks are pushed to a background Redis queue and processed asynchronously by idle workers, decoupling exploration speed from validation depth.

## Implementation Notes
- All validators must run statelessly on the serialized DOM/HAR artifacts, not directly on the live Playwright browser context, to free up the browser for further exploration.

## Future Evolution
- Allowing users to upload custom Jest/Playwright assertion scripts that execute within the Validation Engine pipeline.

---

## DETERMINISTIC VALIDATION SUITE

### 1. Browser Validation
- **Method**: Playwright's built-in assertions (e.g., checking for unhandled exceptions in the Console).
- **Target**: JavaScript runtime errors, React Error Boundaries.

### 2. API Validation
- **Method**: Parsing the HAR file, matching requests against the OpenAPI spec using `Schemathesis`.
- **Target**: 500 errors, invalid response schemas, missing CORS headers.

### 3. Accessibility Validation
- **Method**: Injecting and running `axe-core`.
- **Target**: WCAG 2.1 AA compliance (missing ARIA, low contrast).

### 4. Performance Validation
- **Method**: Google Lighthouse CLI / Chrome Trace analysis.
- **Target**: CLS (Cumulative Layout Shift), LCP (Largest Contentful Paint), excessive main-thread blocking.

### 5. Visual Regression
- **Method**: `pixelmatch` against baseline screenshots stored in S3.
- **Target**: Unintended CSS layout breaks.

### 6. Business Invariant Validation
- **Method**: JSONPath/Regex matching on DOM text (e.g., ensuring "Cart Total" is never negative).
- **Target**: High-level domain logic.

### 7. Database Validation
- **Method**: (If configured) Connecting to `Testcontainers` database and asserting state.
- **Target**: Orphaned records, corrupted data post-transaction.

### 8. Network Validation
- **Method**: HAR file parsing.
- **Target**: Mixed content (HTTP on HTTPS), failed asset loads (404s).

### 9. Logging Validation
- **Method**: Parsing application logs (if integrated via Datadog/CloudWatch API).
- **Target**: Backend stack traces correlated with the exact frontend timestamp.

---

## POST-VALIDATION AI REASONING

Only after the deterministic suite flags a `ValidationFailure`, the LLM is invoked.

### Root Cause Analysis & Failure Explanation
The **Validator Agent** ingests the `ValidationFailure` and the `ActionHistory`. It generates a human-readable explanation.
*Example: "Axe-core reported a missing aria-label on button #btn-4. This button was dynamically rendered after clicking 'Checkout'. Because it lacks a label, screen reader users cannot complete purchases."*

### Prioritization
The Agent assigns a priority based on the business context. A visual glitch in the footer is 'Low', a 500 error on the payment API is 'Critical'.

### Regression Recommendations
The **Regression Generator Agent** outputs the exact Playwright code needed to reproduce the bug:
```typescript
test('reproduce 500 on payment', async ({ page }) => {
  await page.goto('/cart');
  await page.click('#checkout');
  await page.click('#submit-payment'); // This triggered the 500 in HAR
});
```
