// src/platform/extension/RuntimeManager.ts
// Handles Tiered Runtime Isolation Architecture (TRIA) policies, process isolation, and sandboxing.

import { ExtensionManifest } from "./ExtensionSDK";
import { logger } from "../../infrastructure/observability/structured-logger";

export enum RuntimeTier {
  TIER0_CORE_KERNEL = 0,
  TIER1_TRUSTED_EXTENSION = 1,
  TIER2_EXTERNAL_PROVIDER = 2,
  TIER3_UNTRUSTED_MARKETPLACE = 3,
  TIER4_AUTONOMOUS_AGENT = 4,
}

export type ExecutionProfile = "developer" | "enterprise" | "high-security" | "marketplace-host";

export interface SandboxConstraints {
  allowFilesystemRead: boolean;
  allowFilesystemWrite: boolean;
  allowNetworkOutbound: boolean;
  allowShellExecution: boolean;
  cpuShares: number;
  memoryLimitMb: number;
}

export class RuntimeManager {
  private static instance: RuntimeManager | null = null;
  private currentProfile: ExecutionProfile = "developer";
  private activeProcesses: Map<string, any> = new Map();

  private constructor() {
    // Determine default profile from environment variables if present
    if (process.env.AEGIS_EXECUTION_PROFILE) {
      this.currentProfile = process.env.AEGIS_EXECUTION_PROFILE as ExecutionProfile;
    }
  }

  public static getInstance(): RuntimeManager {
    if (!RuntimeManager.instance) {
      RuntimeManager.instance = new RuntimeManager();
    }
    return RuntimeManager.instance;
  }

  /**
   * Configure the current execution profile of the host platform.
   */
  public setExecutionProfile(profile: ExecutionProfile): void {
    this.currentProfile = profile;
    logger.info(`[RuntimeManager] Execution profile switched to: ${profile}`);
  }

  /**
   * Retrieve the current execution profile.
   */
  public getExecutionProfile(): ExecutionProfile {
    return this.currentProfile;
  }

  /**
   * Determine the runtime isolation tier for a given extension manifest.
   */
  public resolveRuntimeTier(manifest: ExtensionManifest, trustLevel: number): RuntimeTier {
    // Dynamic policy-driven selection
    if (manifest.id.startsWith("com.aegisos.core.")) {
      return RuntimeTier.TIER0_CORE_KERNEL;
    }

    if (trustLevel >= 90) {
      return RuntimeTier.TIER1_TRUSTED_EXTENSION;
    }

    // Default to out-of-process for general third-party integrations
    if (manifest.id.startsWith("com.enterprise.integration.") || manifest.capabilities?.includes("enterprise-integration")) {
      return RuntimeTier.TIER2_EXTERNAL_PROVIDER;
    }

    if (this.currentProfile === "high-security") {
      // High-security forces untrusted/marketplace plugins into strict sandboxing
      return RuntimeTier.TIER3_UNTRUSTED_MARKETPLACE;
    }

    if (manifest.capabilities?.includes("autonomous-agent")) {
      return RuntimeTier.TIER4_AUTONOMOUS_AGENT;
    }

    return RuntimeTier.TIER3_UNTRUSTED_MARKETPLACE;
  }

  /**
   * Generate capability sandbox constraints for the resolved runtime tier and execution profile.
   */
  public getSandboxConstraints(tier: RuntimeTier): SandboxConstraints {
    const defaultConstraints: Record<RuntimeTier, SandboxConstraints> = {
      [RuntimeTier.TIER0_CORE_KERNEL]: {
        allowFilesystemRead: true,
        allowFilesystemWrite: true,
        allowNetworkOutbound: true,
        allowShellExecution: true,
        cpuShares: 1024,
        memoryLimitMb: 4096,
      },
      [RuntimeTier.TIER1_TRUSTED_EXTENSION]: {
        allowFilesystemRead: true,
        allowFilesystemWrite: false, // Strict control
        allowNetworkOutbound: true,
        allowShellExecution: false,
        cpuShares: 512,
        memoryLimitMb: 1024,
      },
      [RuntimeTier.TIER2_EXTERNAL_PROVIDER]: {
        allowFilesystemRead: false,
        allowFilesystemWrite: false,
        allowNetworkOutbound: true,
        allowShellExecution: false,
        cpuShares: 256,
        memoryLimitMb: 512,
      },
      [RuntimeTier.TIER3_UNTRUSTED_MARKETPLACE]: {
        allowFilesystemRead: false,
        allowFilesystemWrite: false,
        allowNetworkOutbound: false,
        allowShellExecution: false,
        cpuShares: 128,
        memoryLimitMb: 256,
      },
      [RuntimeTier.TIER4_AUTONOMOUS_AGENT]: {
        allowFilesystemRead: false,
        allowFilesystemWrite: false,
        allowNetworkOutbound: false,
        allowShellExecution: false,
        cpuShares: 128,
        memoryLimitMb: 256,
      },
    };

    const constraints = { ...defaultConstraints[tier] };

    // Apply execution profile modifiers
    if (this.currentProfile === "high-security") {
      constraints.allowShellExecution = false;
      constraints.allowFilesystemWrite = false;
      constraints.memoryLimitMb = Math.min(constraints.memoryLimitMb, 512);
    } else if (this.currentProfile === "developer") {
      // Developer profile relaxes memory constraints
      constraints.memoryLimitMb = constraints.memoryLimitMb * 2;
    }

    return constraints;
  }

  /**
   * Attests runtime execution parameters of a running process or in-process module.
   */
  public verifyRuntimeAttestation(extensionId: string): boolean {
    logger.info(`[RuntimeManager] Attesting runtime execution for extension: ${extensionId}`);
    // Simulate runtime validation scan of memory signature & capabilities
    return true;
  }
}

export const runtimeManager = RuntimeManager.getInstance();
export default runtimeManager;
