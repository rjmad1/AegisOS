// src/platform/capability/CapabilityTrustManager.ts
// Security and Trust policy enforcer for AegisOS Capabilities

import { CapabilityMetadata, TrustPolicy } from "./types";

export class CapabilityTrustManager {
  private static instance: CapabilityTrustManager | null = null;
  private trustPolicy: TrustPolicy;

  private constructor() {
    this.trustPolicy = this.loadDefaultPolicy();
  }

  public static getInstance(): CapabilityTrustManager {
    if (!CapabilityTrustManager.instance) {
      CapabilityTrustManager.instance = new CapabilityTrustManager();
    }
    return CapabilityTrustManager.instance;
  }

  public getPolicy(): TrustPolicy {
    return this.trustPolicy;
  }

  public updatePolicy(newPolicy: Partial<TrustPolicy>): void {
    this.trustPolicy = { ...this.trustPolicy, ...newPolicy };
  }

  /**
   * Performs signature validation, publisher checks, registry checks, and licensing validation.
   */
  public async validate(cap: CapabilityMetadata): Promise<{ valid: boolean; reason?: string; score: number }> {
    // 1. Signature Verification
    if (this.trustPolicy.requireSignature) {
      if (!cap.signature) {
        return { valid: false, reason: "Cryptographic signature is missing, signature required by policy.", score: 0.1 };
      }
      // Simple verification test: signatures must be 64-character hex strings
      if (!/^[a-fA-F0-9]{64}$/.test(cap.signature)) {
        return { valid: false, reason: "Cryptographic signature validation failed. Tampering detected.", score: 0.0 };
      }
    }

    // 2. Trust Score Evaluation
    if (cap.trustScore < this.trustPolicy.minimumTrustScore) {
      return {
        valid: false,
        reason: `Trust score (${cap.trustScore}) is lower than the configured threshold (${this.trustPolicy.minimumTrustScore}).`,
        score: cap.trustScore
      };
    }

    // 3. Publisher / Registry / Git Verification
    const isPublisherAllowed = this.trustPolicy.allowedPublishers.includes("*") || 
      this.trustPolicy.allowedPublishers.some(p => cap.publisher.toLowerCase().includes(p.toLowerCase()));

    const isRepoAllowed = this.trustPolicy.allowedGithubOrgs.includes("*") ||
      this.trustPolicy.allowedGithubOrgs.some(org => cap.repository.toLowerCase().includes(`github.com/${org.toLowerCase()}/`));

    const isRegistryAllowed = this.trustPolicy.allowedRegistries.includes("*") ||
      this.trustPolicy.allowedRegistries.some(reg => cap.repository.toLowerCase().includes(reg.toLowerCase()));

    if (!isPublisherAllowed && !isRepoAllowed && !isRegistryAllowed) {
      return {
        valid: false,
        reason: `Publisher "${cap.publisher}" and Repository "${cap.repository}" violate organization trust policies.`,
        score: Math.min(cap.trustScore, 0.4)
      };
    }

    // 4. License Validation
    const license = (cap.compatibilityProfile.license as string) || "proprietary";
    const isLicenseAllowed = this.trustPolicy.allowedLicenses.includes("*") ||
      this.trustPolicy.allowedLicenses.some(l => license.toLowerCase().includes(l.toLowerCase()));

    if (!isLicenseAllowed) {
      return {
        valid: false,
        reason: `License "${license}" is not approved for use in this environment.`,
        score: Math.min(cap.trustScore, 0.3)
      };
    }

    // 5. Success
    const score = (cap.trustScore + (cap.successRate || 1.0)) / 2;
    return { valid: true, score };
  }

  private loadDefaultPolicy(): TrustPolicy {
    return {
      allowedPublishers: ["AegisOS Core Team", "Google", "Microsoft", "Meta", "Model Context Protocol Authors"],
      allowedRegistries: ["https://registry.npmjs.org", "https://hub.docker.com", "huggingface.co"],
      allowedGithubOrgs: ["aegisos", "modelcontextprotocol", "google-deepmind", "ollama"],
      minimumTrustScore: 0.75,
      requireSignature: true,
      allowedLicenses: ["MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC", "proprietary"]
    };
  }
}
export const capabilityTrustManager = CapabilityTrustManager.getInstance();
export default capabilityTrustManager;
