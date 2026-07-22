# SDK Generation Report

## 1. Objective
Ensure that platform SDKs across multiple languages never diverge from the core platform contracts. Manual SDK maintenance is deprecated.

## 2. Automation Strategy
SDKs will be generated directly from the Version 1 Architecture API contracts (`openapi-spec.json`) using OpenAPI Generator.

### Supported Languages
- **TypeScript:** Primary web and Node.js SDK.
- **Python:** Primary Data Science and AI integration SDK.
- **Java:** Enterprise integration SDK.
- **.NET:** Enterprise integration SDK.

## 3. Pipeline Integration
During the CI build process, if `openapi-spec.json` is modified:
1. The generator script (`scripts/generate-sdks.sh`) is invoked.
2. Code is generated for all 4 languages.
3. Automated client tests are executed against the generated SDKs using a mocked PIK instance.
4. Markdown documentation for the SDKs is generated and synced to the documentation portal.
5. If tests pass, the SDKs are automatically published to their respective package managers (npm, PyPI, Maven Central, NuGet) during the release cut.
