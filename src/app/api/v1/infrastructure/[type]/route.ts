// ============================================================================
// Infrastructure API — GET /api/v1/infrastructure/[type]
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { infrastructureService } from "@/services/infrastructure.service";
import { handleCaching } from "@/utils/api-helper";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const url = new URL(request.url);

    let result: any = null;

    switch (type) {
      case "host":
        result = await infrastructureService.getHost();
        break;

      case "cpu":
        result = await infrastructureService.getCpu();
        break;

      case "memory":
        result = await infrastructureService.getMemory();
        break;

      case "gpu":
        result = await infrastructureService.getGpu();
        break;

      case "storage": {
        const disks = await infrastructureService.getDisks();
        const filesystems = await infrastructureService.getFilesystems();
        result = { disks, filesystems };
        break;
      }

      case "network": {
        const interfaces = await infrastructureService.getNetworkInterfaces();
        const connections = await infrastructureService.getNetworkConnections();
        result = { interfaces, connections };
        break;
      }

      case "processes": {
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") || "25", 10);
        const search = url.searchParams.get("search") || "";
        const sortBy = (url.searchParams.get("sortBy") || "memory") as any;
        const sortOrder = (url.searchParams.get("sortOrder") || "desc") as any;

        const { processes, total } = await infrastructureService.getProcesses({
          page,
          pageSize,
          search,
          sortBy,
          sortOrder
        });

        result = {
          data: processes,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
        break;
      }

      case "services":
        result = await infrastructureService.getServices();
        break;

      case "databases":
        result = await infrastructureService.getDatabases();
        break;

      case "containers":
        result = await infrastructureService.getContainers();
        break;

      case "environment":
        result = await infrastructureService.getEnvironment();
        break;

      case "performance":
        result = {
          snapshots: infrastructureService.getPerformanceHistory()
        };
        break;

      case "health": {
        const host = await infrastructureService.getHost();
        const alerts = infrastructureService.getAlerts();
        const thresholds = infrastructureService.getThresholds();
        result = {
          status: host.healthStatus,
          uptime: host.uptime,
          alerts,
          thresholds
        };
        break;
      }

      default:
        return Response.json(
          { error: `Unknown infrastructure resource type: '${type}'` },
          { status: 404 }
        );
    }

    return handleCaching(request, result);
  } catch (err: any) {
    console.error("[InfrastructureAPI] Error fetching data:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
