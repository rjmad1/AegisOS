// src/platform/sdk/PlatformCapabilityNegotiator.ts
// Platform Capability Negotiation Protocol (PCNP) managing versions and extensions dynamically.

import { logger } from "../../infrastructure/observability/structured-logger";

export interface ClientCapabilityManifest {
  sdkVersion: string;
  language: "typescript" | "python" | "go";
  supportedTransports: string[];
  requestedFeatures: string[];
}

export interface PlatformNegotiationResponse {
  negotiatedVersion: string;
  status: "accepted" | "downgraded" | "rejected";
  supportedCapabilities: string[];
  activeProfile: string;
  activeProviders: string[];
  warnings?: string[];
}

export class PlatformCapabilityNegotiator {
  private static instance: PlatformCapabilityNegotiator | null = null;
  private currentPlatformVersion = "1.0.0";
  private systemCapabilities: Set<string> = new Set([
    "mission-planning",
    "mission-execution",
    "qualification-verification",
    "knowledge-query",
    "digital-twin-observe",
    "policy-enforce",
    "audit-stream",
  ]);

  private constructor() {}

  public static getInstance(): PlatformCapabilityNegotiator {
    if (!PlatformCapabilityNegotiator.instance) {
      PlatformCapabilityNegotiator.instance = new PlatformCapabilityNegotiator();
    }
    return PlatformCapabilityNegotiator.instance;
  }

  /**
   * Handle the capability negotiation handshake from an SDK client.
   */
  public negotiate(clientManifest: ClientCapabilityManifest): PlatformNegotiationResponse {
    logger.info(
      `[PlatformCapabilityNegotiator] Handshake received. SDK: ${clientManifest.sdkVersion} (${clientManifest.language})`
    );

    const warnings: string[] = [];
    let status: "accepted" | "downgraded" | "rejected" = "accepted";
    let negotiatedVersion = this.currentPlatformVersion;

    // Check version compatibility
    const sdkMajor = parseInt(clientManifest.sdkVersion.split(".")[0], 10);
    const platformMajor = parseInt(this.currentPlatformVersion.split(".")[0], 10);

    if (sdkMajor > platformMajor) {
      status = "rejected";
      warnings.push(`SDK version ${clientManifest.sdkVersion} is newer than platform ${this.currentPlatformVersion}`);
    } else if (sdkMajor < platformMajor) {
      status = "downgraded";
      negotiatedVersion = clientManifest.sdkVersion;
      warnings.push(`SDK version ${clientManifest.sdkVersion} is older. Degrading features to match SDK capabilities.`);
    }

    const supported = Array.from(this.systemCapabilities).filter((cap) =>
      clientManifest.requestedFeatures.length === 0 || clientManifest.requestedFeatures.includes(cap)
    );

    return {
      negotiatedVersion,
      status,
      supportedCapabilities: supported,
      activeProfile: process.env.NODE_ENV || "development",
      activeProviders: ["com.aegisos.ext.logger", "com.aegisos.ext.translator"],
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

export const platformCapabilityNegotiator = PlatformCapabilityNegotiator.getInstance();
export default platformCapabilityNegotiator;
