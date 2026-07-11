import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const runtime = await runtimeService.getRuntime();
    const versionInfo = {
      version: runtime.version,
      buildNumber: "release-2026.07",
      apiChannel: "stable",
      lastUpdated: new Date(Date.now() - 86400000 * 3).toISOString()
    };
    return handleCaching(request, versionInfo);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
