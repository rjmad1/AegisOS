// ============================================================================
// Operations API — GET /api/v1/providers (Infrastructure Providers)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ProviderRegistry } from '@/infrastructure/providers/registry';

export async function GET(request: NextRequest) {
  try {
    const registry = ProviderRegistry.getInstance();
    const defaultProviderIds = [
      'aegisos-runtime-provider',
      'local-artifact-storage-provider',
      'ollama-provider',
      'litellm-provider',
      'filesystem-provider',
      'windows-provider',
      'docker-provider',
      'mock-provider'
    ];

    const results = [];
    for (const id of defaultProviderIds) {
      const provider = registry.getProvider(id);
      if (provider) {
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

        results.push({
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
        });
      }
    }

    return NextResponse.json({ providers: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
