// src/platform/pik/kernel/impact-analysis/ChangeImpactAnalyzer.ts
import { GraphKernel } from '../../../control-plane/digital-twin/core/GraphKernel';
import { graphAccessLayer } from '../../../control-plane/digital-twin/core/GraphAccessLayer';
import { knowledgeGraphEngine } from '../../../knowledge/KnowledgeGraphEngine';
import { EngineeringRequest } from '../../types';
import prisma from '../../../../infrastructure/db/prisma';

export class ChangeImpactAnalyzer {
  private static instance: ChangeImpactAnalyzer | null = null;

  private constructor() {}

  public static getInstance(): ChangeImpactAnalyzer {
    if (!ChangeImpactAnalyzer.instance) {
      ChangeImpactAnalyzer.instance = new ChangeImpactAnalyzer();
    }
    return ChangeImpactAnalyzer.instance;
  }

  /**
   * Constructs a GraphKernel from the current Engineering Knowledge Graph.
   */
  public buildKernelFromEKG(): GraphKernel {
    const kernel = new GraphKernel();
    const nodes = knowledgeGraphEngine.getNodes();
    const edges = knowledgeGraphEngine.getRelationships();

    nodes.forEach(n => {
      kernel.addNode({
        id: n.id,
        type: n.type as any,
        version: n.version,
        state: n.properties.state || 'running',
        health: n.properties.health || 'healthy',
        properties: n.properties,
        labels: [n.type],
        source: 'ekg',
        timestamp: Date.now()
      });
    });

    edges.forEach(e => {
      kernel.addEdge({
        source: e.sourceId,
        target: e.targetId,
        relationship: e.type,
        weight: e.weight,
        confidence: e.trustScore,
        properties: e.metadata || {}
      });
    });

    return kernel;
  }

  /**
   * Performs an architectural reasoning and impact analysis for an engineering request.
   */
  public async analyzeRequest(request: Partial<EngineeringRequest> & { filePaths?: string[] }): Promise<any> {
    const kernel = this.buildKernelFromEKG();
    const resolvedEntityIds: string[] = [];

    // 1. Resolve inputs (intents or file paths) to EKG component nodes
    if (request.filePaths) {
      request.filePaths.forEach(fp => {
        const id = `code:${fp.replace(/\\/g, '/')}`;
        if (kernel.hasNode(id)) {
          resolvedEntityIds.push(id);
        }
      });
    }

    if (request.intent) {
      // Find EKG nodes whose label or description matches the intent
      const intentLower = request.intent.toLowerCase();
      const matched = kernel.getAllNodes().filter(n => 
        n.id.toLowerCase().includes(intentLower) || 
        (n.properties.name && n.properties.name.toLowerCase().includes(intentLower)) ||
        (n.properties.description && n.properties.description.toLowerCase().includes(intentLower))
      );
      matched.forEach(m => resolvedEntityIds.push(m.id));
    }

    // Deduplicate resolved entities
    const targetEntities = Array.from(new Set(resolvedEntityIds));

    // 2. Perform graph traversals to compute Impact Graph
    const impactSet = new Set<string>();
    const dependencySet = new Set<string>();
    const validatesTests = new Set<string>();
    const documentsDocs = new Set<string>();
    const governsADRs = new Set<string>();

    targetEntities.forEach(entityId => {
      // Downstream impact (transitive dependents)
      const radius = graphAccessLayer.getImpactRadius(kernel, entityId, 'depends_on');
      radius.forEach(id => impactSet.add(id));

      // Upstream dependencies (transitive dependencies)
      const closure = graphAccessLayer.getDependencyClosure(kernel, entityId, 'depends_on');
      closure.forEach(id => dependencySet.add(id));

      // Specific relationship queries in EKG
      const incomingEdges = kernel.getIncomingEdges(entityId);
      incomingEdges.forEach(e => {
        if (e.relationship === 'validates') validatesTests.add(e.source);
        if (e.relationship === 'documents') documentsDocs.add(e.source);
        if (e.relationship === 'governs') governsADRs.add(e.source);
      });
    });

    const affectedComponents = Array.from(impactSet);
    const validatingTests = Array.from(validatesTests);
    const documentingDocs = Array.from(documentsDocs);
    const governingADRs = Array.from(governsADRs);

    // 3. Score multi-dimensional risks
    const architecturalRisk = this.calculateArchitecturalRisk(targetEntities, affectedComponents, kernel);
    const securityRisk = this.calculateSecurityRisk(targetEntities, affectedComponents);
    const operationalRisk = this.calculateOperationalRisk(targetEntities, affectedComponents, kernel);
    const governanceRisk = this.calculateGovernanceRisk(governingADRs);
    const performanceRisk = this.calculatePerformanceRisk(targetEntities, affectedComponents);
    const overallRisk = Math.max(architecturalRisk, securityRisk, operationalRisk, governanceRisk, performanceRisk);

    // 4. Estimate Complexity and Effort
    const complexityScore = Math.min(100, Math.round((targetEntities.length * 15) + (affectedComponents.length * 5)));
    const estimatedEffortMinutes = (targetEntities.length * 240) + (affectedComponents.length * 60); // 4 hrs per direct, 1 hr per indirect
    
    // Confidence based on test coverage mapping
    const testCount = validatingTests.length;
    const confidenceScore = testCount > 0 ? Math.min(1.0, 0.5 + (testCount * 0.1)) : 0.4;

    const result = {
      entities: targetEntities,
      affectedComponents,
      dependencies: Array.from(dependencySet),
      validatingTests,
      documentingDocs,
      governingADRs,
      riskProfile: {
        architectural: architecturalRisk,
        operational: operationalRisk,
        security: securityRisk,
        governance: governanceRisk,
        performance: performanceRisk,
        overall: overallRisk
      },
      complexity: complexityScore,
      estimatedEffortMinutes,
      confidence: confidenceScore,
      timestamp: new Date().toISOString()
    };

    return result;
  }

  private calculateArchitecturalRisk(targets: string[], affected: string[], kernel: GraphKernel): number {
    // If we are modifying the platform kernel or control plane directly, or if we introduce cycles
    let score = 10; // baseline
    
    const hasCoreTarget = targets.some(id => id.includes('/kernel/') || id.includes('/control-plane/'));
    if (hasCoreTarget) score += 40;

    // Add penalty based on number of affected components
    score += Math.min(30, affected.length * 3);

    // Cycle check
    if (graphAccessLayer.hasCycle(kernel)) {
      score += 20; // circular dependency penalty
    }

    return Math.min(100, score);
  }

  private calculateSecurityRisk(targets: string[], affected: string[]): number {
    // If target files touch authentication, authorization, cryptography, secrets or permissions
    let score = 10;
    const securityKeywords = ['auth', 'rbac', 'secrets', 'crypto', 'token', 'lockout', 'permission'];
    
    const touchesSecurity = [...targets, ...affected].some(id => 
      securityKeywords.some(kw => id.toLowerCase().includes(kw))
    );

    if (touchesSecurity) {
      score += 70; // major security impact
    }

    return Math.min(100, score);
  }

  private calculateOperationalRisk(targets: string[], affected: string[], kernel: GraphKernel): number {
    // Operational risk based on workflow usage
    let score = 10;
    const workflowCount = kernel.getAllNodes().filter(n => (n.type as string) === 'workflow').length;
    
    // If we affect components that are heavily depended upon
    score += Math.min(40, affected.length * 4);
    score += Math.min(30, workflowCount * 2);

    return Math.min(100, score);
  }

  private calculateGovernanceRisk(governingADRs: string[]): number {
    // If there are many ADRs governing the code, risk is higher because design rules must be respected
    let score = 10;
    score += Math.min(80, governingADRs.length * 15);
    return Math.min(100, score);
  }

  private calculatePerformanceRisk(targets: string[], affected: string[]): number {
    // If modifying heavy components like models or caches
    let score = 10;
    const hasPerfTarget = [...targets, ...affected].some(id => 
      id.includes('model:') || id.includes('database:') || id.includes('cache')
    );
    if (hasPerfTarget) score += 50;
    return Math.min(100, score);
  }
}

export const changeImpactAnalyzer = ChangeImpactAnalyzer.getInstance();
export default changeImpactAnalyzer;
