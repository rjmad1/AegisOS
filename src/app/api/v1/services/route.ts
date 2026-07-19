import { NextRequest, NextResponse } from "next/server";
import { deploymentManager } from "@/infrastructure/sdk/platform-sdk";

export async function GET() {
  try {
    const list = await deploymentManager.getServicesStatus();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, action } = body;

    if (!serviceId || !action || !["start", "stop", "restart"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: serviceId, action (start | stop | restart)" },
        { status: 400 }
      );
    }

    const success = await deploymentManager.controlService(serviceId, action);
    if (!success) {
      return NextResponse.json(
        { error: `Service with ID ${serviceId} could not be managed` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      serviceId,
      action,
      success: true,
      message: `Lifecycle execution target '${action}' triggered for ${serviceId}`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
