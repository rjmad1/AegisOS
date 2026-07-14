# Coding Standards

## Language & Runtime

- **TypeScript** (strict mode) for all source code
- **Node.js 20 LTS** as the runtime target
- **Next.js 16** as the web framework
- **React 19** for UI components

## TypeScript Guidelines

### Strict Configuration
- `strict: true` in `tsconfig.json`
- No `any` types except in infrastructure adapters interfacing with dynamic SDKs
- Prefer `unknown` over `any` for catch blocks

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `DashboardPanel.tsx` |
| Files (utilities) | kebab-case | `date-utils.ts` |
| Files (services) | dot-notation | `runtime.service.ts` |
| Interfaces | PascalCase with `I` prefix (optional) | `ISecretsProvider` |
| Types | PascalCase | `SessionData` |
| Constants | UPPER_SNAKE_CASE | `RATE_LIMIT_MAX` |
| Functions | camelCase | `getAdminUser()` |
| Classes | PascalCase | `SecretsPlatform` |
| Enums | PascalCase | `DeploymentStatus` |

### Import Order
1. Node.js built-ins
2. External packages
3. Internal absolute imports (`@/...`)
4. Relative imports

## Architecture Rules

### Layer Boundaries
- **Components** → may import from `hooks/`, `store/`, `utils/`, `types/`
- **Services** → may import from `infrastructure/`, `repositories/`
- **Infrastructure** → must not import from `components/`, `services/`, `modules/`
- **API routes** → may import from `services/`, `infrastructure/`

### No Circular Dependencies
- Use dependency injection or event bus for cross-module communication
- Infrastructure adapters must implement interfaces defined in `contracts/`

## Security Rules

1. **Never hardcode secrets** — use environment variables
2. **Never use `eval()`** or `new Function()`
3. **Always validate input** — use Zod schemas for API endpoints
4. **Always use parameterized queries** — Prisma handles this by default
5. **Never log secrets** — redact sensitive fields before logging
6. **Use constant-time comparison** for security-critical string matching

## Testing Standards

- **Unit tests**: Co-located or in `tests/unit/` mirror structure
- **Test naming**: `describe("ComponentName", () => { it("should behavior", ...) })`
- **Framework**: Vitest
- **Coverage target**: 60% minimum (CI gate), 80% recommended

## Git Conventions

### Branch Naming
- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `security/short-description` — security patches
- `docs/short-description` — documentation only
- `chore/short-description` — maintenance tasks

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
type(scope): description

feat(auth): add LDAP authentication provider
fix(proxy): correct CSRF origin validation for subdomains
security(secrets): remove hardcoded credentials from docker-compose
docs(api): add OpenAPI spec for v1 workflow endpoints
```

## Pull Request Checklist

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Linter passes (`npm run lint`)
- [ ] All tests pass (`npx vitest run`)
- [ ] No secrets in diff
- [ ] Documentation updated (if behavior changed)
- [ ] ADR created (if architectural pattern changed)
- [ ] CHANGELOG.md updated
