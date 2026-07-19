// src/platform/control-plane/digital-twin/simulation/SimulationEngine.ts
import { SimulationSession } from './SimulationSession';
import { convergenceEngine } from '../synchronization/ConvergenceEngine';
import prisma from '../../../../infrastructure/db/prisma';

export class SimulationEngine {
  private static instance: SimulationEngine | null = null;
  private activeSessions: Map<string, SimulationSession> = new Map();

  private constructor() {}

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  /**
   * Spawns a new SimulationSession against a CoW clone of the canonical graph
   */
  public async createSession(params: {
    engineType: 'OVERLAY' | 'BRANCH' | 'SANDBOX';
    projectionScope: string[];
    parentSessionId?: string;
  }): Promise<SimulationSession> {
    const canonical = convergenceEngine.getCanonicalGraph();
    const sessionId = `sim-session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const sessionData = {
      id: sessionId,
      parentSessionId: params.parentSessionId,
      snapshotVersion: 'latest',
      executionEngine: params.engineType,
      projectionScope: params.projectionScope,
      deltaPayload: {},
      policiesChecked: [],
      status: 'RUNNING' as const,
      createdAt: Date.now()
    };

    const session = new SimulationSession(sessionData, canonical);
    this.activeSessions.set(sessionId, session);

    // Save to relational database
    try {
      await prisma.simulationSession.create({
        data: {
          id: sessionId,
          parentSessionId: params.parentSessionId || null,
          snapshotVersion: 'latest',
          executionEngine: params.engineType,
          projectionScope: JSON.stringify(params.projectionScope),
          deltaPayload: JSON.stringify({}),
          policiesChecked: JSON.stringify([]),
          status: 'RUNNING',
        }
      });
    } catch (err: any) {
      console.error('[SimulationEngine] Failed to save SimulationSession to DB:', err.message);
    }

    return session;
  }

  public getSession(id: string): SimulationSession | undefined {
    return this.activeSessions.get(id);
  }

  /**
   * Executes a simulated workload within a session context
   */
  public async executeSession(
    sessionId: string,
    delta: any,
    evaluator: (session: SimulationSession) => Promise<{ success: boolean; trace: string; evidenceHash?: string }>
  ): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Simulation session not found: ${sessionId}`);
    }

    try {
      // 1. Apply mutations/deltas to the session's branched graph
      session.applyDelta(delta);

      // 2. Execute verification rules or EIE checks
      const result = await evaluator(session);

      // 3. Complete the session
      session.complete(
        result.success ? 'COMPLETED' : 'FAILED',
        result.trace,
        result.evidenceHash
      );

      // 4. Persist result updates
      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          status: session.data.status,
          deltaPayload: JSON.stringify(session.data.deltaPayload),
          reasoningTrace: result.trace,
          evidenceHash: result.evidenceHash || null,
          completedAt: new Date(session.data.completedAt!)
        }
      });

      return result;
    } catch (err: any) {
      session.complete('FAILED', `Execution failed: ${err.message}`);
      
      await prisma.simulationSession.update({
        where: { id: sessionId },
        data: {
          status: 'FAILED',
          reasoningTrace: `Execution failed: ${err.message}`,
          completedAt: new Date()
        }
      });
      throw err;
    } finally {
      // Remove overlay sessions from active cache to free memory
      if (session.data.executionEngine === 'OVERLAY') {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}
export const simulationEngine = SimulationEngine.getInstance();
export default simulationEngine;
