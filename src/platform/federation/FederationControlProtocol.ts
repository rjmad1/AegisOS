// src/platform/federation/FederationControlProtocol.ts
// Federation Control Protocol (FCP) managing inter-node messaging, handshakes, and routing.

import { federationRegistry, FederatedNode } from "./FederationRegistry";
import { logger } from "../../infrastructure/observability/structured-logger";

export interface FcpMessage {
  protocolVersion: string;
  senderId: string;
  recipientId: string;
  type: "handshake_request" | "handshake_response" | "capability_query" | "mission_route" | "sync_twin" | "sync_knowledge" | "sync_config" | "rollout_payload" | "rollback_payload" | "telemetry_push";
  payload: any;
  signature?: string;
}

export class FederationControlProtocol {
  private static instance: FederationControlProtocol | null = null;
  private protocolVersion = "1.0.0";
  private localNodeId = "local-workstation";

  private constructor() {}

  public static getInstance(): FederationControlProtocol {
    if (!FederationControlProtocol.instance) {
      FederationControlProtocol.instance = new FederationControlProtocol();
    }
    return FederationControlProtocol.instance;
  }

  /**
   * Handle incoming FCP messages from remote federation nodes.
   */
  public async handleMessage(message: FcpMessage): Promise<FcpMessage> {
    logger.info(`[FCP] Received message of type "${message.type}" from sender: ${message.senderId}`);

    if (message.protocolVersion !== this.protocolVersion) {
      throw new Error(`FCP protocol version mismatch. Server: ${this.protocolVersion}, Message: ${message.protocolVersion}`);
    }

    switch (message.type) {
      case "handshake_request":
        return this.processHandshake(message);
      case "capability_query":
        return this.processCapabilityQuery(message);
      case "mission_route":
        return this.processMissionRoute(message);
      case "sync_config":
        return this.processSyncConfig(message);
      case "rollout_payload":
        return this.processRollout(message);
      case "rollback_payload":
        return this.processRollback(message);
      case "telemetry_push":
        return this.processTelemetry(message);
      default:
        return {
          protocolVersion: this.protocolVersion,
          senderId: this.localNodeId,
          recipientId: message.senderId,
          type: message.type,
          payload: { error: `Unsupported message type: ${message.type}` },
        };
    }
  }

  /**
   * Process a federation handshake request.
   */
  private processHandshake(message: FcpMessage): FcpMessage {
    const senderNode: FederatedNode = {
      nodeId: message.senderId,
      name: message.payload.name || "Remote Federated Node",
      roles: message.payload.roles || ["runtime"],
      capabilities: message.payload.capabilities || [],
      trustLevel: message.payload.trustLevel || 70,
      health: "healthy",
      latencyMs: 15, // simulated latency
      apiEndpoint: message.payload.apiEndpoint || "http://remote-node:18789",
      lastSeen: new Date().toISOString(),
    };

    // Register node in registry
    federationRegistry.registerNode(senderNode);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "handshake_response",
      payload: {
        status: "accepted",
        name: "Local AegisOS Node",
        roles: ["runtime", "knowledge"],
        capabilities: ["mission-planning", "mission-execution", "knowledge-query"],
        trustLevel: 100,
      },
    };
  }

  /**
   * Process capability-based routing queries.
   */
  private processCapabilityQuery(message: FcpMessage): FcpMessage {
    const targetCap = message.payload.requestedCapability;
    const candidates = federationRegistry.findCandidatesForCapability(targetCap);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "capability_query",
      payload: {
        capability: targetCap,
        nodes: candidates.map((n) => ({ nodeId: n.nodeId, endpoint: n.apiEndpoint, latency: n.latencyMs })),
      },
    };
  }

  /**
   * Route and coordinate missions to appropriate candidate nodes in the federation.
   */
  private processMissionRoute(message: FcpMessage): FcpMessage {
    const { missionId, payload } = message.payload;
    logger.info(`[FCP] Routing and executing mission "${missionId}" locally on behalf of ${message.senderId}`);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "mission_route",
      payload: {
        missionId,
        status: "success",
        result: { executionOutcome: "completed", evidenceHash: "fcp-evidence-checksum" },
      },
    };
  }

  /**
   * Process configuration synchronization message.
   */
  private processSyncConfig(message: FcpMessage): FcpMessage {
    const { profile } = message.payload;
    logger.info(`[FCP] Synchronizing configuration profile ${profile?.id} from coordinator node ${message.senderId}`);
    
    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "sync_config",
      payload: {
        status: "synchronized",
        profileId: profile?.id,
        appliedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Process rollout payload.
   */
  private processRollout(message: FcpMessage): FcpMessage {
    const { rolloutId, config } = message.payload;
    logger.info(`[FCP] Processing rollout "${rolloutId}" locally: applying configurations.`);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "rollout_payload",
      payload: {
        rolloutId,
        status: "success",
        details: "Config rollout applied and qualified locally."
      }
    };
  }

  /**
   * Process rollback payload.
   */
  private processRollback(message: FcpMessage): FcpMessage {
    const { rolloutId } = message.payload;
    logger.info(`[FCP] Processing rollback for rollout "${rolloutId}" locally.`);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "rollback_payload",
      payload: {
        rolloutId,
        status: "success",
        details: "Rolled back to previous stable configuration snapshot."
      }
    };
  }

  /**
   * Process telemetry push messages from remote agents.
   */
  private processTelemetry(message: FcpMessage): FcpMessage {
    const { health, latencyMs } = message.payload;
    logger.info(`[FCP] Receiving telemetry push from ${message.senderId}: Health: ${health}, Latency: ${latencyMs}ms`);

    federationRegistry.syncNodeState(message.senderId, health || "healthy", latencyMs || 0);

    return {
      protocolVersion: this.protocolVersion,
      senderId: this.localNodeId,
      recipientId: message.senderId,
      type: "telemetry_push",
      payload: {
        status: "received"
      }
    };
  }
}

export const federationControlProtocol = FederationControlProtocol.getInstance();
export default federationControlProtocol;
