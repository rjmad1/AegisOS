/**
 * Release Verifier
 * 
 * Validates individual evidence hashes, complete evidence graph integrity,
 * release manifest integrity, and digital signatures.
 */

import { createHash } from 'crypto';
import type { ExtendedReleaseManifest } from './release-manifest';
import { EvidenceGraph } from './evidence-graph';
import { trustAuthorityService } from './TrustAuthorityService';

export interface VerificationReport {
  isValid: boolean;
  manifestVerified: boolean;
  evidenceGraphVerified: boolean;
  signatureVerified: boolean;
  errors: string[];
  timestamp: string;
}

export class ReleaseVerifier {
  /**
   * Verify the entire release manifest and its associated evidence graph.
   */
  public static async verify(
    manifest: ExtendedReleaseManifest,
    serializedEvidenceGraph?: string
  ): Promise<VerificationReport> {
    const errors: string[] = [];
    let manifestVerified = true;
    let evidenceGraphVerified = true;
    let signatureVerified = true;

    // 1. Basic Schema Validation
    if (!manifest.version || !manifest.gitSha || !manifest.evidenceGraphRootHash) {
      manifestVerified = false;
      errors.push('Manifest is missing critical identification fields (version, gitSha, or evidenceGraphRootHash)');
    }

    // 2. Signature verification utilizing TrustAuthorityService
    if (manifest.signature) {
      try {
        const sig = manifest.signature;
        const trustManifest = trustAuthorityService.verifyArtifactTrust(
          manifest.version,
          manifest,
          sig.signedHash
        );
        if (trustManifest.trustLevel < 50) {
          signatureVerified = false;
          errors.push(`Artifact trust level too low: ${trustManifest.trustLevel}`);
        }
      } catch (err: any) {
        signatureVerified = false;
        errors.push(`Signature verification failed: ${err.message}`);
      }
    } else {
      signatureVerified = false;
      errors.push('Release manifest is unsigned.');
    }

    // 3. Evidence Graph verification if supplied
    if (serializedEvidenceGraph) {
      try {
        const graph = EvidenceGraph.deserialize(serializedEvidenceGraph);
        const verification = graph.verify();
        
        if (!verification.isValid) {
          evidenceGraphVerified = false;
          errors.push(`Evidence graph contains corrupt nodes: ${verification.invalidNodes.join(', ')}`);
        }

        const computedRoot = graph.computeRootHash();
        if (computedRoot !== manifest.evidenceGraphRootHash) {
          evidenceGraphVerified = false;
          errors.push(`Evidence graph root hash mismatch. Manifest: ${manifest.evidenceGraphRootHash}, Graph: ${computedRoot}`);
        }
      } catch (err: any) {
        evidenceGraphVerified = false;
        errors.push(`Failed to parse/verify evidence graph: ${err.message}`);
      }
    } else {
      evidenceGraphVerified = false;
      errors.push('Serialized evidence graph was not provided for deep verification.');
    }

    const isValid = manifestVerified && evidenceGraphVerified && signatureVerified;

    return {
      isValid,
      manifestVerified,
      evidenceGraphVerified,
      signatureVerified,
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

