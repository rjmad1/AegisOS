# PHASE 10 — SYNTHETIC DATA

## Overview
Autonomous testing requires robust, varied data to input into forms, search bars, and APIs. Hardcoding test data causes tests to become stale and miss edge cases. The Synthetic Data module dynamically generates context-aware, schema-compliant data using deterministic tools like Faker, guided by JSON schemas.

## Responsibilities
- Inject valid and invalid data into input fields.
- Generate complex objects for API payloads.
- Ensure data diversity across exploration sessions.

## Interfaces
- `IDataGenerator`: Core interface for requesting specific data types.

## Data Structures
```typescript
interface GenerationRequest {
  schema: JSONSchema;
  intent: 'valid' | 'invalid' | 'boundary';
  locale?: string;
}
```

## Failure Modes
- Generated data violates undocumented backend business constraints (e.g., username must contain a number, but schema just says `string`), leading to a blocked exploration path.

## Recovery
- If the Explorer Agent encounters a validation error after form submission, it feeds the error back to the Data Generator to refine the prompt/schema for the next attempt.

## Tradeoffs
- **Dynamic vs Static Fixtures**: Static database dumps guarantee tests run, but hide bugs. Dynamic generation finds bugs but causes false positives if the generator creates data the app rightfully rejects. *Tradeoff*: Use static fixtures for application state (users, products exist), but dynamic generation for session inputs (typing in search, filling forms).

## Implementation Notes
- Rely heavily on `JSON Schema Faker` paired with `@faker-js/faker` deterministic seeds. By seeding faker with the `sessionId`, runs become reproducible.

## Future Evolution
- Using LLMs to analyze backend source code to perfectly deduce undocumented constraints and generate custom Zod schemas.

---

## GENERATION STRATEGIES

### 1. Dynamic Generators
Basic primitive generation using `@faker-js/faker`. Maps input labels/names to faker functions (e.g., `<input name="email">` triggers `faker.internet.email()`).

### 2. Business-aware Generators
Uses the Planner Agent's context. If testing a medical app, the generator produces valid ICD-10 codes instead of random strings.

### 3. Schema-aware Generators
Reads OpenAPI specs or GraphQL schemas to construct massive, deeply nested payloads that perfectly conform to the backend's expected typing.

### 4. Edge-case Generation
Deliberately inserting Zalgo text, SQL injection strings, XSS vectors (for the Security Auditor), and massive strings (10MB text) to test buffer limits.

### 5. Internationalization & Localization
Generates data across varying locales (RTL languages, double-byte characters, varying date formats) based on the session's configuration.

### 6. Property-based Generation
Integrating concepts from `fast-check` to rapidly fuzz a single input field across hundreds of permutations in an isolated loop before continuing standard exploration.

### 7. Invalid Datasets
Generating data that structurally matches but logically fails (e.g., credit card numbers that pass Luhn check but are known test-declined cards).

### 8. Boundary Datasets
Generating data exactly at, 1 bit above, and 1 bit below documented constraints (e.g., password length 255, 256, 257 characters).
