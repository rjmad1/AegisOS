import { NextResponse } from "next/server";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";

export async function GET() {
  try {
    const metrics = deploymentManager.getSystemMetrics();
    return NextResponse.json(metrics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
