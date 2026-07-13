// src/enterprise/validation/MultiTenantValidationSuite.ts
// Automated verification of tenant isolation, licensing, billing, and governance

import { TenantContext } from '../tenant/TenantContext';
import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { identityPlatform } from '../identity/IdentityPlatform';
import { licenseEngine } from '../licensing/LicenseEngine';
import { entitlementService } from '../licensing/EntitlementService';
import { billingEngine } from '../billing/BillingEngine';
import { usageMeteringEngine } from '../billing/UsageMeteringEngine';
import { policyEngine } from '../identity/PolicyEngine';
import { dataIsolation } from '../governance/DataIsolation';
import { applyTenantScope, getCurrentTenantFilter } from '../tenant/TenantScopedPrisma';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  suite: string;
  test: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  details: Record<string, unknown>;
  durationMs: number;
}

export interface ValidationReport {
  id: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  score: number;
  results: ValidationResult[];
  generatedAt: string;
  durationMs: number;
}

// ============================================================================
// Multi-Tenant Validation Suite
// ============================================================================

export class MultiTenantValidationSuite {
  private static instance: MultiTenantValidationSuite | null = null;

  private constructor() {}

  public static getInstance(): MultiTenantValidationSuite {
    if (!MultiTenantValidationSuite.instance) {
      MultiTenantValidationSuite.instance = new MultiTenantValidationSuite();
    }
    return MultiTenantValidationSuite.instance;
  }

  /**
   * Run the complete validation suite.
   */
  public async runAll(): Promise<ValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Run all test suites
    results.push(...this.validateTenantIsolation());
    results.push(...this.validateDataIsolation());
    results.push(...this.validateLicenseEnforcement());
    results.push(...this.validateBillingAccuracy());
    results.push(...this.validateOrganizationBoundaries());
    results.push(...this.validateCrossTenantProtection());
    results.push(...this.validatePolicyEnforcement());
    results.push(...this.validateMarketplaceEntitlements());

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warn').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const score = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

    const report: ValidationReport = {
      id: `vr-${crypto.randomUUID()}`,
      totalTests: results.length,
      passed, failed, warnings, skipped, score,
      results,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };

    console.log(`[ValidationSuite] Complete: ${passed}/${results.length} passed (${score}%) in ${report.durationMs}ms`);
    return report;
  }

  // ======== Tenant Isolation Tests ========

  private validateTenantIsolation(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test 1: TenantContext propagation
    results.push(this.runTest('Tenant Isolation', 'TenantContext propagation', () => {
      const testCtx = {
        organizationId: 'test-org', tenantId: 'test-tenant', workspaceId: null,
        userId: 'test-user', roles: ['member'], tier: 'professional' as const,
        region: 'us-east-1', isolationLevel: 'shared' as const,
        permissions: ['read'], featureFlags: {}, quotas: {
          maxStorageBytes: 1e9, maxAiTokensPerMonth: 1e6, maxApiCallsPerMinute: 300,
          maxConcurrentWorkflows: 10, maxAgents: 10, maxKnowledgeBases: 5, maxPlugins: 20, maxCustomModels: 2,
        },
      };

      let capturedTenantId: string | null = null;
      TenantContext.run(testCtx, () => {
        capturedTenantId = TenantContext.requireTenantId();
      });

      if (capturedTenantId !== 'test-tenant') {
        throw new Error(`Expected 'test-tenant', got '${capturedTenantId}'`);
      }
    }));

    // Test 2: TenantContext isolation between runs
    results.push(this.runTest('Tenant Isolation', 'Context isolation between tenants', () => {
      let tenant1Id: string | null = null;
      let tenant2Id: string | null = null;

      const ctx1 = this.makeTestContext('tenant-a');
      const ctx2 = this.makeTestContext('tenant-b');

      TenantContext.run(ctx1, () => { tenant1Id = TenantContext.requireTenantId(); });
      TenantContext.run(ctx2, () => { tenant2Id = TenantContext.requireTenantId(); });

      if (tenant1Id === tenant2Id) throw new Error('Tenant contexts leaked between runs!');
    }));

    // Test 3: System context bypass
    results.push(this.runTest('Tenant Isolation', 'System context bypasses tenant scope', () => {
      let isSystem = false;
      TenantContext.runAsSystem(() => { isSystem = TenantContext.isSystemContext(); });
      if (!isSystem) throw new Error('System context not detected.');
    }));

    // Test 4: No context throws on require
    results.push(this.runTest('Tenant Isolation', 'Missing context throws on require', () => {
      try {
        TenantContext.require();
        throw new Error('Should have thrown.');
      } catch (e: any) {
        if (!e.message.includes('No tenant context')) throw e;
      }
    }));

    return results;
  }

  // ======== Data Isolation Tests ========

  private validateDataIsolation(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Prisma scope injection
    results.push(this.runTest('Data Isolation', 'Prisma tenant scope injection', () => {
      const ctx = this.makeTestContext('iso-test-tenant');
      TenantContext.run(ctx, () => {
        const filter = getCurrentTenantFilter();
        if (!filter) throw new Error('No tenant filter in context.');
        if (filter.tenantId !== 'iso-test-tenant') throw new Error('Wrong tenant filter.');
      });
    }));

    // Test: Model scope application
    results.push(this.runTest('Data Isolation', 'Tenant-scoped model filtering', () => {
      const ctx = this.makeTestContext('scope-test');
      TenantContext.run(ctx, () => {
        const args = applyTenantScope('User', { where: {} });
        if (args.where.tenantId !== 'scope-test') {
          throw new Error('Tenant scope not applied to User model.');
        }
      });
    }));

    // Test: Global models bypass scope
    results.push(this.runTest('Data Isolation', 'Global models bypass tenant scope', () => {
      const ctx = this.makeTestContext('bypass-test');
      TenantContext.run(ctx, () => {
        const args = applyTenantScope('Region', { where: {} });
        if (args.where.tenantId) throw new Error('Tenant scope should not apply to global models.');
      });
    }));

    // Test: Data isolation verification
    results.push(this.runTest('Data Isolation', 'Isolation verification passes in context', () => {
      const ctx = this.makeTestContext('verify-test');
      TenantContext.run(ctx, () => {
        const result = dataIsolation.verifyIsolation();
        if (!result.isolated) throw new Error(`Violations: ${result.violations.join(', ')}`);
      });
    }));

    // Test: RLS policy generation
    results.push(this.runTest('Data Isolation', 'RLS policy generation', () => {
      const sql = dataIsolation.generateRLSPolicy('User');
      if (!sql.includes('ENABLE ROW LEVEL SECURITY')) throw new Error('Missing RLS enable statement.');
      if (!sql.includes('tenant_isolation')) throw new Error('Missing policy name.');
    }));

    return results;
  }

  // ======== License Enforcement Tests ========

  private validateLicenseEnforcement(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Feature entitlement check
    results.push(this.runTest('License Enforcement', 'Feature entitlement validation', () => {
      const check = entitlementService.checkFeature('ai-basic', '__system__');
      if (!check.entitled) throw new Error('System tenant should have all entitlements.');
    }));

    // Test: Quota enforcement
    results.push(this.runTest('License Enforcement', 'Usage quota enforcement', () => {
      const quota = entitlementService.checkQuota('api-calls-per-min', 1, '__system__');
      if (quota.exceeded) throw new Error('System tenant should have unlimited quota.');
    }));

    // Test: License creation and validation
    results.push(this.runTest('License Enforcement', 'License creation and activation', () => {
      const org = tenantLifecycle.createOrganization({
        name: 'License Test Org', slug: `lic-test-${Date.now()}`, displayName: 'License Test',
        tier: 'professional', primaryRegion: 'us-east-1', createdBy: 'test',
      });
      const tenant = tenantLifecycle.provisionTenant({
        organizationId: org.id, name: 'Lic Tenant', slug: `lic-tnt-${Date.now()}`,
        environment: 'production', region: 'us-east-1', initiatedBy: 'test',
      });
      const license = licenseEngine.createLicense({
        organizationId: org.id, tenantId: tenant.id, type: 'subscription',
        tier: 'professional', durationDays: 30,
      });
      licenseEngine.activateLicense(license.licenseKey, { tenantId: tenant.id, activatedBy: 'test' });
      const validation = licenseEngine.validate(tenant.id);
      if (!validation.valid) throw new Error(`License validation failed: ${validation.reason}`);
    }));

    return results;
  }

  // ======== Billing Accuracy Tests ========

  private validateBillingAccuracy(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Usage metering recording
    results.push(this.runTest('Billing Accuracy', 'Usage metering records correctly', () => {
      const testTenant = `billing-test-${Date.now()}`;
      usageMeteringEngine.record({
        tenantId: testTenant, category: 'ai', metric: 'ai.prompt-tokens', quantity: 1000,
      });
      const summary = usageMeteringEngine.getUsageSummary(testTenant);
      if (summary.totalRecords === 0) throw new Error('Usage record not found.');
      if (summary.categories.ai.totalQuantity === 0) throw new Error('AI usage not recorded.');
    }));

    // Test: Cost calculation
    results.push(this.runTest('Billing Accuracy', 'Cost calculation correctness', () => {
      const testTenant = `cost-test-${Date.now()}`;
      const record = usageMeteringEngine.record({
        tenantId: testTenant, category: 'api', metric: 'api.requests', quantity: 1000,
      });
      if (record.totalCost <= 0) throw new Error('Cost should be positive for 1000 API requests.');
    }));

    return results;
  }

  // ======== Organization Boundaries Tests ========

  private validateOrganizationBoundaries(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Organization creation and tenant limit
    results.push(this.runTest('Organization Boundaries', 'Organization tenant limits enforced', () => {
      const org = tenantLifecycle.createOrganization({
        name: 'Boundary Test', slug: `bnd-${Date.now()}`, displayName: 'Boundary Test',
        tier: 'free', primaryRegion: 'us-east-1', createdBy: 'test',
      });
      // Free tier: max 1 tenant
      tenantLifecycle.provisionTenant({
        organizationId: org.id, name: 'T1', slug: `bnd-t1-${Date.now()}`,
        environment: 'production', region: 'us-east-1', initiatedBy: 'test',
      });
      try {
        tenantLifecycle.provisionTenant({
          organizationId: org.id, name: 'T2', slug: `bnd-t2-${Date.now()}`,
          environment: 'production', region: 'us-east-1', initiatedBy: 'test',
        });
        throw new Error('Should have thrown: tenant limit exceeded.');
      } catch (e: any) {
        if (!e.message.includes('maximum tenant limit')) throw e;
      }
    }));

    return results;
  }

  // ======== Cross-Tenant Protection Tests ========

  private validateCrossTenantProtection(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Different tenant contexts don't share state
    results.push(this.runTest('Cross-Tenant Protection', 'Tenant contexts are isolated', () => {
      let ctxA: string | null = null;
      let ctxB: string | null = null;

      TenantContext.run(this.makeTestContext('protect-a'), () => { ctxA = TenantContext.requireTenantId(); });
      TenantContext.run(this.makeTestContext('protect-b'), () => { ctxB = TenantContext.requireTenantId(); });

      if (ctxA === ctxB) throw new Error('Cross-tenant context leak detected.');
      if (ctxA !== 'protect-a' || ctxB !== 'protect-b') throw new Error('Tenant IDs corrupted.');
    }));

    // Test: System context cannot be set from tenant context
    results.push(this.runTest('Cross-Tenant Protection', 'Tenant cannot escalate to system', () => {
      TenantContext.run(this.makeTestContext('escalation-test'), () => {
        if (TenantContext.isSystemContext()) throw new Error('Non-system context detected as system.');
      });
    }));

    return results;
  }

  // ======== Policy Enforcement Tests ========

  private validatePolicyEnforcement(): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Test: Policy engine creates and evaluates policies
    results.push(this.runTest('Policy Enforcement', 'Policy creation and evaluation', () => {
      const org = tenantLifecycle.createOrganization({
        name: 'Policy Test', slug: `pol-${Date.now()}`, displayName: 'Policy Test',
        tier: 'enterprise', primaryRegion: 'us-east-1', createdBy: 'test',
      });
      policyEngine.createPolicy({
        organizationId: org.id, name: 'Test AI Policy', type: 'ai-usage',
        configuration: { allowedModels: ['gpt-4'], promptSafetyEnabled: true },
        enforcementLevel: 'enforced', createdBy: 'test',
      });

      const policies = policyEngine.listPolicies(org.id, 'ai-usage');
      if (policies.length === 0) throw new Error('Policy not created.');
    }));

    return results;
  }

  // ======== Marketplace Entitlement Tests ========

  private validateMarketplaceEntitlements(): ValidationResult[] {
    const results: ValidationResult[] = [];

    results.push(this.runTest('Marketplace Entitlements', 'Feature entitlement checks work', () => {
      const check = entitlementService.checkFeature('marketplace-access', '__system__');
      if (!check.entitled) throw new Error('System should be entitled to marketplace access.');
    }));

    return results;
  }

  // ======== Test Runner ========

  private runTest(suite: string, test: string, fn: () => void): ValidationResult {
    const start = Date.now();
    try {
      fn();
      return { suite, test, status: 'pass', message: 'OK', details: {}, durationMs: Date.now() - start };
    } catch (err: any) {
      return { suite, test, status: 'fail', message: err.message, details: { stack: err.stack }, durationMs: Date.now() - start };
    }
  }

  private makeTestContext(tenantId: string) {
    return {
      organizationId: `org-${tenantId}`, tenantId, workspaceId: null,
      userId: `user-${tenantId}`, roles: ['member'], tier: 'professional' as const,
      region: 'us-east-1' as const, isolationLevel: 'shared' as const,
      permissions: ['read'], featureFlags: {}, quotas: {
        maxStorageBytes: 1e9, maxAiTokensPerMonth: 1e6, maxApiCallsPerMinute: 300,
        maxConcurrentWorkflows: 10, maxAgents: 10, maxKnowledgeBases: 5, maxPlugins: 20, maxCustomModels: 2,
      },
    };
  }
}

export const multiTenantValidationSuite = MultiTenantValidationSuite.getInstance();
export default multiTenantValidationSuite;
