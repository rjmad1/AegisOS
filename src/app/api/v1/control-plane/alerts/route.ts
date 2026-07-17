// src/app/api/v1/control-plane/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformAlertingFramework } from '@/platform/control-plane/PlatformAlertingFramework';
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

    const alerts = platformAlertingFramework.getActiveAlerts();
    return NextResponse.json({ alerts, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await platformOperationsControlPlane.initialize();
    const body = await request.json();
    const { action, alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'AlertId parameter is required.' }, { status: 400 });
    }

    const user = platformRBAC.getActiveContext();
    if (!platformRBAC.verify(user, 'service:control')) {
      return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
    }

    if (action === 'repair') {
      const ok = await platformAlertingFramework.executeOneClickRepair(alertId);
      return NextResponse.json({ success: ok, alertId, action });
    }

    if (action === 'resolve' || action === 'mute') {
      await platformAlertingFramework.resolveAlert(alertId);
      return NextResponse.json({ success: true, alertId, action });
    }

    return NextResponse.json({ error: `Action '${action}' not supported.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
