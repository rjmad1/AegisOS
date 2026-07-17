// src/app/api/v1/control-plane/observability/route.ts
import { NextResponse } from 'next/server';
import { observabilityAggregator } from '@/platform/control-plane/ObservabilityAggregator';
import { platformOperationsControlPlane } from '@/platform/control-plane/PlatformOperationsControlPlane';
import { platformRBAC } from '@/platform/control-plane/PlatformRBAC';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await platformOperationsControlPlane.initialize();

    const user = platformRBAC.getActiveContext();
    if (!platformRBAC.verify(user, 'obs:read')) {
      return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
    }

    const history = observabilityAggregator.getHistory();
    const anomalies = observabilityAggregator.detectAnomalies();
    const capacityForecast = observabilityAggregator.getCapacityForecast();

    return NextResponse.json({
      history,
      anomalies,
      capacityForecast,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
