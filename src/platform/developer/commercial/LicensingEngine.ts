// src/platform/developer/commercial/LicensingEngine.ts

import { developerPlatform } from '../DeveloperPlatform';
import { LicenseEntitlement } from '../types';
import { licenseEngine, entitlementService, usageMeteringEngine } from '../../../enterprise';

export class LicensingEngine {
  private static instance: LicensingEngine | null = null;

  private constructor() {}

  public static getInstance(): LicensingEngine {
    if (!LicensingEngine.instance) {
      LicensingEngine.instance = new LicensingEngine();
    }
    return LicensingEngine.instance;
  }

  /**
   * Registers a tenant entitlement license key.
   */
  public activateLicense(tenantId: string, licenseKey: string): LicenseEntitlement {
    // Delegate to Enterprise LicenseEngine
    const activation = licenseEngine.activateLicense(licenseKey, {
      tenantId,
      activatedBy: 'developer-platform',
    });

    const license = licenseEngine.getLicense(activation.licenseId);
    if (!license) {
      throw new Error("Activation Failed: License could not be retrieved after activation.");
    }

    const entitlement: LicenseEntitlement = {
      tenantId,
      licenseKey,
      tier: license.tier as any,
      status: "active",
      expiresAt: license.expiresAt,
      features: license.features,
      usageLimits: license.usageLimits,
    };

    developerPlatform.registerEntitlement(entitlement);
    return entitlement;
  }

  /**
   * Verifies if a tenant has access to a particular feature or execution permission.
   */
  public checkEntitlement(tenantId: string, featureName: string): boolean {
    // Check via Enterprise EntitlementService
    const check = entitlementService.checkFeature(featureName, tenantId);
    return check.entitled;
  }

  /**
   * Records usage counts for billing metering.
   */
  public reportUsageCharge(tenantId: string, itemId: string, metricName: string, quantity = 1): void {
    // Record via Enterprise UsageMeteringEngine
    usageMeteringEngine.record({
      tenantId,
      category: 'compute', // Default category for developer extensions
      metric: metricName,
      quantity,
      metadata: { itemId },
    });

    developerPlatform.recordUsage({
      id: `usage-${Math.random().toString(36).slice(2, 9)}`,
      tenantId,
      itemId,
      metricName,
      quantity,
      timestamp: new Date().toISOString()
    });
  }
}

export const licensingEngine = LicensingEngine.getInstance();
export default licensingEngine;
