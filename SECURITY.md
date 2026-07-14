# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue to report a security vulnerability.**

Instead, please report vulnerabilities through one of the following channels:

- **Email:** [raja.jeevan@gmail.com](mailto:raja.jeevan@gmail.com)
- **LinkedIn:** [Raja Jeevan Kumar](https://www.linkedin.com/in/rajajeevankumar/)

### What to include

- A description of the vulnerability
- Step-by-step reproduction instructions
- Potential impact assessment
- Suggested fix (if available)

### Response timeline

| Action                     | SLA          |
|----------------------------|--------------|
| Acknowledge receipt        | 48 hours     |
| Initial triage             | 5 business days |
| Fix for critical severity  | 15 business days |
| Fix for high severity      | 30 business days |

### Scope

The following are in scope for security reports:

- Authentication and authorization bypasses
- Credential exposure in code, configuration, or artifacts
- Injection vulnerabilities (SQL, XSS, command injection, prompt injection)
- Insecure cryptographic implementations
- Container escape or privilege escalation
- Supply chain attacks (dependency compromise)

### Disclosure Policy

We follow coordinated disclosure. We request that you:

1. Allow us reasonable time to fix the issue before public disclosure
2. Avoid accessing or modifying other users' data
3. Act in good faith to avoid disruption to the platform

## Security Best Practices for Contributors

- **Never commit secrets** — see [SECRETS_MANAGEMENT.md](docs/SECRETS_MANAGEMENT.md)
- **Use `.env.example`** as the template — never `.env.*` files with real values
- **All PRs are scanned** — CodeQL, dependency review, and secret scanning run on every PR
- **Pin dependencies** — use exact versions for production dependencies
