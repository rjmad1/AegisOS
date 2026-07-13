// src/enterprise/identity/PolicyEngine.ts
// Tenant-scoped policy evaluation engine

import type { OrganizationPolicy, OrganizationPolicyType } from './types';
import { TenantContext } from '../tenant/TenantContext';

// ============================================================================
// Policy Engine — Evaluates organization, tenant, and workspace policies
// ============================================================================

export interface PolicyEvaluationResult {
  allowed: boolean;
  policy: string | null;
  reason: string | null;
  enforcementLevel: 'advisory' | 'enforced' | 'strict' | null;
}

export interface PolicyCheck {
  type: OrganizationPolicyType;
  action: string;
  context: Record<string, unknown>;
}

export class PolicyEngine {
  private static instance: PolicyEngine | null = null;
  private policies: Map<string, OrganizationPolicy> = new Map();

  private constructor() {}

  public static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  // ======== Policy Management ========

  public createPolicy(params: {
    organizationId: string;
    name: string;
    type: OrganizationPolicyType;
    configuration: Record<string, unknown>;
    enforcementLevel?: 'advisory' | 'enforced' | 'strict';
    createdBy: string;
  }): OrganizationPolicy {
    const policy: OrganizationPolicy = {
      id: `pol-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      name: params.name,
      type: params.type,
      enabled: true,
      configuration: params.configuration,
      enforcementLevel: params.enforcementLevel ?? 'enforced',
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(policy.id, policy);
    console.log(`[PolicyEngine] Created policy: ${policy.name} (${policy.type}) for org ${params.organizationId}`);
    return policy;
  }

  public updatePolicy(policyId: string, updates: Partial<Pick<OrganizationPolicy, 'name' | 'enabled' | 'configuration' | 'enforcementLevel'>>): OrganizationPolicy {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found.`);

    if (updates.name !== undefined) policy.name = updates.name;
    if (updates.enabled !== undefined) policy.enabled = updates.enabled;
    if (updates.configuration !== undefined) policy.configuration = updates.configuration;
    if (updates.enforcementLevel !== undefined) policy.enforcementLevel = updates.enforcementLevel;
    policy.updatedAt = new Date().toISOString();

    return policy;
  }

  public listPolicies(organizationId: string, type?: OrganizationPolicyType): OrganizationPolicy[] {
    return Array.from(this.policies.values()).filter(p =>
      p.organizationId === organizationId && (!type || p.type === type)
    );
  }

  // ======== Policy Evaluation ========

  /**
   * Evaluate whether an action is allowed under the current tenant's policies.
   */
  public evaluate(check: PolicyCheck): PolicyEvaluationResult {
    const ctx = TenantContext.current();
    if (!ctx || TenantContext.isSystemContext()) {
      return { allowed: true, policy: null, reason: null, enforcementLevel: null };
    }

    const orgPolicies = this.listPolicies(ctx.organizationId, check.type).filter(p => p.enabled);
    if (orgPolicies.length === 0) {
      return { allowed: true, policy: null, reason: null, enforcementLevel: null };
    }

    for (const policy of orgPolicies) {
      const result = this.evaluatePolicy(policy, check);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true, policy: null, reason: null, enforcementLevel: null };
  }

  private evaluatePolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const config = policy.configuration;

    switch (policy.type) {
      case 'authentication':
        return this.evaluateAuthPolicy(policy, check);
      case 'network':
        return this.evaluateNetworkPolicy(policy, check);
      case 'data-classification':
        return this.evaluateDataClassificationPolicy(policy, check);
      case 'ai-usage':
        return this.evaluateAiPolicy(policy, check);
      case 'retention':
        return this.evaluateRetentionPolicy(policy, check);
      case 'marketplace':
        return this.evaluateMarketplacePolicy(policy, check);
      case 'security':
        return this.evaluateSecurityPolicy(policy, check);
      default:
        return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
    }
  }

  private evaluateAuthPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const config = policy.configuration;

    // Enforce MFA requirement
    if (config.mfaRequired && check.context.mfaVerified !== true) {
      return {
        allowed: policy.enforcementLevel === 'advisory',
        policy: policy.name,
        reason: 'Multi-factor authentication is required by organization policy.',
        enforcementLevel: policy.enforcementLevel,
      };
    }

    // Enforce session duration
    const maxSessionHours = config.maxSessionDurationHours as number | undefined;
    if (maxSessionHours && check.context.sessionAgeHours) {
      if ((check.context.sessionAgeHours as number) > maxSessionHours) {
        return {
          allowed: false,
          policy: policy.name,
          reason: `Session has exceeded the maximum duration of ${maxSessionHours} hours.`,
          enforcementLevel: policy.enforcementLevel,
        };
      }
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateNetworkPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const allowedIps = policy.configuration.allowedIps as string[] | undefined;
    if (allowedIps && allowedIps.length > 0 && check.context.clientIp) {
      const clientIp = check.context.clientIp as string;
      if (!allowedIps.includes(clientIp) && !allowedIps.some(cidr => this.matchCidr(clientIp, cidr))) {
        return {
          allowed: false,
          policy: policy.name,
          reason: `Access denied: IP ${clientIp} is not in the organization's allowlist.`,
          enforcementLevel: policy.enforcementLevel,
        };
      }
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateDataClassificationPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const minClassification = policy.configuration.minimumClassification as string | undefined;
    const resourceClassification = check.context.dataClassification as string | undefined;

    if (minClassification && resourceClassification) {
      const levels: Record<string, number> = { public: 0, internal: 1, confidential: 2, restricted: 3 };
      if ((levels[resourceClassification] ?? 0) < (levels[minClassification] ?? 0)) {
        return {
          allowed: false,
          policy: policy.name,
          reason: `Data classification "${resourceClassification}" does not meet the minimum "${minClassification}" required by policy.`,
          enforcementLevel: policy.enforcementLevel,
        };
      }
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateAiPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const config = policy.configuration;

    // Enforce allowed models
    const allowedModels = config.allowedModels as string[] | undefined;
    if (allowedModels && check.context.modelId) {
      if (!allowedModels.includes(check.context.modelId as string)) {
        return {
          allowed: false,
          policy: policy.name,
          reason: `Model "${check.context.modelId}" is not in the approved model list.`,
          enforcementLevel: policy.enforcementLevel,
        };
      }
    }

    // Enforce prompt safety
    if (config.promptSafetyEnabled && check.context.promptText) {
      const blockedPatterns = config.blockedPromptPatterns as string[] | undefined;
      if (blockedPatterns) {
        for (const pattern of blockedPatterns) {
          if (new RegExp(pattern, 'i').test(check.context.promptText as string)) {
            return {
              allowed: false,
              policy: policy.name,
              reason: `Prompt contains content blocked by AI usage policy.`,
              enforcementLevel: policy.enforcementLevel,
            };
          }
        }
      }
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateRetentionPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    // Retention policies are evaluated differently (during cleanup jobs)
    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateMarketplacePolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const config = policy.configuration;

    // Enforce approved publishers
    const approvedPublishers = config.approvedPublishers as string[] | undefined;
    if (approvedPublishers && check.context.publisherId) {
      if (!approvedPublishers.includes(check.context.publisherId as string)) {
        return {
          allowed: false,
          policy: policy.name,
          reason: `Publisher "${check.context.publisherId}" is not approved by organization policy.`,
          enforcementLevel: policy.enforcementLevel,
        };
      }
    }

    // Enforce approval workflow
    if (config.requireApproval && !check.context.isApproved) {
      return {
        allowed: false,
        policy: policy.name,
        reason: 'Marketplace installations require admin approval.',
        enforcementLevel: policy.enforcementLevel,
      };
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  private evaluateSecurityPolicy(policy: OrganizationPolicy, check: PolicyCheck): PolicyEvaluationResult {
    const config = policy.configuration;

    if (config.requireEncryption && check.context.isEncrypted === false) {
      return {
        allowed: false,
        policy: policy.name,
        reason: 'Data encryption is required by security policy.',
        enforcementLevel: policy.enforcementLevel,
      };
    }

    return { allowed: true, policy: policy.name, reason: null, enforcementLevel: policy.enforcementLevel };
  }

  // ======== Helpers ========

  private matchCidr(ip: string, cidr: string): boolean {
    // Simplified CIDR matching; production should use a proper library
    if (!cidr.includes('/')) return ip === cidr;
    const [network] = cidr.split('/');
    return ip.startsWith(network.split('.').slice(0, 3).join('.'));
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      totalPolicies: this.policies.size,
      enabledPolicies: Array.from(this.policies.values()).filter(p => p.enabled).length,
      enforcedPolicies: Array.from(this.policies.values()).filter(p => p.enforcementLevel === 'enforced' || p.enforcementLevel === 'strict').length,
    };
  }
}

export const policyEngine = PolicyEngine.getInstance();
export default policyEngine;
