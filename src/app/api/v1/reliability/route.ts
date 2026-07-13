import { NextResponse } from "next/server";
import { srePlatform } from "@/infrastructure/reliability/SREPlatform";
import { chaosPlatform } from "@/infrastructure/reliability/ChaosPlatform";
import { incidentManager } from "@/infrastructure/reliability/IncidentManager";
import { disasterRecovery } from "@/infrastructure/reliability/DisasterRecovery";
import { capacityEngine } from "@/infrastructure/reliability/CapacityEngine";
import { diagnosticsEngine } from "@/infrastructure/reliability/DiagnosticsEngine";
import { readinessReport } from "@/infrastructure/reliability/ReadinessReport";
import { riskRegister } from "@/infrastructure/reliability/RiskRegister";
import { selfHealingFramework } from "@/infrastructure/reliability/SelfHealingFramework";
import { serviceMeshLayer } from "@/infrastructure/reliability/ServiceMeshLayer";
import { reliabilityStore } from "@/infrastructure/reliability/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sreReport = srePlatform.getSloReport();
    const faults = chaosPlatform.getFaults();
    const resilienceScore = chaosPlatform.getResilienceScore();
    const incidents = incidentManager.getIncidents();
    const incidentMetrics = incidentManager.getIncidentMetrics();
    const drStatus = disasterRecovery.getDRStatus();
    const backups = reliabilityStore.getState().backups;
    const capacityForecasts = await capacityEngine.getCapacityForecasts();
    const deepDiagnostics = await diagnosticsEngine.runDeepDiagnostics();
    const report = readinessReport.getReport();
    const risks = riskRegister.getRisks();
    const meshRoutes = serviceMeshLayer.getMeshRoutes();
    const chaosRuns = reliabilityStore.getState().chaosRuns;

    return NextResponse.json({
      sre: sreReport,
      chaos: {
        faults,
        resilienceScore,
        chaosRuns
      },
      incidents: {
        list: incidents,
        metrics: incidentMetrics
      },
      dr: {
        status: drStatus,
        backups
      },
      capacity: capacityForecasts,
      diagnostics: deepDiagnostics,
      readiness: report,
      risks,
      mesh: meshRoutes
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "chaos_inject": {
        const { faultId } = body;
        if (!faultId) return NextResponse.json({ error: "Missing faultId" }, { status: 400 });
        const success = await chaosPlatform.injectFault(faultId);
        return NextResponse.json({ success });
      }

      case "chaos_recover": {
        const { faultId } = body;
        if (!faultId) return NextResponse.json({ error: "Missing faultId" }, { status: 400 });
        const success = await chaosPlatform.recoverFault(faultId);
        return NextResponse.json({ success });
      }

      case "backup": {
        const { type } = body;
        if (!type) return NextResponse.json({ error: "Missing backup type" }, { status: 400 });
        const success = await disasterRecovery.performBackup(type);
        return NextResponse.json({ success });
      }

      case "failover_drill": {
        const success = await disasterRecovery.executeFailoverDrill();
        return NextResponse.json({ success });
      }

      case "heal": {
        const result = await selfHealingFramework.executeHealingCycle();
        return NextResponse.json({ result });
      }

      case "traffic_split": {
        const { serviceId, canaryPercent } = body;
        if (!serviceId || canaryPercent === undefined) {
          return NextResponse.json({ error: "Missing serviceId or canaryPercent" }, { status: 400 });
        }
        const success = await serviceMeshLayer.configureTrafficSplit(serviceId, canaryPercent);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: `Unknown action: '${action}'` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
