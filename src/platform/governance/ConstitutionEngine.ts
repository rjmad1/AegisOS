import * as fs from 'fs';
import * as path from 'path';
import { OptimizationRecommendation, RiskLevels } from '../pik/types';
import prisma from '@/infrastructure/db/prisma';

export interface ConstitutionalPrinciple {
  id: string;
  severity: 'warning' | 'critical';
  description: string;
}

export interface PlatformConstitution {
  principles: ConstitutionalPrinciple[];
}

export interface PolicyContext {
  scope: 'enterprise' | 'organization' | 'tenant' | 'workspace' | 'project' | 'runtime' | 'marketplace' | 'security' | 'ai' | 'compliance';
  organizationId?: string;
  tenantId?: string;
  workspaceId?: string;
  projectId?: string;
  userId?: string;
  action: string;
  resourceId?: string;
  costEstimate?: number;
  tokensCount?: number;
  metadata?: Record<string, any>;
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  enforcementLevel: 'advisory' | 'warning' | 'enforced' | 'strict';
  decisionTimeMs: number;
}

export class ConstitutionEngine {
  private static instance: ConstitutionEngine | null = null;
  private constitution: PlatformConstitution | null = null;

  private constructor() {}

  public static getInstance(): ConstitutionEngine {
    if (!ConstitutionEngine.instance) {
      ConstitutionEngine.instance = new ConstitutionEngine();
    }
    return ConstitutionEngine.instance;
  }

  /**
   * Loads and parses the constitution.yaml file.
   */
  public async loadConstitution(filePath?: string): Promise<void> {
    const defaultPath = path.join(process.cwd(), 'src', 'platform', 'governance', 'policies', 'constitution.yaml');
    const targetPath = filePath || defaultPath;
    
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      this.constitution = this.parseSimpleYaml(content);
    } catch (err) {
      console.warn(`[ConstitutionEngine] Failed to load constitution from ${targetPath}:`, err);
      this.constitution = { principles: [] };
    }
  }

  public getConstitution(): PlatformConstitution | null {
    return this.constitution;
  }

  /**
   * Policy Decision Point (PDP) Method: Evaluate policy rules dynamically.
   */
  public async evaluatePolicy(context: PolicyContext): Promise<PolicyDecision> {
    const startTime = Date.now();
    let allowed = true;
    let reason = "Policy evaluated and passed.";
    let enforcementLevel: PolicyDecision['enforcementLevel'] = "enforced";

    try {
      // 1. License Verification (Program 8.9)
      if (context.tenantId) {
        const license = await prisma.license.findFirst({
          where: { tenantId: context.tenantId }
        });
        if (license && (license.status === "expired" || license.status === "suspended" || license.status === "revoked")) {
          return {
            allowed: false,
            reason: `License key ${license.licenseKey} is currently ${license.status}. Operations suspended.`,
            enforcementLevel: "strict",
            decisionTimeMs: Date.now() - startTime
          };
        }
      }

      // 2. Cost Center & Quota Evaluation (Program 8.9)
      if (context.workspaceId && context.costEstimate && context.costEstimate > 0) {
        // Fetch active quotas from workspace settings / config
        const workspace = await prisma.workspace.findUnique({
          where: { id: context.workspaceId }
        });
        
        let quotaLimit = 1000.0; // default quota budget
        if (workspace) {
          try {
            const settings = JSON.parse(workspace.settings || "{}");
            if (settings.monthlyBudget) quotaLimit = settings.monthlyBudget;
          } catch {}
        }

        // Sum current month usage
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const usageAgg = await prisma.usageRecord.aggregate({
          where: {
            workspaceId: context.workspaceId,
            timestamp: { gte: startOfMonth }
          },
          _sum: { totalCost: true }
        });

        const currentMonthTotal = usageAgg._sum.totalCost || 0;
        if (currentMonthTotal + context.costEstimate > quotaLimit) {
          return {
            allowed: false,
            reason: `Monthly cost limit exceeded for Workspace ${context.workspaceId}. Quota limit: $${quotaLimit}. Current usage: $${currentMonthTotal}.`,
            enforcementLevel: "enforced",
            decisionTimeMs: Date.now() - startTime
          };
        }
      }

      // 3. Evaluate dynamic database policy rules (GovernancePolicy model)
      const queryType = context.scope === "security" ? "security" : context.scope === "ai" ? "ai" : "general";
      let dbPolicies: any[] = [];
      try {
        dbPolicies = await prisma.governancePolicy.findMany({
          where: {
            enabled: true,
            type: { in: [context.scope, queryType] }
          }
        });
      } catch {}

      if (dbPolicies.length === 0) {
        dbPolicies = [
          {
            id: "default-security-policy",
            name: "Default Security Policy",
            type: "security",
            enabled: true,
            enforcementLevel: "strict",
            configuration: JSON.stringify({ minimumTrustLevel: 70 })
          },
          {
            id: "default-ai-policy",
            name: "Default AI Policy",
            type: "ai",
            enabled: true,
            enforcementLevel: "strict",
            configuration: JSON.stringify({ blockCredentialLeakage: true })
          }
        ];
      }

      for (const policy of dbPolicies) {
        let policyConfig: any = {};
        try {
          policyConfig = JSON.parse(policy.configuration);
        } catch {}

        // Enforce specific security checks
        if (policy.type === "security" && context.action === "install_package") {
          const trustScore = context.metadata?.trustLevel || 50;
          const minTrust = policyConfig.minimumTrustLevel || 70;
          if (trustScore < minTrust) {
            allowed = false;
            reason = `Security violation: Marketplace item trust level (${trustScore}%) is below configured minimum (${minTrust}%).`;
            enforcementLevel = policy.enforcementLevel as any;
            break;
          }
        }

        // Enforce AI usage rules (e.g. max token threshold, safety checks)
        if (policy.type === "ai" && context.action === "inference") {
          if (policyConfig.blockCredentialLeakage === true && context.metadata?.leaksCredentials === true) {
            allowed = false;
            reason = "AI policy violation: Potential credential or API secret leakage detected in LLM prompt output.";
            enforcementLevel = "strict";
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("[ConstitutionEngine] Policy evaluation error:", e.message);
      // Fallback: allowed on evaluation error under warning level
      allowed = true;
      reason = `Policy evaluation failed with error: ${e.message}. Defaulting to bypass.`;
      enforcementLevel = "warning";
    }

    return {
      allowed,
      reason,
      enforcementLevel,
      decisionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Backwards compatible isAuthorized helper for optimization recommendations
   */
  public isAuthorized(recommendation: OptimizationRecommendation): boolean {
    if (!this.constitution) {
      return false;
    }

    if (recommendation.riskLevel === RiskLevels.LEVEL_0_OBSERVATION) {
      return true;
    }

    if (recommendation.riskLevel === RiskLevels.LEVEL_1_MAINTENANCE) {
      return recommendation.autonomousEligibility;
    }

    return false;
  }

  private parseSimpleYaml(content: string): PlatformConstitution {
    const principles: ConstitutionalPrinciple[] = [];
    const blocks = content.split('- id:').slice(1);

    for (const block of blocks) {
      const idMatch = block.match(/([a-zA-Z0-9_-]+)/);
      const sevMatch = block.match(/severity:\s*(warning|critical)/);
      const descMatch = block.match(/description:\s*(.+)/);

      if (idMatch && sevMatch) {
        principles.push({
          id: idMatch[1].trim(),
          severity: sevMatch[1] as 'warning' | 'critical',
          description: descMatch ? descMatch[1].trim() : ''
        });
      }
    }

    return { principles };
  }
}

export const constitutionEngine = ConstitutionEngine.getInstance();
export default constitutionEngine;
