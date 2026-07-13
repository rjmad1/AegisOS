import { TenantContext } from '../enterprise/tenant/TenantContext';
import { licenseEngine } from '../enterprise/licensing/LicenseEngine';

export interface PlatformLicense {
  edition: string;
  version: string;
  expiryDate: string;
  allowedSeats: number;
  features: string[];
  registeredTo: string;
  licenseKey: string;
}

export class LicenseRepository {
  async getLicense(): Promise<PlatformLicense> {
    const ctx = TenantContext.current();
    if (ctx && ctx.tenantId !== '__system__') {
      const activeLicense = licenseEngine.findActiveLicenseForTenant(ctx.tenantId);
      if (activeLicense) {
        return {
          edition: `Enterprise SaaS License (${activeLicense.tier})`,
          version: '10.2.4-stable',
          expiryDate: activeLicense.expiresAt,
          allowedSeats: activeLicense.seats,
          features: activeLicense.features,
          registeredTo: ctx.organizationId,
          licenseKey: activeLicense.licenseKey,
        };
      }
    }

    return {
      edition: 'Enterprise Governance Edition',
      version: '10.2.4-stable',
      expiryDate: '2028-12-31T23:59:59Z',
      allowedSeats: 15,
      features: [
        'Secure Vault Secrets Manager',
        'Automatic Caddy Reverse Proxy & TLS Routing',
        'Automated SCM Job Scheduler',
        'Physical Storage Telemetry Diagnostics',
        'Role-Based Matrix Access Control (RBAC)',
        'Governance System Inventory Auditing'
      ],
      registeredTo: 'Enterprise Administration Consortium',
      licenseKey: 'LIC-ENT-2026-OPCLAW-GOV-9824-7128-403X'
    };
  }
}

export const licenseRepository = new LicenseRepository();
