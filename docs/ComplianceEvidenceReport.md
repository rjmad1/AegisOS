# Compliance Evidence Report

Generated on: 2026-07-13 16:05:50
Status: COMPLIANT

## Audited Controls

1. **Access Control (SOC2 CC6.1/CC6.2, ISO A.9.1)**:
   - Status: PASS
   - Evidence: Verified hasPermission() in [authorization.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/platform/auth/authorization.ts).

2. **Data Encryption (SOC2 CC6.6/CC6.7, ISO A.8.2)**:
   - Status: PASS
   - Evidence: Verified es-256-gcm in [secret.repository.ts](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/src/repositories/secret.repository.ts).

3. **Audit Trail (SOC2 CC2.1, ISO A.12.4)**:
   - Status: PASS
   - Evidence: Verified AuditLogEntry & AuditEvent in [schema.prisma](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/prisma/schema.prisma).

