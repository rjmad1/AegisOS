import { NextResponse } from "next/server";
import { srePlatform } from "@/infrastructure/sdk/platform-sdk";
import { chaosPlatform } from "@/infrastructure/sdk/platform-sdk";
import { incidentManager } from "@/infrastructure/sdk/platform-sdk";
import { disasterRecovery } from "@/infrastructure/sdk/platform-sdk";
import { capacityEngine } from "@/infrastructure/sdk/platform-sdk";
import { diagnosticsEngine } from "@/infrastructure/sdk/platform-sdk";
import { readinessReport } from "@/infrastructure/sdk/platform-sdk";
import { riskRegister } from "@/infrastructure/sdk/platform-sdk";
import { selfHealingFramework } from "@/infrastructure/sdk/platform-sdk";
import { serviceMeshLayer } from "@/infrastructure/sdk/platform-sdk";
import { reliabilityStore } from "@/infrastructure/sdk/platform-sdk";
import { executionRuntimeService } from "@/services/execution-runtime.service";

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

    const uExec = await executionRuntimeService.createExecution(
      `SRE Action: ${action}`,
      { userId: "usr-admin-01", role: "admin" }
    );
    uExec.metadata.body = body;

    const isValid = await executionRuntimeService.validateExecution(uExec.executionId);
    if (!isValid) {
      throw new Error(uExec.error || "Validation failed for SRE Action.");
    }

    await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Started", "sre", "reliability-endpoint");

    try {
      let result;
      switch (action) {
        case "chaos_inject": {
          const { faultId } = body;
          if (!faultId) return NextResponse.json({ error: "Missing faultId" }, { status: 400 });
          const success = await chaosPlatform.injectFault(faultId);
          result = { success };
          break;
        }

        case "chaos_recover": {
          const { faultId } = body;
          if (!faultId) return NextResponse.json({ error: "Missing faultId" }, { status: 400 });
          const success = await chaosPlatform.recoverFault(faultId);
          result = { success };
          break;
        }

        case "backup": {
          const { type } = body;
          if (!type) return NextResponse.json({ error: "Missing backup type" }, { status: 400 });
          const success = await disasterRecovery.performBackup(type);
          result = { success };
          break;
        }

        case "failover_drill": {
          const success = await disasterRecovery.executeFailoverDrill();
          result = { success };
          break;
        }

        case "heal": {
          const healResult = await selfHealingFramework.executeHealingCycle();
          result = { result: healResult };
          break;
        }

        case "traffic_split": {
          const { serviceId, canaryPercent } = body;
          if (!serviceId || canaryPercent === undefined) {
            return NextResponse.json({ error: "Missing serviceId or canaryPercent" }, { status: 400 });
          }
          const success = await serviceMeshLayer.configureTrafficSplit(serviceId, canaryPercent);
          result = { success };
          break;
        }

        default:
          return NextResponse.json({ error: `Unknown action: '${action}'` }, { status: 400 });
      }

      uExec.metadata.result = result;
      await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Completed", "sre", "reliability-endpoint");
      await executionRuntimeService.completeExecution(uExec.executionId);

      return NextResponse.json(result);
    } catch (err: any) {
      await executionRuntimeService.failExecution(uExec.executionId, err.message);
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
