import { NextRequest, NextResponse } from 'next/server';
import { infrastructureService } from '@/services/infrastructure.service';

export async function GET(request: NextRequest) {
  try {
    const cpu = await infrastructureService.getCpu();
    const mem = await infrastructureService.getMemory();
    const gpu = await infrastructureService.getGpu();

    const cpuUsage = cpu.load;
    const memoryUsage = mem.total > 0 ? (mem.used / mem.total) * 100 : 0;

    const primaryGpu = gpu?.devices?.[0];
    const gpuUsage = primaryGpu ? primaryGpu.utilization : 0;
    const vramUsage = primaryGpu ? primaryGpu.memoryUsage : 0;

    const telemetry = {
      cpuUsage: Number(cpuUsage.toFixed(1)),
      memoryUsage: Number(memoryUsage.toFixed(1)),
      gpuUsage: Number(gpuUsage.toFixed(1)),
      vramUsage: Number(vramUsage.toFixed(1)),
      hostStatus: 'Online',
      timestamp: Math.floor(Date.now() / 1000)
    };

    return NextResponse.json(telemetry, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-RateLimit-Limit': '300',
        'X-RateLimit-Remaining': '299',
        'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_INTERNAL',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

