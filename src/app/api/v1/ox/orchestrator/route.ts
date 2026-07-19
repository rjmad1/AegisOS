// src/app/api/v1/ox/orchestrator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { platformLifecycleOrchestrator } from "@/platform/control-plane/PlatformLifecycleOrchestrator";
import { platformServiceManager } from "@/platform/control-plane/PlatformServiceManager";
import { deploymentManager } from "@/infrastructure/sdk/platform-sdk";
import { dependencyManager } from "@/platform/control-plane/DependencyManager";
import { modelLifecycleManager } from "@/platform/control-plane/ModelLifecycleManager";

export async function GET() {
  try {
    const services = await deploymentManager.getServicesStatus();
    const mode = platformLifecycleOrchestrator.getPlatformMode();
    const dependencyGraph = platformLifecycleOrchestrator.getDependencyGraph();
    const compMatrix = await dependencyManager.getCompatibilityMatrix();
    const modelStatuses = await modelLifecycleManager.getModelStatuses();
    const driftReport = await dependencyManager.detectDrift();

    return NextResponse.json({
      success: true,
      mode,
      services,
      dependencyGraph,
      compatibility: compMatrix,
      models: modelStatuses,
      drift: driftReport
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, serviceId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Missing orchestrator action" }, { status: 400 });
    }

    let success = false;
    let message = "";

    switch (action) {
      case "start-stack":
        success = await platformLifecycleOrchestrator.startPlatform();
        message = "Stack startup sequence initiated in dependency order.";
        break;

      case "stop-stack":
        success = await platformLifecycleOrchestrator.stopPlatform();
        message = "Stack shutdown sequence initiated in reverse dependency order.";
        break;

      case "restart-stack":
        success = await platformLifecycleOrchestrator.restartPlatform();
        message = "Stack restart sequence initiated.";
        break;

      case "service-control":
        if (!serviceId) {
          return NextResponse.json({ error: "Missing serviceId parameter" }, { status: 400 });
        }
        // serviceId can be ollama, litellm, aegisos, omniroute
        // controlService accepts: start, stop, restart
        const controlAction = request.nextUrl.searchParams.get("controlAction") || "start";
        if (!["start", "stop", "restart"].includes(controlAction)) {
          return NextResponse.json({ error: "Invalid control action. Allowed: start | stop | restart" }, { status: 400 });
        }
        success = await deploymentManager.controlService(serviceId, controlAction as any);
        message = `Triggered '${controlAction}' command for service: ${serviceId}`;
        break;

      case "safe-shutdown":
        success = await platformLifecycleOrchestrator.safeShutdown();
        message = "Platform is shutting down gracefully.";
        break;

      default:
        return NextResponse.json({ error: `Action '${action}' is not supported` }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message,
      mode: platformLifecycleOrchestrator.getPlatformMode()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
