// src/enterprise/tenant/TenantResolver.ts
// Resolves tenant identity from incoming requests via multiple strategies

import type { TenantDiscoveryResult, TenantStatus, TenantTier, RegionCode } from './types';

// ============================================================================
// Tenant Resolution Strategies
// ============================================================================

export type ResolutionStrategy = 'subdomain' | 'custom-domain' | 'header' | 'jwt' | 'api-key' | 'path';

interface TenantRecord {
  tenantId: string;
  organizationId: string;
  slug: string;
  customDomain: string | null;
  region: RegionCode;
  tier: TenantTier;
  status: TenantStatus;
}

export class TenantResolver {
  private static instance: TenantResolver | null = null;

  // In-memory tenant lookup cache (refreshed from DB periodically)
  private tenantsBySlug: Map<string, TenantRecord> = new Map();
  private tenantsByDomain: Map<string, TenantRecord> = new Map();
  private tenantsById: Map<string, TenantRecord> = new Map();
  private tenantsByApiKey: Map<string, TenantRecord> = new Map();
  private lastRefresh = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minute

  private constructor() {}

  public static getInstance(): TenantResolver {
    if (!TenantResolver.instance) {
      TenantResolver.instance = new TenantResolver();
    }
    return TenantResolver.instance;
  }

  // ---- Cache Management ----

  /**
   * Load/refresh the tenant lookup cache from the database.
   * Called lazily on first resolve or when cache expires.
   */
  public async refreshCache(): Promise<void> {
    try {
      // In production this queries the Organization/Tenant tables via Prisma.
      // For now, seed a default system tenant so the platform boots.
      const systemTenant: TenantRecord = {
        tenantId: '__system__',
        organizationId: '__system__',
        slug: 'system',
        customDomain: null,
        region: 'us-east-1',
        tier: 'enterprise',
        status: 'active',
      };

      // Default tenant for backward compatibility (single-tenant mode)
      const defaultTenant: TenantRecord = {
        tenantId: 'default',
        organizationId: 'default-org',
        slug: 'default',
        customDomain: null,
        region: 'us-east-1',
        tier: 'enterprise',
        status: 'active',
      };

      this.tenantsById.clear();
      this.tenantsBySlug.clear();
      this.tenantsByDomain.clear();

      for (const t of [systemTenant, defaultTenant]) {
        this.tenantsById.set(t.tenantId, t);
        this.tenantsBySlug.set(t.slug, t);
        if (t.customDomain) {
          this.tenantsByDomain.set(t.customDomain, t);
        }
      }

      this.lastRefresh = Date.now();
    } catch (err) {
      console.error('[TenantResolver] Failed to refresh tenant cache:', err);
    }
  }

  /**
   * Register a tenant in the cache (used during provisioning).
   */
  public registerTenant(record: TenantRecord): void {
    this.tenantsById.set(record.tenantId, record);
    this.tenantsBySlug.set(record.slug, record);
    if (record.customDomain) {
      this.tenantsByDomain.set(record.customDomain, record);
    }
  }

  /**
   * Register an API key binding to a tenant.
   */
  public registerApiKey(apiKey: string, tenantId: string): void {
    const tenant = this.tenantsById.get(tenantId);
    if (tenant) {
      this.tenantsByApiKey.set(apiKey, tenant);
    }
  }

  private async ensureCacheReady(): Promise<void> {
    if (Date.now() - this.lastRefresh > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }
  }

  // ---- Resolution Methods ----

  /**
   * Resolve tenant from an HTTP request using a priority chain of strategies.
   */
  public async resolve(request: {
    hostname?: string;
    headers?: Record<string, string | undefined>;
    url?: string;
    jwtClaims?: Record<string, unknown>;
  }): Promise<TenantDiscoveryResult | null> {
    await this.ensureCacheReady();

    // Strategy 1: Explicit header (highest priority — used by internal services)
    const headerTenantId = request.headers?.['x-tenant-id'];
    if (headerTenantId) {
      const result = this.resolveByTenantId(headerTenantId, 'header');
      if (result) return result;
    }

    // Strategy 2: JWT claims (for authenticated requests)
    const jwtTenantId = request.jwtClaims?.tenantId as string | undefined;
    if (jwtTenantId) {
      const result = this.resolveByTenantId(jwtTenantId, 'jwt');
      if (result) return result;
    }

    // Strategy 3: API key
    const apiKey = request.headers?.['x-api-key'] || request.headers?.['authorization']?.replace('Bearer ', '');
    if (apiKey) {
      const result = this.resolveByApiKey(apiKey);
      if (result) return result;
    }

    // Strategy 4: Subdomain (e.g., acme.openclaw.io)
    if (request.hostname) {
      const result = this.resolveBySubdomain(request.hostname);
      if (result) return result;
    }

    // Strategy 5: Custom domain (e.g., ai.acme-corp.com)
    if (request.hostname) {
      const result = this.resolveByCustomDomain(request.hostname);
      if (result) return result;
    }

    // Strategy 6: URL path prefix (e.g., /t/acme-corp/api/...)
    if (request.url) {
      const result = this.resolveByPath(request.url);
      if (result) return result;
    }

    // Fallback: default tenant for backward compatibility
    const defaultTenant = this.tenantsById.get('default');
    if (defaultTenant) {
      return this.toResult(defaultTenant, 'header');
    }

    return null;
  }

  private resolveByTenantId(tenantId: string, strategy: ResolutionStrategy): TenantDiscoveryResult | null {
    const tenant = this.tenantsById.get(tenantId);
    if (!tenant || tenant.status === 'deleted') return null;
    return this.toResult(tenant, strategy);
  }

  private resolveByApiKey(apiKey: string): TenantDiscoveryResult | null {
    const tenant = this.tenantsByApiKey.get(apiKey);
    if (!tenant || tenant.status === 'deleted') return null;
    return this.toResult(tenant, 'api-key');
  }

  private resolveBySubdomain(hostname: string): TenantDiscoveryResult | null {
    // Extract subdomain: "acme.openclaw.io" -> "acme"
    const parts = hostname.split('.');
    if (parts.length < 3) return null;

    const slug = parts[0];
    if (slug === 'www' || slug === 'api' || slug === 'admin') return null;

    const tenant = this.tenantsBySlug.get(slug);
    if (!tenant || tenant.status === 'deleted') return null;
    return this.toResult(tenant, 'subdomain');
  }

  private resolveByCustomDomain(hostname: string): TenantDiscoveryResult | null {
    const tenant = this.tenantsByDomain.get(hostname);
    if (!tenant || tenant.status === 'deleted') return null;
    return this.toResult(tenant, 'custom-domain');
  }

  private resolveByPath(url: string): TenantDiscoveryResult | null {
    // Match /t/{slug}/... pattern
    const match = url.match(/^\/t\/([a-z0-9-]+)\//);
    if (!match) return null;

    const slug = match[1];
    const tenant = this.tenantsBySlug.get(slug);
    if (!tenant || tenant.status === 'deleted') return null;
    return this.toResult(tenant, 'path');
  }

  private toResult(tenant: TenantRecord, resolvedBy: ResolutionStrategy): TenantDiscoveryResult {
    return {
      tenantId: tenant.tenantId,
      organizationId: tenant.organizationId,
      resolvedBy,
      region: tenant.region,
      tier: tenant.tier,
      status: tenant.status,
    };
  }

  /**
   * List all registered tenants (platform admin only).
   */
  public listTenants(): TenantRecord[] {
    return Array.from(this.tenantsById.values());
  }

  /**
   * Get a specific tenant by ID.
   */
  public getTenant(tenantId: string): TenantRecord | null {
    return this.tenantsById.get(tenantId) ?? null;
  }
}

export const tenantResolver = TenantResolver.getInstance();
export default tenantResolver;
