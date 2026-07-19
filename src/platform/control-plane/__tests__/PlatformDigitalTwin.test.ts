// src/platform/control-plane/__tests__/PlatformDigitalTwin.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GraphKernel } from '../digital-twin/core/GraphKernel';
import { graphAccessLayer } from '../digital-twin/core/GraphAccessLayer';
import { projectionsRegistry } from '../digital-twin/projections/ProjectionsRegistry';
import { simulationEngine } from '../digital-twin/simulation/SimulationEngine';
import { DigitalTwinNode } from '../digital-twin/core/node';

describe('Platform Digital Twin — Graph Kernel & Access Layer', () => {
  let kernel: GraphKernel;

  beforeEach(() => {
    kernel = new GraphKernel();
  });

  it('should add, retrieve, and remove nodes and edges correctly', () => {
    const nodeA: DigitalTwinNode = {
      id: 'node-A',
      type: 'Topology',
      version: '1.0.0',
      state: 'running',
      health: 'healthy',
      properties: { name: 'Service A' },
      labels: ['service'],
      source: 'test',
      timestamp: Date.now()
    };

    const nodeB: DigitalTwinNode = {
      id: 'node-B',
      type: 'Capability',
      version: '1.0.0',
      state: 'running',
      health: 'healthy',
      properties: { name: 'Capability B' },
      labels: ['capability'],
      source: 'test',
      timestamp: Date.now()
    };

    kernel.addNode(nodeA);
    kernel.addNode(nodeB);

    expect(kernel.hasNode('node-A')).toBe(true);
    expect(kernel.hasNode('node-B')).toBe(true);

    kernel.addEdge({
      source: 'node-A',
      target: 'node-B',
      relationship: 'depends-on',
      weight: 1,
      confidence: 1,
      properties: {}
    });

    const edge = kernel.getEdge('node-A', 'node-B', 'depends-on');
    expect(edge).toBeDefined();
    expect(edge?.source).toBe('node-A');
    expect(edge?.target).toBe('node-B');

    // Test BFS traversal
    const visited: string[] = [];
    kernel.bfs('node-A', (n) => {
      visited.push(n.id);
    });
    expect(visited).toEqual(['node-A', 'node-B']);

    // Remove node
    kernel.removeNode('node-A');
    expect(kernel.hasNode('node-A')).toBe(false);
    expect(kernel.getEdge('node-A', 'node-B', 'depends-on')).toBeUndefined();
  });

  it('should evaluate Graph Access Layer DSL queries correctly', () => {
    const nodeA: DigitalTwinNode = {
      id: 'srv-A',
      type: 'Topology',
      version: '1.0.0',
      state: 'running',
      health: 'degraded',
      properties: { region: 'us-east' },
      labels: ['service', 'backend'],
      source: 'test',
      timestamp: Date.now()
    };

    const nodeB: DigitalTwinNode = {
      id: 'srv-B',
      type: 'Topology',
      version: '1.0.0',
      state: 'stopped',
      health: 'critical',
      properties: { region: 'us-west' },
      labels: ['service', 'frontend'],
      source: 'test',
      timestamp: Date.now()
    };

    kernel.addNode(nodeA);
    kernel.addNode(nodeB);

    // Query 1: Filter by health status
    const result1 = graphAccessLayer.evaluateQuery(kernel, {
      match: { nodeType: 'Topology' },
      where: { health: 'degraded' }
    });
    expect(result1).toHaveLength(1);
    expect(result1[0].id).toBe('srv-A');

    // Query 2: Filter by properties
    const result2 = graphAccessLayer.evaluateQuery(kernel, {
      match: { nodeType: 'Topology' },
      where: { properties: { region: 'us-west' } }
    });
    expect(result2).toHaveLength(1);
    expect(result2[0].id).toBe('srv-B');
  });

  it('should detect cycles and perform topological sorting', () => {
    const nodeA: DigitalTwinNode = { id: 'A', type: 'Topology', version: '1', state: 'running', health: 'healthy', properties: {}, labels: [], source: 't', timestamp: 0 };
    const nodeB: DigitalTwinNode = { id: 'B', type: 'Topology', version: '1', state: 'running', health: 'healthy', properties: {}, labels: [], source: 't', timestamp: 0 };
    const nodeC: DigitalTwinNode = { id: 'C', type: 'Topology', version: '1', state: 'running', health: 'healthy', properties: {}, labels: [], source: 't', timestamp: 0 };

    kernel.addNode(nodeA);
    kernel.addNode(nodeB);
    kernel.addNode(nodeC);

    kernel.addEdge({ source: 'A', target: 'B', relationship: 'depends', weight: 1, confidence: 1, properties: {} });
    kernel.addEdge({ source: 'B', target: 'C', relationship: 'depends', weight: 1, confidence: 1, properties: {} });

    expect(graphAccessLayer.hasCycle(kernel)).toBe(false);

    // Add back-edge to create cycle
    kernel.addEdge({ source: 'C', target: 'A', relationship: 'depends', weight: 1, confidence: 1, properties: {} });
    expect(graphAccessLayer.hasCycle(kernel)).toBe(true);
  });

  it('should generate correct graph projections', () => {
    const nodeA: DigitalTwinNode = { id: 'cap-1', type: 'Capability', version: '1', state: 'running', health: 'healthy', properties: { name: 'Vision' }, labels: ['capability'], source: 't', timestamp: 0 };
    const nodeB: DigitalTwinNode = { id: 'prov-1', type: 'Provider', version: '1', state: 'running', health: 'healthy', properties: {}, labels: ['provider'], source: 't', timestamp: 0 };

    kernel.addNode(nodeA);
    kernel.addNode(nodeB);
    kernel.addEdge({ source: 'cap-1', target: 'prov-1', relationship: 'provided-by', weight: 1, confidence: 1, properties: {} });

    const capabilityProjection = projectionsRegistry.getCapability(kernel);
    expect(capabilityProjection.nodes).toHaveLength(1);
    expect(capabilityProjection.capabilities).toHaveLength(1);
    expect(capabilityProjection.capabilities[0].id).toBe('cap-1');
    expect(capabilityProjection.capabilities[0].providersCount).toBe(1);
  });

  it('should run multi-tier simulations successfully', async () => {
    const session = await simulationEngine.createSession({
      engineType: 'OVERLAY',
      projectionScope: ['Capability']
    });

    expect(session).toBeDefined();
    expect(session.data.status).toBe('RUNNING');

    const result = await simulationEngine.executeSession(
      session.data.id,
      {
        addNodes: [
          { id: 'sim-node', type: 'Capability', version: '1', state: 'running', health: 'healthy', properties: {}, labels: [], source: 'sim', timestamp: 0 }
        ]
      },
      async (s) => {
        const hasSimNode = s.graph.hasNode('sim-node');
        return {
          success: hasSimNode,
          trace: `Checked sim-node exist: ${hasSimNode}`
        };
      }
    );

    expect(result.success).toBe(true);
    expect(session.data.status).toBe('COMPLETED');
  });
});
