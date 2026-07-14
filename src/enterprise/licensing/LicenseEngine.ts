// src/enterprise/licensing/LicenseEngine.ts
// Enterprise License Management — Full license lifecycle

import type { TenantTier } from '../tenant/types';

// ============================================================================
// License Types
// ============================================================================

export type LicenseType = 'trial' | 'subscription' | 'enterprise' | 'offline' | 'usage' | 'floating' | 'node';
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked' | 'pending-activation';

export interface License {
  id: string;
  organizationId: string;
  tenantId: string;
  licenseKey: string;
  type: LicenseType;
  tier: TenantTier;
  status: LicenseStatus;
  seats: number;                    // Max concurrent users (0 = unlimited)
  nodes: number;                    // Max deployment nodes (0 = unlimited)
  features: string[];               // Entitled feature IDs
  usageLimits: Record<string, number>;
  activatedAt: string | null;
  expiresAt: string;
  renewalDate: string | null;
  offlineCapable: boolean;
  hardwareFingerprint: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseActivation {
  id: string;
  licenseId: string;
  tenantId: string;
  activatedBy: string;
  activationCode: string;
  hardwareFingerprint: string | null;
  ipAddress: string | null;
  activatedAt: string;
  deactivatedAt: string | null;
}

export interface LicenseValidation {
  valid: boolean;
  license: License | null;
  reason: string | null;
  features: string[];
  expiresIn: number;                // Milliseconds until expiry
  seatsUsed: number;
  seatsRemaining: number;
}

// ============================================================================
// Feature Catalog
// ============================================================================

const TIER_FEATURES: Record<TenantTier, string[]> = {
  free: [
    'ai-basic', 'knowledge-basic', 'workflows-basic', 'artifacts-basic',
    'community-support',
  ],
  professional: [
    'ai-basic', 'ai-advanced', 'knowledge-basic', 'knowledge-advanced',
    'workflows-basic', 'workflows-advanced', 'artifacts-basic', 'artifacts-advanced',
    'marketplace-access', 'api-access', 'standard-support',
  ],
  business: [
    'ai-basic', 'ai-advanced', 'ai-enterprise', 'knowledge-basic', 'knowledge-advanced',
    'workflows-basic', 'workflows-advanced', 'workflows-enterprise',
    'artifacts-basic', 'artifacts-advanced',
    'marketplace-access', 'marketplace-publish', 'api-access', 'api-advanced',
    'sso-integration', 'audit-export', 'custom-roles',
    'business-support',
  ],
  enterprise: [
    'ai-basic', 'ai-advanced', 'ai-enterprise', 'ai-custom-models',
    'knowledge-basic', 'knowledge-advanced', 'knowledge-enterprise',
    'workflows-basic', 'workflows-advanced', 'workflows-enterprise',
    'artifacts-basic', 'artifacts-advanced',
    'marketplace-access', 'marketplace-publish', 'marketplace-private',
    'api-access', 'api-advanced', 'api-unlimited',
    'sso-integration', 'audit-export', 'custom-roles',
    'white-label', 'custom-domains', 'dedicated-support',
    'cross-region-replication', 'advanced-governance',
    'enterprise-support', 'sla-guarantee',
  ],
  custom: [
    'all-features', // Custom tier gets everything plus custom agreements
  ],
};

// ============================================================================
// License Engine
// ============================================================================

export class LicenseEngine {
  private static instance: LicenseEngine | null = null;

  private licenses: Map<string, License> = new Map();
  private activations: Map<string, LicenseActivation[]> = new Map();
  private activeSeats: Map<string, Set<string>> = new Map(); // licenseId -> Set<userId>

  private constructor() {}

  public static getInstance(): LicenseEngine {
    if (!LicenseEngine.instance) {
      LicenseEngine.instance = new LicenseEngine();
    }
    return LicenseEngine.instance;
  }

  // ======== License Creation ========

  public createLicense(params: {
    organizationId: string;
    tenantId: string;
    type: LicenseType;
    tier: TenantTier;
    seats?: number;
    nodes?: number;
    durationDays: number;
    customFeatures?: string[];
    customUsageLimits?: Record<string, number>;
    offlineCapable?: boolean;
  }): License {
    const licenseKey = this.generateLicenseKey(params.type, params.tier);
    const features = params.customFeatures ?? TIER_FEATURES[params.tier] ?? [];

    const defaultUsageLimits: Record<TenantTier, Record<string, number>> = {
      free:         { 'api-calls-per-min': 60,   'ai-tokens-per-month': 100_000,     'storage-gb': 1    },
      professional: { 'api-calls-per-min': 300,  'ai-tokens-per-month': 1_000_000,   'storage-gb': 10   },
      business:     { 'api-calls-per-min': 1000, 'ai-tokens-per-month': 10_000_000,  'storage-gb': 100  },
      enterprise:   { 'api-calls-per-min': 5000, 'ai-tokens-per-month': 100_000_000, 'storage-gb': 1000 },
      custom:       { 'api-calls-per-min': 9999, 'ai-tokens-per-month': 999_999_999, 'storage-gb': 9999 },
    };

    const license: License = {
      id: `lic-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      licenseKey,
      type: params.type,
      tier: params.tier,
      status: params.type === 'trial' ? 'active' : 'pending-activation',
      seats: params.seats ?? (params.tier === 'enterprise' ? 0 : params.tier === 'business' ? 100 : 25),
      nodes: params.nodes ?? 0,
      features,
      usageLimits: params.customUsageLimits ?? defaultUsageLimits[params.tier],
      activatedAt: params.type === 'trial' ? new Date().toISOString() : null,
      expiresAt: new Date(Date.now() + params.durationDays * 24 * 60 * 60 * 1000).toISOString(),
      renewalDate: null,
      offlineCapable: params.offlineCapable ?? false,
      hardwareFingerprint: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.licenses.set(license.id, license);
    this.activeSeats.set(license.id, new Set());
    console.log(`[LicenseEngine] Created ${params.type} license: ${license.licenseKey} (${params.tier} tier)`);
    return license;
  }

  // ======== License Activation ========

  public activateLicense(licenseKey: string, params: {
    tenantId: string;
    activatedBy: string;
    hardwareFingerprint?: string;
    ipAddress?: string;
  }): LicenseActivation {
    const license = this.findByKey(licenseKey);
    if (!license) throw new Error(`License key not found: ${licenseKey}`);
    if (license.status === 'revoked') throw new Error('License has been revoked.');
    if (license.status === 'expired') throw new Error('License has expired.');
    if (new Date(license.expiresAt) < new Date()) {
      license.status = 'expired';
      throw new Error('License has expired.');
    }

    // Node license: check hardware fingerprint
    if (license.type === 'node' && license.hardwareFingerprint) {
      if (params.hardwareFingerprint !== license.hardwareFingerprint) {
        throw new Error('Hardware fingerprint mismatch for node license.');
      }
    }

    license.status = 'active';
    license.activatedAt = new Date().toISOString();
    license.hardwareFingerprint = params.hardwareFingerprint ?? null;
    license.updatedAt = new Date().toISOString();

    const activation: LicenseActivation = {
      id: `act-${crypto.randomUUID()}`,
      licenseId: license.id,
      tenantId: params.tenantId,
      activatedBy: params.activatedBy,
      activationCode: crypto.randomUUID().slice(0, 8).toUpperCase(),
      hardwareFingerprint: params.hardwareFingerprint ?? null,
      ipAddress: params.ipAddress ?? null,
      activatedAt: new Date().toISOString(),
      deactivatedAt: null,
    };

    const existing = this.activations.get(license.id) ?? [];
    existing.push(activation);
    this.activations.set(license.id, existing);

    console.log(`[LicenseEngine] Activated license: ${licenseKey}`);
    return activation;
  }

  // ======== License Validation ========

  public validate(tenantId: string): LicenseValidation {
    const license = this.findActiveLicenseForTenant(tenantId);
    if (!license) {
      return {
        valid: false, license: null, reason: 'No active license found for this tenant.',
        features: TIER_FEATURES.free, expiresIn: 0, seatsUsed: 0, seatsRemaining: 0,
      };
    }

    if (license.status !== 'active') {
      return {
        valid: false, license, reason: `License is ${license.status}.`,
        features: TIER_FEATURES.free, expiresIn: 0, seatsUsed: 0, seatsRemaining: 0,
      };
    }

    const expiresIn = new Date(license.expiresAt).getTime() - Date.now();
    if (expiresIn <= 0) {
      license.status = 'expired';
      return {
        valid: false, license, reason: 'License has expired.',
        features: TIER_FEATURES.free, expiresIn: 0, seatsUsed: 0, seatsRemaining: 0,
      };
    }

    const seats = this.activeSeats.get(license.id) ?? new Set();
    const seatsUsed = seats.size;
    const seatsRemaining = license.seats === 0 ? Infinity : license.seats - seatsUsed;

    return {
      valid: true, license, reason: null,
      features: license.features,
      expiresIn, seatsUsed,
      seatsRemaining: seatsRemaining === Infinity ? -1 : seatsRemaining,
    };
  }

  /**
   * Check if a tenant is entitled to a specific feature.
   */
  public checkFeatureEntitlement(tenantId: string, feature: string): boolean {
    const validation = this.validate(tenantId);
    if (!validation.valid) return TIER_FEATURES.free.includes(feature);
    if (validation.features.includes('all-features')) return true;
    return validation.features.includes(feature);
  }

  // ======== Seat Management (Floating License) ========

  public acquireSeat(licenseId: string, userId: string): boolean {
    const license = this.licenses.get(licenseId);
    if (!license || license.status !== 'active') return false;

    const seats = this.activeSeats.get(licenseId) ?? new Set();
    if (license.seats > 0 && seats.size >= license.seats) {
      return false; // No seats available
    }
    seats.add(userId);
    this.activeSeats.set(licenseId, seats);
    return true;
  }

  public releaseSeat(licenseId: string, userId: string): void {
    const seats = this.activeSeats.get(licenseId);
    if (seats) seats.delete(userId);
  }

  // ======== License Renewal & Revocation ========

  public renewLicense(licenseId: string, durationDays: number): License {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error(`License ${licenseId} not found.`);

    license.expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    license.renewalDate = new Date().toISOString();
    license.status = 'active';
    license.updatedAt = new Date().toISOString();

    console.log(`[LicenseEngine] Renewed license ${licenseId} for ${durationDays} days`);
    return license;
  }

  public revokeLicense(licenseId: string, reason: string): void {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error(`License ${licenseId} not found.`);

    license.status = 'revoked';
    license.metadata = { ...license.metadata, revocationReason: reason };
    license.updatedAt = new Date().toISOString();

    console.log(`[LicenseEngine] Revoked license ${licenseId}. Reason: ${reason}`);
  }

  // ======== Queries ========

  public getLicense(id: string): License | null {
    return this.licenses.get(id) ?? null;
  }

  public listLicenses(organizationId: string): License[] {
    return Array.from(this.licenses.values()).filter(l => l.organizationId === organizationId);
  }

  public findActiveLicenseForTenant(tenantId: string): License | null {
    for (const license of this.licenses.values()) {
      if (license.tenantId === tenantId && license.status === 'active') return license;
    }
    return null;
  }

  private findByKey(key: string): License | null {
    for (const license of this.licenses.values()) {
      if (license.licenseKey === key) return license;
    }
    return null;
  }

  // ======== Key Generation ========

  private generateLicenseKey(type: LicenseType, tier: TenantTier): string {
    const prefix = 'LIC-AEGISOS';
    const typeCode = type.toUpperCase().slice(0, 4);
    const tierCode = tier.toUpperCase().slice(0, 4);
    const segments = Array.from({ length: 3 }, () =>
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
    return `${prefix}-${typeCode}-${tierCode}-${segments.join('-')}`;
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    const all = Array.from(this.licenses.values());
    return {
      totalLicenses: all.length,
      activeLicenses: all.filter(l => l.status === 'active').length,
      expiredLicenses: all.filter(l => l.status === 'expired').length,
      trialLicenses: all.filter(l => l.type === 'trial').length,
      enterpriseLicenses: all.filter(l => l.type === 'enterprise').length,
      totalSeatsAllocated: all.reduce((sum, l) => sum + l.seats, 0),
    };
  }
}

export const licenseEngine = LicenseEngine.getInstance();
export default licenseEngine;
