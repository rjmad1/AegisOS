# Contributing to AegisOS Studio

Thank you for helping us improve AegisOS Studio! Please review these guidelines before submitting a Pull Request.

## Code of Conduct
We enforce respectful, collaborative interaction. Please see our [CODE_OF_CONDUCT.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/CODE_OF_CONDUCT.md).

## Development Guidelines

### Branching Convention
- `feature/name-of-feature` for new capabilities.
- `bugfix/issue-description` for bug resolutions.
- `docs/topic-name` for documentation enhancements.

### Commit Guidelines
- Use clear, descriptive commit messages.
- Reference GitHub Issue numbers where applicable.

### Quality Standards
1. **Type Safety**: Preserve 100% type safety. Do not use `any`. Verify using `npm run build` or `npx tsc --noEmit`.
2. **Linting**: Ensure code passes rules inside `eslint.config.mjs` by running `npm run lint`.
3. **Unit Testing**: All code additions must be covered by tests. Run the suite using `npm run test`.
4. **Architectural Consistency**: If introducing a new subsystem pattern, document it by adding a new Architecture Decision Record (ADR) under `adr/` following the next sequential ID.
