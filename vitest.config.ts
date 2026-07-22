import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    fileParallelism: false,
    exclude: ['tests/e2e/**/*', '**/node_modules/**', 'node_modules_backup/**/*', '.next/**/*', 'dist/**/*', 'conversa_repo/**/*'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    env: {
      // These are TEST-ONLY values used exclusively for vitest execution.
      // They are intentionally fake and must NEVER match any real deployment credentials.
      DATABASE_URL: 'file:./databases/test.db',
      NODE_ENV: 'test',
      AUTH_SECRET: 'test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890',
      OPS_JWT_SECRET: 'test-only-jwt-secret-not-for-production-use-eeee-ffff-0000-1111-0987654321',
      OPS_ADMIN_USERNAME: 'test-admin',
      OPS_ADMIN_PASSWORD: 'TestOnlyPassword!NotForProduction',
      GOOGLE_CLIENT_ID: 'test-only-google-client-id.example.com',
      GOOGLE_CLIENT_SECRET: 'test-only-google-client-secret'
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/platform/extension/ExtensionFramework.ts',
        'src/platform/governance/ArchitectureValidator.ts',
        'src/platform/health/PlatformHealth.ts',
        'src/platform/developer/governance/CertificationSuite.ts',
        'src/platform/developer/testing/TestingFramework.ts',
        'src/platform/diagnostics/SystemDiagnostics.ts',
        'src/platform/context/RuntimeContext.ts',
        'src/platform/kernel/ServiceRegistry.ts',
        'src/infrastructure/evaluation/evaluation-pipeline.ts',
        'src/infrastructure/governance/readiness-checks.ts',
        'src/infrastructure/reliability/CapacityEngine.ts',
        'src/infrastructure/reliability/ChaosPlatform.ts',
        'src/infrastructure/reliability/SREPlatform.ts',
        'src/infrastructure/reliability/FailureAutomation.ts',
        'src/enterprise/validation/PerformanceValidationSuite.ts',
        'src/enterprise/validation/MultiTenantValidationSuite.ts',
        'src/enterprise/validation/EnterprisePerformanceCertification.ts'
      ]
    }
  }
});
