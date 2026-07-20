// src/app/api/v1/pik/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformTwin } from '@/platform/pik/twin/PlatformDigitalTwin';
import { optimizationEngine } from '@/platform/pik/OptimizationEngine';
import { platformDiscoveryEngine } from '@/platform/pik/kernel/evolution/PlatformDiscoveryEngine';
import { architecturalGovernanceEngine } from '@/platform/pik/kernel/evolution/ArchitecturalGovernanceEngine';
import { platformPlanningEngine } from '@/platform/pik/kernel/planning/PlatformPlanningEngine';
import { architecturalMemorySystem } from '@/platform/pik/kernel/memory/ArchitecturalMemorySystem';
import { missionOrchestrator } from '@/platform/mission/MissionOrchestrator';
import prisma from '@/infrastructure/db/prisma';

export async function GET() {
  try {
    // 1. Fetch latest maturity/fitness indicators
    const latestMaturity = await prisma.maturityHistory.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    const afi = latestMaturity ? latestMaturity.architecture : 98;
    const pmi = latestMaturity ? latestMaturity.engineering : 94;

    // 2. Fetch technical debt backlog
    const techDebt = await prisma.remediationHistory.findMany({
      orderBy: { timestamp: 'desc' }
    });

    // 3. Fetch engineering requests (UniversalExecutions)
    const requests = await prisma.universalExecution.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mappedRequests = requests.map(r => ({
      id: r.id,
      intent: r.intent,
      status: r.status,
      createdAt: r.createdAt,
      entities: JSON.parse(r.capability || '[]'),
      riskProfile: JSON.parse(r.metadata || '{}'),
      executionPlan: JSON.parse(r.executionPlan || '{}')
    }));

    // 4. Fetch Digital Twin topology
    const topology = platformTwin.getTopology();

    // 5. Fetch Optimization recommendations
    const optimizations = optimizationEngine.getPendingAdvisory();

    // 6. Fetch Architectural Memories
    const memories = architecturalMemorySystem.getMemories();

    // 7. Fetch Latest Drift Log
    const latestDrift = await prisma.digitalTwinDriftLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    // 8. Fetch EMO missions
    const engineeringMissions = await missionOrchestrator.listMissions();

    const responseData = {
      healthScore: platformTwin.getPlatformHealthScore ? platformTwin.getPlatformHealthScore() : 98.5,
      afi,
      pmi,
      releaseReadiness: afi >= 90 && pmi >= 85 ? 'READY' : 'DEGRADED',
      techDebt: techDebt.map(d => ({
        id: d.id,
        category: d.problemId,
        severity: d.priority,
        probableRootCause: d.probableRootCause,
        estimatedEffortMinutes: d.estimatedEffortMinutes,
        confidenceScore: d.confidenceScore,
        status: d.status,
        remediationSteps: JSON.parse(d.remediationSteps || '[]'),
        evidence: JSON.parse(d.estimatedImpact || '[]')
      })),
      engineeringRequests: mappedRequests,
      engineeringMissions,
      topology,
      optimizations,
      memories,
      driftStatus: latestDrift ? {
        timestamp: latestDrift.timestamp,
        detectedDrift: latestDrift.detectedDrift,
        nodesDrifted: latestDrift.nodesDrifted,
        repaired: latestDrift.repaired,
        driftDetails: JSON.parse(latestDrift.driftDetails || '[]')
      } : { detectedDrift: false, repaired: true, nodesDrifted: 0, driftDetails: [] }
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intent, filePaths, requestId, memory } = body;

    if (action === 'discover') {
      const scanResult = await platformDiscoveryEngine.discoverAll();
      return NextResponse.json({
        message: 'Platform Knowledge Ingestion completed successfully.',
        assetsCount: scanResult.assets.length,
        relationsCount: scanResult.relationships.length
      });
    }

    if (action === 'audit') {
      const auditResult = await architecturalGovernanceEngine.runGovernanceAudit();
      return NextResponse.json({
        message: 'Architectural governance audit completed.',
        afi: auditResult.afi,
        pmi: auditResult.pmi,
        findingsCount: auditResult.findings.length
      });
    }

    if (action === 'plan') {
      if (!intent) {
        return NextResponse.json({ error: 'Missing intent for planning proposal.' }, { status: 400 });
      }
      const proposal = await platformPlanningEngine.createPlanningProposal(intent, filePaths || [], 'user');
      return NextResponse.json({
        message: 'Engineering request proposal generated.',
        proposal
      });
    }

    if (action === 'simulate') {
      if (!requestId) {
        return NextResponse.json({ error: 'Missing requestId for simulation.' }, { status: 400 });
      }
      const simResult = await platformPlanningEngine.previewSimulation(requestId);
      return NextResponse.json({
        message: 'Digital Twin simulation completed.',
        success: simResult.success,
        trace: simResult.trace,
        session: simResult.sessionData
      });
    }

    if (action === 'create-memory') {
      if (!memory || !memory.id || !memory.title) {
        return NextResponse.json({ error: 'Invalid memory data payload.' }, { status: 400 });
      }
      await architecturalMemorySystem.ingestMemory(memory);
      return NextResponse.json({
        message: 'Architectural memory ingested and written to documentation.'
      });
    }

    return NextResponse.json(
      { error: 'Invalid cockpit action. Supported: discover | audit | plan | simulate | create-memory' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
