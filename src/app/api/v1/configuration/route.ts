import { NextRequest, NextResponse } from "next/server";
import { centralConfig } from "@/infrastructure/sdk/platform-sdk";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (serviceId) {
      const serviceConfig = centralConfig.getProviderConfig(serviceId);
      return NextResponse.json(serviceConfig);
    }

    const allConfig = centralConfig.getAllConfig();
    return NextResponse.json(allConfig);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, config } = body;

    if (!serviceId || !config || typeof config !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid serviceId or config payload" },
        { status: 400 }
      );
    }

    // Merge key values into central config
    const prefix = serviceId === "local-artifact-storage-provider" ? "artifacts" : serviceId.replace("-provider", "");
    for (const [key, value] of Object.entries(config)) {
      centralConfig.set(`${prefix}.${key}`, value);
    }

    return NextResponse.json({
      serviceId,
      success: true,
      message: `Configuration for ${serviceId} updated successfully`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
