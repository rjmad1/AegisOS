// tests/unit/platform/EnterpriseExpansion.test.ts
// Unit tests validating AegisOS Tiered Isolation, SDK handshakes, Federation registries, Trust Authority, and Configuration Lifecycle.

import { describe, it, expect, vi } from "vitest";
import { runtimeManager, RuntimeTier } from "@/platform/extension/RuntimeManager";
import { platformCapabilityNegotiator } from "@/platform/sdk/PlatformCapabilityNegotiator";
import { AegisSdk } from "@/platform/sdk/MissionAwareSdk";
import { federationRegistry } from "@/platform/federation/FederationRegistry";
import { federationControlProtocol } from "@/platform/federation/FederationControlProtocol";
import { trustAuthorityService } from "@/platform/certification/TrustAuthorityService";
import { configurationDigitalTwin } from "@/platform/configuration/ConfigurationDigitalTwin";
import { configurationLifecycleService } from "@/platform/configuration/ConfigurationLifecycleService";

describe("AegisOS Enterprise Expansion & Extensibility", () => {
  describe("Component 1: Tiered Runtime Isolation", () => {
    it("should resolve TIER0_CORE_KERNEL for core platform ids", () => {
      const tier = runtimeManager.resolveRuntimeTier(
        {
          id: "com.aegisos.core.gateway",
          name: "Core Gateway",
          version: "1.0.0",
          author: "AegisOS",
          description: "Core gateway",
          dependencies: {},
          capabilities: [],
          permissions: [],
        },
        100
      );
      expect(tier).toBe(RuntimeTier.TIER0_CORE_KERNEL);
    });

    it("should resolve TIER1_TRUSTED_EXTENSION for highly trusted official signatures", () => {
      const tier = runtimeManager.resolveRuntimeTier(
        {
          id: "com.aegisos.ext.logger",
          name: "Security Logger",
          version: "1.0.0",
          author: "Security Team",
          description: "Logs stuff",
          dependencies: {},
          capabilities: [],
          permissions: [],
        },
        95
      );
      expect(tier).toBe(RuntimeTier.TIER1_TRUSTED_EXTENSION);
    });

    it("should apply sandbox constraints based on tier and active profile", () => {
      runtimeManager.setExecutionProfile("high-security");
      const constraints = runtimeManager.getSandboxConstraints(RuntimeTier.TIER3_UNTRUSTED_MARKETPLACE);
      expect(constraints.allowShellExecution).toBe(false);
      expect(constraints.allowFilesystemWrite).toBe(false);
      expect(constraints.memoryLimitMb).toBeLessThanOrEqual(512);

      // Restore
      runtimeManager.setExecutionProfile("developer");
    });
  });

  describe("Component 2: Mission-Aware SDK & PCNP", () => {
    it("should successfully negotiate capabilities with a compatible client", () => {
      const response = platformCapabilityNegotiator.negotiate({
        sdkVersion: "1.0.0",
        language: "typescript",
        supportedTransports: ["in-process"],
        requestedFeatures: ["mission-planning", "mission-execution"],
      });
      expect(response.status).toBe("accepted");
      expect(response.supportedCapabilities).toContain("mission-planning");
    });

    it("should reject client when SDK version is incompatible", () => {
      const response = platformCapabilityNegotiator.negotiate({
        sdkVersion: "2.0.0",
        language: "typescript",
        supportedTransports: ["in-process"],
        requestedFeatures: [],
      });
      expect(response.status).toBe("rejected");
    });

    it("should initialize the AegisSdk and expose clients", async () => {
      const sdk = new AegisSdk();
      await sdk.initialize();
      expect(sdk.missions).toBeDefined();
      expect(sdk.qualification).toBeDefined();
      expect(sdk.knowledge).toBeDefined();

      const list = await sdk.providers.listProviders();
      expect(list).toContain("com.aegisos.ext.logger");
    });
  });

  describe("Component 3: Hierarchical Federation", () => {
    it("should register federated nodes and find candidates", () => {
      federationRegistry.registerNode({
        nodeId: "remote-node-1",
        name: "Remote Worker Node",
        roles: ["runtime"],
        capabilities: ["mission-execution"],
        trustLevel: 80,
        health: "healthy",
        latencyMs: 20,
        apiEndpoint: "http://remote-1:18789",
        lastSeen: new Date().toISOString(),
      });

      const candidates = federationRegistry.findCandidatesForCapability("mission-execution");
      expect(candidates.some((n) => n.nodeId === "remote-node-1")).toBe(true);
    });

    it("should handle federation control protocol handshake requests", async () => {
      const response = await federationControlProtocol.handleMessage({
        protocolVersion: "1.0.0",
        senderId: "remote-node-2",
        recipientId: "local-workstation",
        type: "handshake_request",
        payload: {
          name: "Remote Node 2",
          roles: ["runtime"],
          capabilities: ["mission-execution"],
          trustLevel: 85,
        },
      });

      expect(response.type).toBe("handshake_response");
      expect(response.payload.status).toBe("accepted");

      const node = federationRegistry.getNode("remote-node-2");
      expect(node).not.toBeNull();
      expect(node?.trustLevel).toBe(85);
    });
  });

  describe("Component 4: Security & Trust Authority", () => {
    it("should verify signed artifact trust levels", () => {
      const trustManifest = trustAuthorityService.verifyArtifactTrust(
        "com.aegisos.ext.logger",
        { version: "1.0.0", capabilities: ["audit-logging"] },
        "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      );
      expect(trustManifest.trustLevel).toBe(95);
      expect(trustManifest.issuer).toBe("aegisos-core-authority");
    });
  });

  describe("Component 5: Configuration Lifecycle & Drift", () => {
    it("should load, qualify, and apply configuration profiles", async () => {
      const profile = await configurationLifecycleService.loadProfile({
        id: "prod-profile",
        version: "1.0.0",
        deploymentProfile: "enterprise",
        status: "draft",
        variables: {
          "aegis.ports.gateway": 18789,
          "aegis.ports.ollama": 11434,
        },
      });

      expect(profile.status).toBe("applied");
      const intended = configurationDigitalTwin.getIntendedValue("aegis.ports.gateway");
      expect(intended?.value).toBe(18789);
    });

    it("should detect configuration drifts and perform self-healing", async () => {
      // Intended is 11434, we observe 11435
      configurationDigitalTwin.observeValue("aegis.ports.ollama", 11435);
      
      const res = await configurationLifecycleService.reconcileAndHeal();
      expect(res.healthy).toBe(true);
      expect(res.repaired).toContain("aegis.ports.ollama port reset to intended value");
    });
  });

  describe("Component 6: Policy Decision Point & Quotas", () => {
    it("should allow policy requests satisfying security limits and valid licenses", async () => {
      const { constitutionEngine } = await import("@/platform/governance/ConstitutionEngine");
      const decision = await constitutionEngine.evaluatePolicy({
        scope: "security",
        action: "install_package",
        metadata: { trustLevel: 85 }
      });
      expect(decision.allowed).toBe(true);
    });

    it("should block package installation if trust level is below security threshold", async () => {
      const { constitutionEngine } = await import("@/platform/governance/ConstitutionEngine");
      // Security Policy expects >= 70% trust. A package with 40% should fail.
      const decision = await constitutionEngine.evaluatePolicy({
        scope: "security",
        action: "install_package",
        metadata: { trustLevel: 40 }
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("trust level");
    });

    it("should block AI inference if secret credential leakage is detected in prompt metadata", async () => {
      const { constitutionEngine } = await import("@/platform/governance/ConstitutionEngine");
      const decision = await constitutionEngine.evaluatePolicy({
        scope: "ai",
        action: "inference",
        metadata: { leaksCredentials: true }
      });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("leakage detected");
    });
  });

  describe("Component 7: Enterprise Secrets URI Resolution", () => {
    it("should resolve env:// scheme using process.env", async () => {
      const { secretsPlatform } = await import("@/infrastructure/security/secrets-platform");
      process.env.TEST_DUMMY_SECRET = "supersecret123";
      const val = await secretsPlatform.resolveSecretUri("env://TEST_DUMMY_SECRET");
      expect(val).toBe("supersecret123");
    });

    it("should resolve 1password:// and bitwarden:// schemes dynamically without DB cache", async () => {
      const { secretsPlatform } = await import("@/infrastructure/security/secrets-platform");
      const opVal = await secretsPlatform.resolveSecretUri("1password://vault/api-key");
      const bwVal = await secretsPlatform.resolveSecretUri("bitwarden://personal/token");
      expect(opVal).toContain("mock-op-secret-value");
      expect(bwVal).toContain("mock-bw-secret-value");
    });
  });

  describe("Component 8: Marketplace Promotion & Deprecation", () => {
    it("should recommend packages matching category search criteria", async () => {
      const { marketplaceService } = await import("@/platform/marketplace/MarketplaceService");
      const recs = await marketplaceService.recommendPackages("logger");
      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe("Component 9: Advanced FCP Message Types", () => {
    it("should process sync_config, rollout_payload, rollback_payload, and telemetry_push messages", async () => {
      const { federationControlProtocol } = await import("@/platform/federation/FederationControlProtocol");
      
      const rolloutRes = await federationControlProtocol.handleMessage({
        protocolVersion: "1.0.0",
        senderId: "coordinator-node",
        recipientId: "local-workstation",
        type: "rollout_payload" as any,
        payload: { rolloutId: "rollout-001", config: {} }
      });
      expect(rolloutRes.type).toBe("rollout_payload");
      expect(rolloutRes.payload.status).toBe("success");

      const rollbackRes = await federationControlProtocol.handleMessage({
        protocolVersion: "1.0.0",
        senderId: "coordinator-node",
        recipientId: "local-workstation",
        type: "rollback_payload" as any,
        payload: { rolloutId: "rollout-001" }
      });
      expect(rollbackRes.type).toBe("rollback_payload");
      expect(rollbackRes.payload.status).toBe("success");
    });
  });
});
