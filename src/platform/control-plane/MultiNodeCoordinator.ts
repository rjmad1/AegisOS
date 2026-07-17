// src/platform/control-plane/MultiNodeCoordinator.ts
import { WorkstationNode } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import * as os from 'os';

export class MultiNodeCoordinator {
  private static instance: MultiNodeCoordinator | null = null;
  private nodes: Map<string, WorkstationNode> = new Map();

  private constructor() {
    this.registerLocalNode();
  }

  public static getInstance(): MultiNodeCoordinator {
    if (!MultiNodeCoordinator.instance) {
      MultiNodeCoordinator.instance = new MultiNodeCoordinator();
    }
    return MultiNodeCoordinator.instance;
  }

  private registerLocalNode(): void {
    const localId = `node-local-${os.hostname().toLowerCase()}`;
    const cpuCores = os.cpus().length;
    const totalRamBytes = os.totalmem();
    
    this.nodes.set(localId, {
      nodeId: localId,
      hostname: os.hostname(),
      ipAddress: '127.0.0.1',
      status: 'online',
      role: 'leader',
      lastSeen: Date.now(),
      cpuCores,
      totalRamBytes,
      gpuInfo: 'NVIDIA RTX 5080'
    });
  }

  public getClusterNodes(): WorkstationNode[] {
    return Array.from(this.nodes.values());
  }

  public getNode(nodeId: string): WorkstationNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Registers a worker node into the cluster workspace topology.
   */
  public async registerNode(node: Omit<WorkstationNode, 'lastSeen'>): Promise<void> {
    const fullNode: WorkstationNode = {
      ...node,
      lastSeen: Date.now()
    };
    this.nodes.set(node.nodeId, fullNode);

    console.log(`[MultiNode] Registered clustering work node: ${node.hostname} (${node.nodeId}) at ${node.ipAddress}`);

    await eventPlatform.publish({
      name: 'ComponentRegistered',
      source: 'multinode-coordinator',
      payload: {
        component: {
          id: `infra:node:${node.nodeId}`,
          name: `Cluster Node: ${node.hostname}`,
          category: 'network-interface',
          status: node.status === 'online' ? 'healthy' : 'offline',
          lifecycleState: node.status === 'online' ? 'running' : 'stopped',
          dependencies: [],
          capabilities: ['distributed-inference', 'mTLS-secure'],
          ownerModule: 'infrastructure',
          metadata: {
            ipAddress: node.ipAddress,
            role: node.role,
            cores: node.cpuCores,
            ram: node.totalRamBytes
          }
        }
      }
    });
  }

  /**
   * Updates health and heartbeat timestamps for workstation cluster members.
   */
  public async pingNode(nodeId: string, status: WorkstationNode['status'] = 'online'): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    node.lastSeen = Date.now();
    const oldStatus = node.status;
    node.status = status;

    if (oldStatus !== status) {
      await eventPlatform.publish({
        name: 'HealthChanged',
        source: 'multinode-coordinator',
        payload: {
          componentId: `infra:node:${nodeId}`,
          oldState: oldStatus === 'online' ? 'running' : 'stopped',
          newState: status === 'online' ? 'running' : 'stopped',
          timestamp: Date.now()
        }
      });
    }

    return true;
  }
}
export const multiNodeCoordinator = MultiNodeCoordinator.getInstance();
export default multiNodeCoordinator;
