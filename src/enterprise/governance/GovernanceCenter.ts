// src/enterprise/governance/GovernanceCenter.ts
// Enterprise Governance Center — Centralized policy management and compliance

import { policyEngine } from '../identity/PolicyEngine';
import type { OrganizationPolicyType, OrganizationPolicy } from '../identity/types';

// ============================================================================
// Governance Types
// ============================================================================

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  controls: ComplianceControl[];
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  lastAssessedAt: string | null;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  evidence: string[];
  remediationSteps: string[];
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  type: 'extension-install' | 'model-deploy' | 'data-export' | 'role-change' | 'policy-change';
  requestedBy: string;
  approvers: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  details: Record<string, unknown>;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface RetentionRule {
  id: string;
  organizationId: string;
  tenantId: string | null;
  resourceType: string;
  retentionDays: number;
  action: 'archive' | 'delete' | 'notify';
  legalHold: boolean;
  enabled: boolean;
  createdAt: string;
}

// ============================================================================
// Governance Center
// ============================================================================

export class GovernanceCenter {
  private static instance: GovernanceCenter | null = null;

  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private retentionRules: Map<string, RetentionRule> = new Map();
  private frameworks: Map<string, ComplianceFramework> = new Map();

  private constructor() {
    this.initializeComplianceFrameworks();
  }

  public static getInstance(): GovernanceCenter {
    if (!GovernanceCenter.instance) {
      GovernanceCenter.instance = new GovernanceCenter();
    }
    return GovernanceCenter.instance;
  }

  // ======== Policy Templates ========

  public getAvailablePolicyTemplates(): Array<{
    name: string; type: OrganizationPolicyType; description: string;
    defaultConfig: Record<string, unknown>;
  }> {
    return [
      {
        name: 'SOC2 Authentication Policy', type: 'authentication',
        description: 'Enforce MFA, session limits, and password complexity per SOC2 requirements.',
        defaultConfig: { mfaRequired: true, maxSessionDurationHours: 4, passwordMinLength: 14, requireSpecialChars: true },
      },
      {
        name: 'HIPAA Data Classification Policy', type: 'data-classification',
        description: 'Enforce minimum data classification and handling for HIPAA compliance.',
        defaultConfig: { minimumClassification: 'confidential', allowExternalSharing: false, requireEncryption: true },
      },
      {
        name: 'GDPR Retention Policy', type: 'retention',
        description: 'Enforce data retention limits and right-to-erasure for GDPR compliance.',
        defaultConfig: { maxRetentionDays: 365, rightToErasure: true, dataPortability: true },
      },
      {
        name: 'Enterprise AI Governance Policy', type: 'ai-usage',
        description: 'Control which AI models can be used and enforce prompt safety.',
        defaultConfig: { promptSafetyEnabled: true, requireModelApproval: true, blockedPromptPatterns: [], auditAllPrompts: true },
      },
      {
        name: 'Marketplace Extension Policy', type: 'marketplace',
        description: 'Require admin approval for extension installations.',
        defaultConfig: { requireApproval: true, approvedPublishers: [], blockedExtensions: [], sandboxRequired: true },
      },
      {
        name: 'Network Security Policy', type: 'network',
        description: 'Restrict access to specific IP ranges.',
        defaultConfig: { allowedIps: [], vpnRequired: false, geoBlocking: [] },
      },
      {
        name: 'Encryption Security Policy', type: 'security',
        description: 'Enforce encryption at rest and in transit.',
        defaultConfig: { requireEncryption: true, minimumKeyLength: 256, keyRotationDays: 90 },
      },
      {
        name: 'Audit Logging Policy', type: 'audit',
        description: 'Configure comprehensive audit logging.',
        defaultConfig: { logAllApiCalls: true, logDataAccess: true, retentionDays: 730, exportEnabled: true },
      },
    ];
  }

  public applyPolicyTemplate(organizationId: string, templateName: string, createdBy: string): OrganizationPolicy {
    const template = this.getAvailablePolicyTemplates().find(t => t.name === templateName);
    if (!template) throw new Error(`Policy template "${templateName}" not found.`);

    return policyEngine.createPolicy({
      organizationId,
      name: template.name,
      type: template.type,
      configuration: template.defaultConfig,
      enforcementLevel: 'enforced',
      createdBy,
    });
  }

  // ======== Compliance Frameworks ========

  private initializeComplianceFrameworks(): void {
    const soc2: ComplianceFramework = {
      id: 'soc2', name: 'SOC 2 Type II', version: '2024', status: 'not-assessed', lastAssessedAt: null,
      controls: [
        { id: 'CC6.1', name: 'Logical Access', description: 'Restrict logical access to systems.', category: 'Security', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'CC6.2', name: 'Authentication', description: 'Authenticate users before granting access.', category: 'Security', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'CC6.3', name: 'Authorization', description: 'Authorize access based on role.', category: 'Security', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'CC7.1', name: 'Monitoring', description: 'Monitor system for anomalies.', category: 'Monitoring', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'CC7.2', name: 'Incident Response', description: 'Respond to security incidents.', category: 'Monitoring', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'CC8.1', name: 'Change Management', description: 'Manage changes through controlled process.', category: 'Operations', status: 'not-applicable', evidence: [], remediationSteps: [] },
      ],
    };

    const gdpr: ComplianceFramework = {
      id: 'gdpr', name: 'GDPR', version: '2018', status: 'not-assessed', lastAssessedAt: null,
      controls: [
        { id: 'Art5', name: 'Data Processing Principles', description: 'Process data lawfully, fairly, and transparently.', category: 'Privacy', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'Art17', name: 'Right to Erasure', description: 'Allow data subjects to request deletion.', category: 'Rights', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'Art20', name: 'Data Portability', description: 'Allow data export in machine-readable format.', category: 'Rights', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'Art25', name: 'Data Protection by Design', description: 'Implement privacy by design.', category: 'Engineering', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'Art32', name: 'Security of Processing', description: 'Implement appropriate security measures.', category: 'Security', status: 'not-applicable', evidence: [], remediationSteps: [] },
      ],
    };

    const hipaa: ComplianceFramework = {
      id: 'hipaa', name: 'HIPAA', version: '2013', status: 'not-assessed', lastAssessedAt: null,
      controls: [
        { id: '164.312(a)', name: 'Access Control', description: 'Implement access controls to ePHI.', category: 'Technical', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: '164.312(c)', name: 'Integrity', description: 'Protect ePHI from improper alteration.', category: 'Technical', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: '164.312(e)', name: 'Transmission Security', description: 'Protect ePHI during transmission.', category: 'Technical', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: '164.308(a)(1)', name: 'Security Management', description: 'Implement security management process.', category: 'Administrative', status: 'not-applicable', evidence: [], remediationSteps: [] },
      ],
    };

    const iso27001: ComplianceFramework = {
      id: 'iso27001', name: 'ISO 27001', version: '2022', status: 'not-assessed', lastAssessedAt: null,
      controls: [
        { id: 'A.5', name: 'Information Security Policies', description: 'Management direction for information security.', category: 'Governance', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'A.6', name: 'Organization of Information Security', description: 'Internal organization and mobile devices.', category: 'Organization', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'A.8', name: 'Asset Management', description: 'Responsibility for assets.', category: 'Assets', status: 'not-applicable', evidence: [], remediationSteps: [] },
        { id: 'A.9', name: 'Access Control', description: 'User access management.', category: 'Access', status: 'not-applicable', evidence: [], remediationSteps: [] },
      ],
    };

    for (const fw of [soc2, gdpr, hipaa, iso27001]) {
      this.frameworks.set(fw.id, fw);
    }
  }

  public listComplianceFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  public getComplianceStatus(frameworkId: string): ComplianceFramework | null {
    return this.frameworks.get(frameworkId) ?? null;
  }

  // ======== Approval Workflows ========

  public createApprovalRequest(params: {
    tenantId: string;
    type: ApprovalRequest['type'];
    requestedBy: string;
    approvers: string[];
    details: Record<string, unknown>;
  }): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `apr-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      type: params.type,
      requestedBy: params.requestedBy,
      approvers: params.approvers,
      status: 'pending',
      details: params.details,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    };

    this.approvalRequests.set(request.id, request);
    console.log(`[GovernanceCenter] Approval request created: ${request.type} by ${params.requestedBy}`);
    return request;
  }

  public resolveApproval(requestId: string, decision: 'approved' | 'rejected', resolvedBy: string): ApprovalRequest {
    const request = this.approvalRequests.get(requestId);
    if (!request) throw new Error(`Approval request ${requestId} not found.`);
    if (!request.approvers.includes(resolvedBy)) throw new Error('Not an authorized approver.');

    request.status = decision;
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = resolvedBy;
    return request;
  }

  public listPendingApprovals(tenantId: string): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values()).filter(r => r.tenantId === tenantId && r.status === 'pending');
  }

  // ======== Retention Rules ========

  public createRetentionRule(params: {
    organizationId: string;
    tenantId?: string;
    resourceType: string;
    retentionDays: number;
    action: 'archive' | 'delete' | 'notify';
  }): RetentionRule {
    const rule: RetentionRule = {
      id: `ret-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      tenantId: params.tenantId ?? null,
      resourceType: params.resourceType,
      retentionDays: params.retentionDays,
      action: params.action,
      legalHold: false,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    this.retentionRules.set(rule.id, rule);
    return rule;
  }

  public listRetentionRules(organizationId: string): RetentionRule[] {
    return Array.from(this.retentionRules.values()).filter(r => r.organizationId === organizationId);
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      complianceFrameworks: this.frameworks.size,
      pendingApprovals: Array.from(this.approvalRequests.values()).filter(r => r.status === 'pending').length,
      retentionRules: this.retentionRules.size,
      policyTemplates: this.getAvailablePolicyTemplates().length,
    };
  }
}

export const governanceCenter = GovernanceCenter.getInstance();
export default governanceCenter;
