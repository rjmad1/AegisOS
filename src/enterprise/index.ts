// src/enterprise/index.ts
// Enterprise SaaS Platform — Barrel Export

// ============================================================================
// Tenant Management
// ============================================================================
export { TenantContext, SYSTEM_TENANT_ID } from './tenant/TenantContext';
export { tenantResolver } from './tenant/TenantResolver';
export { tenantLifecycle } from './tenant/TenantLifecycle';
export { tenantScopeMiddleware, applyTenantScope, injectTenantData, requireTenantScope, getCurrentTenantFilter } from './tenant/TenantScopedPrisma';
export * from './tenant/types';

// ============================================================================
// Identity & Access Management
// ============================================================================
export { identityPlatform } from './identity/IdentityPlatform';
export { RoleHierarchyService, ENTERPRISE_ROLE_HIERARCHY } from './identity/RoleHierarchy';
export { policyEngine } from './identity/PolicyEngine';
export * from './identity/types';

// ============================================================================
// Administration
// ============================================================================
export { enterpriseAdminCenter } from './admin/EnterpriseAdminCenter';
export { tenantConsole } from './admin/TenantConsole';
export { workspaceConsole } from './admin/WorkspaceConsole';

// ============================================================================
// Licensing & Subscriptions
// ============================================================================
export { licenseEngine } from './licensing/LicenseEngine';
export { subscriptionManager } from './licensing/SubscriptionManager';
export { entitlementService } from './licensing/EntitlementService';

// ============================================================================
// Billing & FinOps
// ============================================================================
export { usageMeteringEngine } from './billing/UsageMeteringEngine';
export { billingEngine } from './billing/BillingEngine';
export { finOpsPlatform } from './billing/FinOpsPlatform';

// ============================================================================
// Governance & Compliance
// ============================================================================
export { governanceCenter } from './governance/GovernanceCenter';
export { dataIsolation } from './governance/DataIsolation';

// ============================================================================
// White-Label & Branding
// ============================================================================
export { whiteLabelPlatform } from './whitelabel/WhiteLabelPlatform';

// ============================================================================
// Enterprise Features
// ============================================================================
export { enterpriseFeatures } from './features/EnterpriseFeatures';

// ============================================================================
// Analytics
// ============================================================================
export { analyticsPlatform } from './analytics/AnalyticsPlatform';

// ============================================================================
// Validation
// ============================================================================
export { multiTenantValidationSuite } from './validation/MultiTenantValidationSuite';

// ============================================================================
// Performance, Benchmarking & Caching
// ============================================================================
export { multiLevelCacheFramework } from './performance/MultiLevelCacheFramework';
export { databaseOptimizationEngine } from './performance/DatabaseOptimizationEngine';
export { gpuOptimizationPlatform } from './performance/GPUOptimizationPlatform';
export { aiRuntimeOptimizer } from './performance/AIRuntimeOptimizer';
export { knowledgeOptimizationPlatform } from './performance/KnowledgeOptimizationPlatform';
export { loadTestingFramework } from './performance/LoadTestingFramework';
export { scalabilityValidationPlatform } from './performance/ScalabilityValidationPlatform';
export { capacityPlanningEngine } from './performance/CapacityPlanningEngine';
export { costOptimizationPlatform } from './performance/CostOptimizationPlatform';
export { performanceRegressionFramework } from './performance/PerformanceRegressionFramework';
export { enterprisePerformancePlatform } from './performance/EnterprisePerformancePlatform';

// ============================================================================
// Performance Dashboards & Operations Reports
// ============================================================================
export { benchmarkDashboard } from './operations/BenchmarkDashboard';
export { capacityDashboard } from './operations/CapacityDashboard';
export { finOpsDashboard } from './operations/FinOpsDashboard';
export { performanceTechnicalDebtRegister } from './operations/PerformanceTechnicalDebtRegister';
export { performanceReadinessReport } from './operations/PerformanceReadinessReport';
export { scalabilityReport } from './operations/ScalabilityReport';
export { costOptimizationReport } from './operations/CostOptimizationReport';

// ============================================================================
// Performance Validation & Certification
// ============================================================================
export { performanceValidationSuite } from './validation/PerformanceValidationSuite';
export { enterprisePerformanceCertification } from './validation/EnterprisePerformanceCertification';

// ============================================================================
// API Gateway (Primary Entry Point)
// ============================================================================
export { enterpriseAPI } from './api/EnterpriseAPI';
