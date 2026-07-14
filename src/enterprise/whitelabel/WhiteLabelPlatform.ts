// src/enterprise/whitelabel/WhiteLabelPlatform.ts
// White-label customization — Branding, themes, custom domains, email templates

// ============================================================================
// White Label Types
// ============================================================================

export interface BrandingConfig {
  tenantId: string;
  organizationId: string;
  // Visual Identity
  logoUrl: string | null;
  logoSmallUrl: string | null;
  faviconUrl: string | null;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  // Theme
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customCss: string | null;
  // Custom Domain
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainCertificateId: string | null;
  // Navigation
  navigationItems: NavigationItem[];
  hideDefaultBranding: boolean;
  // Email
  emailFromName: string;
  emailFromAddress: string | null;
  emailTemplateOverrides: Record<string, string>;
  // Documentation
  helpCenterUrl: string | null;
  supportEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  // Authentication
  loginPageTitle: string;
  loginPageSubtitle: string;
  loginPageBackgroundUrl: string | null;
  ssoButtonLabel: string;
  // Marketplace
  marketplaceName: string;
  marketplaceLogoUrl: string | null;

  updatedAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  visible: boolean;
  position: number;
  children: NavigationItem[];
}

export interface DomainVerification {
  domain: string;
  tenantId: string;
  verificationType: 'dns-txt' | 'dns-cname' | 'meta-tag';
  verificationToken: string;
  verified: boolean;
  verifiedAt: string | null;
  certificateStatus: 'pending' | 'issued' | 'active' | 'expired' | 'failed';
  createdAt: string;
}

// ============================================================================
// White Label Platform
// ============================================================================

export class WhiteLabelPlatform {
  private static instance: WhiteLabelPlatform | null = null;

  private configs: Map<string, BrandingConfig> = new Map();
  private domainVerifications: Map<string, DomainVerification> = new Map();

  private constructor() {}

  public static getInstance(): WhiteLabelPlatform {
    if (!WhiteLabelPlatform.instance) {
      WhiteLabelPlatform.instance = new WhiteLabelPlatform();
    }
    return WhiteLabelPlatform.instance;
  }

  // ======== Branding Configuration ========

  public getOrCreateConfig(tenantId: string, organizationId: string): BrandingConfig {
    const existing = this.configs.get(tenantId);
    if (existing) return existing;

    const defaultConfig: BrandingConfig = {
      tenantId,
      organizationId,
      logoUrl: null,
      logoSmallUrl: null,
      faviconUrl: null,
      primaryColor: '#6366F1',
      secondaryColor: '#8B5CF6',
      accentColor: '#F59E0B',
      backgroundColor: '#0F172A',
      surfaceColor: '#1E293B',
      textColor: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      headingFontFamily: "'Inter', sans-serif",
      theme: 'dark',
      customCss: null,
      customDomain: null,
      customDomainVerified: false,
      customDomainCertificateId: null,
      navigationItems: this.getDefaultNavigation(),
      hideDefaultBranding: false,
      emailFromName: 'AegisOS',
      emailFromAddress: null,
      emailTemplateOverrides: {},
      helpCenterUrl: null,
      supportEmail: null,
      termsUrl: null,
      privacyUrl: null,
      loginPageTitle: 'Welcome',
      loginPageSubtitle: 'Sign in to your workspace',
      loginPageBackgroundUrl: null,
      ssoButtonLabel: 'Sign in with SSO',
      marketplaceName: 'Marketplace',
      marketplaceLogoUrl: null,
      updatedAt: new Date().toISOString(),
    };

    this.configs.set(tenantId, defaultConfig);
    return defaultConfig;
  }

  public updateBranding(tenantId: string, updates: Partial<BrandingConfig>): BrandingConfig {
    const config = this.configs.get(tenantId);
    if (!config) throw new Error(`No branding config for tenant ${tenantId}.`);

    // Apply allowed updates
    const allowedFields: (keyof BrandingConfig)[] = [
      'logoUrl', 'logoSmallUrl', 'faviconUrl',
      'primaryColor', 'secondaryColor', 'accentColor',
      'backgroundColor', 'surfaceColor', 'textColor',
      'fontFamily', 'headingFontFamily', 'theme', 'customCss',
      'navigationItems', 'hideDefaultBranding',
      'emailFromName', 'emailFromAddress', 'emailTemplateOverrides',
      'helpCenterUrl', 'supportEmail', 'termsUrl', 'privacyUrl',
      'loginPageTitle', 'loginPageSubtitle', 'loginPageBackgroundUrl',
      'ssoButtonLabel', 'marketplaceName', 'marketplaceLogoUrl',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (config as any)[field] = updates[field];
      }
    }

    config.updatedAt = new Date().toISOString();
    console.log(`[WhiteLabelPlatform] Updated branding for tenant ${tenantId}`);
    return config;
  }

  /**
   * Generate CSS variables from branding config for injection into the UI.
   */
  public generateCssVariables(tenantId: string): string {
    const config = this.configs.get(tenantId);
    if (!config) return '';

    return `:root {
  --brand-primary: ${config.primaryColor};
  --brand-secondary: ${config.secondaryColor};
  --brand-accent: ${config.accentColor};
  --brand-bg: ${config.backgroundColor};
  --brand-surface: ${config.surfaceColor};
  --brand-text: ${config.textColor};
  --brand-font: ${config.fontFamily};
  --brand-heading-font: ${config.headingFontFamily};
}${config.customCss ? '\n' + config.customCss : ''}`;
  }

  // ======== Custom Domain Management ========

  public requestDomainVerification(tenantId: string, domain: string): DomainVerification {
    const verification: DomainVerification = {
      domain,
      tenantId,
      verificationType: 'dns-txt',
      verificationToken: `aegisos-verify-${crypto.randomUUID().slice(0, 12)}`,
      verified: false,
      verifiedAt: null,
      certificateStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.domainVerifications.set(domain, verification);
    console.log(`[WhiteLabelPlatform] Domain verification requested: ${domain}. Add TXT record: ${verification.verificationToken}`);
    return verification;
  }

  public verifyDomain(domain: string): DomainVerification {
    const verification = this.domainVerifications.get(domain);
    if (!verification) throw new Error(`No verification pending for domain ${domain}.`);

    // In production: perform actual DNS lookup for TXT record
    verification.verified = true;
    verification.verifiedAt = new Date().toISOString();
    verification.certificateStatus = 'active';

    // Update branding config
    const config = this.configs.get(verification.tenantId);
    if (config) {
      config.customDomain = domain;
      config.customDomainVerified = true;
      config.updatedAt = new Date().toISOString();
    }

    console.log(`[WhiteLabelPlatform] Domain verified: ${domain}`);
    return verification;
  }

  // ======== Email Templates ========

  public getEmailTemplate(tenantId: string, templateType: string): string {
    const config = this.configs.get(tenantId);
    if (config?.emailTemplateOverrides[templateType]) {
      return config.emailTemplateOverrides[templateType];
    }

    // Default templates
    const defaults: Record<string, string> = {
      'invitation': '<h1>You\'ve been invited to {{orgName}}</h1><p>{{inviterName}} has invited you to join {{orgName}}. Click below to accept.</p>',
      'welcome': '<h1>Welcome to {{orgName}}</h1><p>Your account has been created. Get started by exploring your workspace.</p>',
      'password-reset': '<h1>Reset Your Password</h1><p>Click the link below to reset your password. This link expires in 1 hour.</p>',
      'usage-alert': '<h1>Usage Alert</h1><p>Your {{metric}} usage has reached {{percentage}}% of your plan limit.</p>',
      'invoice': '<h1>Invoice {{invoiceNumber}}</h1><p>Your invoice for {{period}} is ready. Total: ${{amount}}</p>',
    };

    return defaults[templateType] ?? `<p>Template "${templateType}" not configured.</p>`;
  }

  // ======== Default Navigation ========

  private getDefaultNavigation(): NavigationItem[] {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: 'home', url: '/', visible: true, position: 0, children: [] },
      { id: 'workspaces', label: 'Workspaces', icon: 'folder', url: '/workspaces', visible: true, position: 1, children: [] },
      { id: 'ai', label: 'AI', icon: 'brain', url: '/ai', visible: true, position: 2, children: [] },
      { id: 'knowledge', label: 'Knowledge', icon: 'book', url: '/knowledge', visible: true, position: 3, children: [] },
      { id: 'workflows', label: 'Workflows', icon: 'workflow', url: '/workflows', visible: true, position: 4, children: [] },
      { id: 'marketplace', label: 'Marketplace', icon: 'store', url: '/marketplace', visible: true, position: 5, children: [] },
      { id: 'analytics', label: 'Analytics', icon: 'chart', url: '/analytics', visible: true, position: 6, children: [] },
      { id: 'admin', label: 'Admin', icon: 'settings', url: '/admin', visible: true, position: 7, children: [] },
    ];
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      configuredTenants: this.configs.size,
      customDomains: Array.from(this.configs.values()).filter(c => c.customDomain).length,
      verifiedDomains: Array.from(this.domainVerifications.values()).filter(v => v.verified).length,
      customThemes: Array.from(this.configs.values()).filter(c => c.theme === 'custom' || c.customCss).length,
    };
  }
}

export const whiteLabelPlatform = WhiteLabelPlatform.getInstance();
export default whiteLabelPlatform;
