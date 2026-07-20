// src/platform/pik/kernel/planning/PlatformPlanningEngine.ts
import * as path from 'path';
import { EngineeringRequest } from '../../types';
import { changeImpactAnalyzer } from '../impact-analysis/ChangeImpactAnalyzer';
import { simulationEngine } from '../../../control-plane/digital-twin/simulation/SimulationEngine';
import { graphAccessLayer } from '../../../control-plane/digital-twin/core/GraphAccessLayer';
import { knowledgeGraphEngine } from '../../../knowledge/KnowledgeGraphEngine';
import prisma from '../../../../infrastructure/db/prisma';

export class PlatformPlanningEngine {
  private static instance: PlatformPlanningEngine | null = null;

  private constructor() {}

  public static getInstance(): PlatformPlanningEngine {
    if (!PlatformPlanningEngine.instance) {
      PlatformPlanningEngine.instance = new PlatformPlanningEngine();
    }
    return PlatformPlanningEngine.instance;
  }

  /**
   * Decomposes an evolution objective/intent into a complete, executable EngineeringRequest.
   */
  public async createPlanningProposal(intent: string, filePaths?: string[], origin: 'user' | 'agent' | 'system' = 'user'): Promise<EngineeringRequest> {
    const requestId = `eng-req-${Date.now()}`;
    
    // 1. Analyze impact first
    const analysis = await changeImpactAnalyzer.analyzeRequest({ intent, filePaths });

    // 2. Decompose into tasks
    const tasks: string[] = [];
    analysis.entities.forEach((entId: string) => {
      const name = entId.split(':').pop();
      tasks.push(`Modify and implement changes in ${name}`);
    });
    analysis.affectedComponents.forEach((entId: string) => {
      const name = entId.split(':').pop();
      tasks.push(`Refactor dependent component: ${name} to maintain compatibility`);
    });

    if (analysis.governingADRs.length > 0) {
      tasks.push(`Verify alignment with governing ADRs: ${analysis.governingADRs.map((id: string) => id.split(':').pop()).join(', ')}`);
    }

    // 3. Collect required tests and docs
    const requiredTests = analysis.validatingTests.map((tId: string) => tId.split(':').pop() || tId);
    const requiredDocs = analysis.documentingDocs.map((dId: string) => dId.split(':').pop() || dId);

    // If no tests are mapped, suggest creating a new test file
    if (requiredTests.length === 0 && filePaths && filePaths.length > 0) {
      filePaths.forEach(fp => {
        const testPath = fp.replace('.ts', '.test.ts');
        requiredTests.push(`[NEW] ${path.basename(testPath)}`);
        tasks.push(`Create unit test file: ${testPath}`);
      });
    }

    // 4. Construct rollback instructions
    let rollbackPayload = '';
    if (filePaths && filePaths.length > 0) {
      rollbackPayload = JSON.stringify({
        action: 'GIT_REVERT',
        files: filePaths,
        backupBranch: `backup-${requestId}`
      });
    } else {
      rollbackPayload = JSON.stringify({
        action: 'RESTORE_SNAP',
        snapshotVersion: 'latest'
      });
    }

    const proposal: EngineeringRequest = {
      id: requestId,
      type: filePaths && filePaths.length > 0 ? 'file_modification' : 'intent',
      intent,
      origin,
      entities: analysis.entities,
      riskProfile: analysis.riskProfile,
      executionPlan: {
        tasks,
        requiredTests,
        requiredDocs,
        rollbackPayload
      },
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // 5. Persist as UniversalExecution in the database to comply with Part II
    await this.persistProposal(proposal);

    return proposal;
  }

  /**
   * Simulates the planning proposal against the Digital Twin.
   */
  public async previewSimulation(requestId: string): Promise<{ success: boolean; trace: string; sessionData: any }> {
    const proposal = await this.loadProposal(requestId);
    if (!proposal) {
      throw new Error(`Planning proposal not found: ${requestId}`);
    }

    // Update status to simulating
    await this.updateProposalStatus(requestId, 'SIMULATING');

    // Create Digital Twin overlay session
    const session = await simulationEngine.createSession({
      engineType: 'OVERLAY',
      projectionScope: proposal.entities
    });

    const delta = {
      addNodes: [] as any[],
      updateNodes: [] as any[]
    };

    proposal.entities.forEach(id => {
      // Create session first, but we check if node exists
      const nodeExists = session.graph.hasNode(id);
      if (nodeExists) {
        delta.updateNodes.push({
          id,
          updates: { state: 'degraded', health: 'warning', properties: { isSimulated: true } }
        });
      } else {
        const ekgNode = knowledgeGraphEngine.getNode(id);
        delta.addNodes.push({
          id,
          type: ekgNode ? ekgNode.type : 'code',
          version: ekgNode ? ekgNode.version : '1.0.0',
          state: 'degraded',
          health: 'warning',
          properties: ekgNode ? { ...ekgNode.properties, isSimulated: true } : { isSimulated: true },
          labels: ekgNode ? [ekgNode.type] : ['code'],
          source: 'simulation',
          timestamp: Date.now()
        });
      }
    });

    // Execute simulation with our specific policy evaluator
    const result = await simulationEngine.executeSession(session.data.id, delta, async (sess) => {
      let success = true;
      const traceLines: string[] = ['[Simulation] Initiating EKG-Twin validation...'];

      // Rule 1: Acyclic check (no dependency loops allowed in new proposal)
      const hasCycles = graphAccessLayer.hasCycle(sess.graph);
      if (hasCycles) {
        success = false;
        traceLines.push('❌ [CYCLE_DETECTOR] Circular dependency loop detected in simulated graph overlay!');
      } else {
        traceLines.push('✅ [CYCLE_DETECTOR] Dependency graph is clean and acyclic.');
      }

      // Rule 2: Essential platform dependency status check
      proposal.entities.forEach(id => {
        const node = sess.graph.getNode(id);
        if (node) {
          traceLines.push(`[SIM] Evaluating affected node: ${node.id} (${node.health})`);
        }
      });

      return {
        success,
        trace: traceLines.join('\n'),
        evidenceHash: `ev-sim-${Date.now()}`
      };
    });

    // Update final status based on simulation outcome
    const finalStatus = result.success ? 'APPROVED' : 'FAILED';
    await this.updateProposalStatus(requestId, finalStatus);

    return {
      success: result.success,
      trace: result.trace,
      sessionData: session.data
    };
  }

  private async persistProposal(proposal: EngineeringRequest): Promise<void> {
    try {
      await prisma.universalExecution.create({
        data: {
          id: proposal.id,
          executionId: proposal.id,
          correlationId: proposal.id,
          status: proposal.status,
          userContext: JSON.stringify({ origin: proposal.origin }),
          intent: JSON.stringify({ intentId: proposal.id, confidence: 1.0, rawPrompt: proposal.intent }),
          capability: JSON.stringify(proposal.entities),
          executionPlan: JSON.stringify(proposal.executionPlan),
          priority: proposal.riskProfile.overall > 70 ? 'HIGH' : 'MEDIUM',
          createdAt: proposal.createdAt,
          steps: '[]',
          artifacts: '[]',
          toolsUsed: '[]',
          retryCount: 0,
          maxRetries: 3,
          metadata: JSON.stringify(proposal.riskProfile),
          telemetry: '{}',
          costMetrics: '{}',
          timeline: '[]',
          childExecutions: '[]'
        }
      });
    } catch (err: any) {
      console.error('[PlatformPlanningEngine] Failed to save proposal:', err.message);
    }
  }

  private async loadProposal(requestId: string): Promise<EngineeringRequest | null> {
    try {
      const record = await prisma.universalExecution.findUnique({
        where: { id: requestId }
      });
      if (!record) return null;

      const riskProfile = JSON.parse(record.metadata || '{}');
      const executionPlan = JSON.parse(record.executionPlan || '{}');

      return {
        id: record.id,
        type: record.intent.startsWith('Modify') ? 'file_modification' : 'intent',
        intent: record.intent,
        origin: 'user',
        entities: JSON.parse(record.capability || '[]'),
        riskProfile,
        executionPlan,
        status: record.status as any,
        createdAt: record.createdAt
      };
    } catch {
      return null;
    }
  }

  private async updateProposalStatus(requestId: string, status: EngineeringRequest['status']): Promise<void> {
    try {
      await prisma.universalExecution.update({
        where: { id: requestId },
        data: { status }
      });
    } catch (err: any) {
      console.error('[PlatformPlanningEngine] Failed to update proposal status:', err.message);
    }
  }
}

export const platformPlanningEngine = PlatformPlanningEngine.getInstance();
export default platformPlanningEngine;
