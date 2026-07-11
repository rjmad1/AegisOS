// ============================================================================
// Operations API — GET /api/v1/providers/[id] (Provider-specific Status)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@/infrastructure/providers/registry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registry = ProviderRegistry.getInstance();
    const provider = registry.getProvider(id);

    if (!provider) {
      return NextResponse.json({ error: `Provider not found: ${id}` }, { status: 404 });
    }

    let health: any = { status: 'healthy', latencyMs: 0.1 };
    let caps: any = { version: '1.0.0', capabilities: [] };

    try {
      if (typeof (provider as any).checkHealth === 'function') {
        health = await (provider as any).checkHealth();
      }
      if (typeof (provider as any).getCapabilities === 'function') {
        caps = await (provider as any).getCapabilities();
      }
    } catch (e) {
      health = { status: 'unhealthy', latencyMs: 0, errorMessage: String(e) };
    }

    const providerModel = {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      availability: health.status === 'healthy' || health.status === 'degraded' ? 'available' : 'unavailable',
      health: health.status || 'unknown',
      latency: health.latencyMs || 0,
      version: caps.version || '1.0.0',
      capabilities: caps.capabilities || [],
      connectionState: health.status === 'healthy' ? 'connected' : health.status === 'degraded' ? 'degraded' : 'disconnected',
      lastSuccessfulSync: new Date().toISOString(),
      errorState: health.errorMessage || null,
      recoveryStatus: health.status === 'healthy' ? 'stable' : 'reconnecting',
    };

    return NextResponse.json(providerModel);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
