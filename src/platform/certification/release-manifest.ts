/**
 * Release Manifest Extensions
 * 
 * Defines the models for extended Release Manifests containing content-addressed
 * evidence graph roots, cryptographic provenance, and verification metadata.
 */

import type { PlatformHealthIndex, CertificationNode } from './types';

export interface ReleaseSignatureMetadata {
  signerIdentity: string;
  signatureAlgorithm: string;
  signatureTimestamp: string;
  signedHash: string;
}

export interface ExtendedReleaseManifest {
  version: string;
  gitSha: string;
  timestamp: string;
  componentVersions: Record<string, string>;
  models: string[];
  capabilities: string[];
  mcpServers: string[];
  sbomPath: string;
  platformHealth: PlatformHealthIndex;
  certificationTree: CertificationNode;
  
  // Chain-of-Trust and Verification Extensions
  evidenceGraphRootHash: string;
  configurationHash: string;
  environmentFingerprint: string;
  qualificationProfile: string;
  qualificationDecision: 'PASS' | 'WARNING' | 'FAIL';
  
  // Signature Metadata (Optional until signed)
  signature?: ReleaseSignatureMetadata;
  signedHash?: string; // Legacy compatibility
}
