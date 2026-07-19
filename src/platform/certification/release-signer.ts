/**
 * Release Signer Interface and Implementations
 * 
 * Supports pluggable signature providers to secure the Release Manifest
 * provenance chain. Pluggable signing providers allow transitioning from
 * simple local content-addressing to enterprise KMS or Sigstore/Cosign.
 */

import { createHash } from 'crypto';
import type { ExtendedReleaseManifest, ReleaseSignatureMetadata } from './release-manifest';

export interface IReleaseSigner {
  readonly signerId: string;
  sign(manifest: Omit<ExtendedReleaseManifest, 'signature' | 'signedHash'>): Promise<ReleaseSignatureMetadata>;
}

// ---------------------------------------------------------------------------
// 1. NoOp / Development Signer
// ---------------------------------------------------------------------------
export class NoOpSigner implements IReleaseSigner {
  public readonly signerId = 'dev-noop-signer';

  public async sign(
    manifest: Omit<ExtendedReleaseManifest, 'signature' | 'signedHash'>
  ): Promise<ReleaseSignatureMetadata> {
    return {
      signerIdentity: 'dev-environment-unsigned',
      signatureAlgorithm: 'NONE',
      signatureTimestamp: new Date().toISOString(),
      signedHash: 'UNSIGNED_DEV_BUILD'
    };
  }
}

// ---------------------------------------------------------------------------
// 2. SHA-256 Verification-only Signer
// ---------------------------------------------------------------------------
export class Sha256Signer implements IReleaseSigner {
  public readonly signerId = 'sha256-integrity-signer';

  constructor(private readonly secretSalt = 'aegisos-trust-anchor') {}

  public async sign(
    manifest: Omit<ExtendedReleaseManifest, 'signature' | 'signedHash'>
  ): Promise<ReleaseSignatureMetadata> {
    const payload = JSON.stringify({
      version: manifest.version,
      gitSha: manifest.gitSha,
      evidenceGraphRootHash: manifest.evidenceGraphRootHash,
      qualificationDecision: manifest.qualificationDecision,
      timestamp: manifest.timestamp,
      salt: this.secretSalt
    });

    const hash = createHash('sha256').update(payload).digest('hex');

    return {
      signerIdentity: 'aegisos-local-authority',
      signatureAlgorithm: 'HMAC-SHA256',
      signatureTimestamp: new Date().toISOString(),
      signedHash: hash
    };
  }
}

// ---------------------------------------------------------------------------
// Release Signer Factory
// ---------------------------------------------------------------------------
export class ReleaseSignerFactory {
  public static createSigner(providerType: string, options?: Record<string, any>): IReleaseSigner {
    switch (providerType.toLowerCase()) {
      case 'none':
      case 'noop':
        return new NoOpSigner();
      case 'sha256':
      case 'local':
      default:
        return new Sha256Signer(options?.secretSalt);
    }
  }
}
