// src/platform/control-plane/digital-twin/projections/ProjectionsRegistry.ts
import { GraphKernel } from '../core/GraphKernel';
import { DigitalTwinNode } from '../core/node';
import { DigitalTwinEdge } from '../core/edge';
import { 
  GraphProjection, 
  TopologyProjection, 
  CapabilityProjection, 
  DependencyProjection 
} from './projection-types';
import { graphAccessLayer } from '../core/GraphAccessLayer';

export class ProjectionsRegistry {
  private static instance: ProjectionsRegistry | null = null;

  private constructor() {}

  public static getInstance(): ProjectionsRegistry {
    if (!ProjectionsRegistry.instance) {
      ProjectionsRegistry.instance = new ProjectionsRegistry();
    }
    return ProjectionsRegistry.instance;
  }

  /**
   * Universal base projector helper. Filters graph by node types and edge relationship types.
   */
  public projectBase(
    kernel: GraphKernel, 
    projectionType: string,
    nodeFilter: (node: DigitalTwinNode) => boolean,
    edgeFilter?: (edge: DigitalTwinEdge) => boolean
  ): GraphProjection {
    const nodes = kernel.getAllNodes().filter(nodeFilter);
    const nodeIds = new Set(nodes.map(n => n.id));
    
    const edges = kernel.getAllEdges().filter(edge => {
      // By default, only keep edges whose source and target are in the filtered node set
      const inScope = nodeIds.has(edge.source) && nodeIds.has(edge.target);
      return inScope && (edgeFilter ? edgeFilter(edge) : true);
    });

    return {
      nodes,
      edges,
      metadata: {
        projectionType,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        timestamp: Date.now()
      }
    };
  }

  public getTopology(kernel: GraphKernel): TopologyProjection {
    const base = this.projectBase(
      kernel,
      'Topology',
      (node) => ['Topology', 'Runtime', 'Resource'].includes(node.type) || node.labels.includes('topology')
    );

    const healthyCount = base.nodes.filter(n => n.health === 'healthy').length;
    const degradedCount = base.nodes.filter(n => n.health === 'degraded' || n.health === 'warning').length;
    const criticalCount = base.nodes.filter(n => n.health === 'critical').length;

    return {
      ...base,
      metadata: {
        projectionType: 'Topology',
        nodeCount: base.nodes.length,
        edgeCount: base.edges.length,
        timestamp: Date.now(),
        healthyCount,
        degradedCount,
        criticalCount
      }
    };
  }

  public getCapability(kernel: GraphKernel): CapabilityProjection {
    const base = this.projectBase(
      kernel,
      'Capability',
      (node) => node.type === 'Capability'
    );

    const capabilities = base.nodes.map(node => {
      const providersCount = kernel.getOutgoingEdges(node.id)
        .filter(e => e.relationship === 'provided-by' || e.relationship === 'uses-provider').length;
      return {
        id: node.id,
        name: node.properties.name || node.id,
        status: node.health,
        providersCount
      };
    });

    return {
      ...base,
      capabilities
    };
  }

  public getDependency(kernel: GraphKernel): DependencyProjection {
    const base = this.projectBase(
      kernel,
      'Dependency',
      (node) => node.type === 'Dependency' || node.labels.includes('dependency')
    );

    const cyclesDetected = graphAccessLayer.hasCycle(kernel);
    const violationsCount = base.nodes.filter(n => n.health === 'critical' || n.properties.violation).length;

    return {
      ...base,
      cyclesDetected,
      violationsCount
    };
  }

  public getWorkflow(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Workflow',
      (node) => node.type === 'Workflow'
    );
  }

  public getProvider(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Provider',
      (node) => node.type === 'Provider'
    );
  }

  public getRuntime(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Runtime',
      (node) => node.type === 'Runtime'
    );
  }

  public getEvidence(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Evidence',
      (node) => node.type === 'Evidence'
    );
  }

  public getResource(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Resource',
      (node) => node.type === 'Resource'
    );
  }

  public getGovernance(kernel: GraphKernel): GraphProjection {
    return this.projectBase(
      kernel,
      'Governance',
      (node) => node.type === 'Governance'
    );
  }
}
export const projectionsRegistry = ProjectionsRegistry.getInstance();
export default projectionsRegistry;
