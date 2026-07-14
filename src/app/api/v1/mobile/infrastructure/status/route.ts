// src/app/api/v1/mobile/infrastructure/status/route.ts
// REST endpoint for paired mobile client querying workstation status details

import { NextResponse } from "next/server";
import { infrastructureService } from "@/services/infrastructure.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const host = await infrastructureService.getHost();
    const gpu = await infrastructureService.getGpu();
    const alerts = infrastructureService.getAlerts();

    const status = {
      cpu: {
        load: host.cpu.load,
        cores: host.cpu.cores,
        manufacturer: host.cpu.manufacturer,
        brand: host.cpu.brand,
        temperature: host.cpu.temperature?.current || 42.0,
      },
      memory: {
        total: host.memory.total,
        used: host.memory.used,
        free: host.memory.free,
        percent: Math.round((host.memory.used / host.memory.total) * 100)
      },
      gpu: {
        vendor: gpu.vendor,
        driver: gpu.driver,
        utilization: gpu.devices[0]?.utilization || 0,
        temperature: gpu.devices[0]?.temperature?.current || 0,
        vram: {
          total: gpu.devices[0]?.vram.total || 0,
          used: gpu.devices[0]?.vram.used || 0,
          free: gpu.devices[0]?.vram.free || 0
        }
      },
      disk: {
        installedStorage: host.installedStorage,
        mountedVolumes: host.mountedVolumes
      },
      network: host.networkInterfaces.map((ni) => ({
        name: ni.name,
        ip: ni.ip4,
        mac: ni.mac,
        speed: ni.speed || 1000,
        tx: ni.traffic.txBytes,
        rx: ni.traffic.rxBytes
      })),
      battery: host.powerStatus,
      uptime: host.uptime,
      healthStatus: host.healthStatus,
      alertsCount: alerts.length
    };

    return NextResponse.json(status);
  } catch (err: any) {
    console.error("[MobileStatusAPIError]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
