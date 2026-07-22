// src/platform/federation/FederationRegistry.ts
// Registry tracking federated nodes, capabilities, roles, latency, and health.

import { logger } from "../../infrastructure/observability/structured-logger";

export interface FederatedNode {
  nodeId: string;
  name: string;
  roles: Array<"runtime" | "knowledge" | "qualification" | "control" | "coordinator">;
  capabilities: string[];
  trustLevel: number;
  health: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  apiEndpoint: string;
  lastSeen: string;
}

export class FederationRegistry {
  private static instance: FederationRegistry | null = null;
  private nodes: Map<string, FederatedNode> = new Map();
  private configPath = "";

  private constructor() {
    if (typeof window === "undefined") {
      const fs = require("fs");
      const path = require("path");
      this.configPath = path.resolve(process.cwd(), "configs", "fleet-nodes.json");
    }
    
    // Load persisted nodes first
    this.loadNodes();

    // Ensure local workstation node is always present
    if (!this.nodes.has("local-workstation")) {
      this.registerNode({
        nodeId: "local-workstation",
        name: "Default Local Workstation",
        roles: ["runtime", "knowledge"],
        capabilities: ["mission-planning", "mission-execution", "knowledge-query"],
        trustLevel: 100,
        health: "healthy",
        latencyMs: 0,
        apiEndpoint: "http://localhost:18789",
        lastSeen: new Date().toISOString(),
      });
    }
  }

  public static getInstance(): FederationRegistry {
    if (!FederationRegistry.instance) {
      FederationRegistry.instance = new FederationRegistry();
    }
    return FederationRegistry.instance;
  }

  private loadNodes(): void {
    if (typeof window !== "undefined" || !this.configPath) return;
    try {
      const fs = require("fs");
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, "utf8");
        const list: FederatedNode[] = JSON.parse(raw);
        list.forEach((node) => {
          this.nodes.set(node.nodeId, node);
        });
        logger.info(`[FederationRegistry] Loaded ${list.length} persisted fleet nodes.`);
      }
    } catch (e: any) {
      logger.warn(`[FederationRegistry] Failed to load fleet nodes: ${e.message}`);
    }
  }

  private saveNodes(): void {
    if (typeof window !== "undefined" || !this.configPath) return;
    try {
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.nodes.values());
      fs.writeFileSync(this.configPath, JSON.stringify(list, null, 2), "utf8");
    } catch (e: any) {
      logger.error(`[FederationRegistry] Failed to persist fleet nodes: ${e.message}`);
    }
  }

  /**
   * Register or update a node in the federation registry.
   */
  public registerNode(node: FederatedNode): void {
    this.nodes.set(node.nodeId, node);
    this.saveNodes();
    logger.info(`[FederationRegistry] Registered node: ${node.nodeId} (${node.name})`);
  }

  /**
   * Remove a node from the registry.
   */
  public unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.saveNodes();
    logger.info(`[FederationRegistry] Unregistered node: ${nodeId}`);
  }

  /**
   * Synchronize node health and latency metrics.
   */
  public syncNodeState(nodeId: string, health: "healthy" | "degraded" | "unhealthy", latencyMs: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.health = health;
      node.latencyMs = latencyMs;
      node.lastSeen = new Date().toISOString();
      this.nodes.set(nodeId, node);
      this.saveNodes();
    }
  }

  /**
   * Find candidate nodes that satisfy the requested capability constraints.
   */
  public findCandidatesForCapability(capability: string): FederatedNode[] {
    return Array.from(this.nodes.values()).filter(
      (node) => node.capabilities.includes(capability) && node.health === "healthy"
    );
  }

  /**
   * Retrieve all nodes.
   */
  public getAllNodes(): FederatedNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Retrieve a specific node.
   */
  public getNode(nodeId: string): FederatedNode | null {
    return this.nodes.get(nodeId) || null;
  }
}

export const federationRegistry = FederationRegistry.getInstance();
export default federationRegistry;
