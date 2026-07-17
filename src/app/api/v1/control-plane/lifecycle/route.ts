// src/app/api/v1/control-plane/lifecycle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformLifecycleOrchestrator } from '@/platform/control-plane/PlatformLifecycleOrchestrator';
import { platformServiceManager } from '@/platform/control-plane/PlatformServiceManager';
import { platformOperationsControlPlane } from '@/platform/control-plane/PlatformOperationsControlPlane';
import { platformRBAC } from '@/platform/control-plane/PlatformRBAC';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await platformOperationsControlPlane.initialize();

    const body = await request.json();
    const { action, serviceId, dryRun, mode } = body;
    const user = platformRBAC.getActiveContext();

    // 1. Change operations mode
    if (mode) {
      if (!platformRBAC.verify(user, 'platform:maintenance')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      if (mode === 'maintenance') {
        platformLifecycleOrchestrator.enterMaintenanceMode();
        return NextResponse.json({ success: true, message: 'Platform transitioned to maintenance mode.' });
      }
      if (mode === 'upgrade') {
        platformLifecycleOrchestrator.enterUpgradeMode();
        return NextResponse.json({ success: true, message: 'Platform transitioned to upgrade mode.' });
      }
    }

    // 2. Component lifecycle
    if (serviceId) {
      if (!platformRBAC.verify(user, 'service:control')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      
      let ok = false;
      if (action === 'start') {
        ok = await platformServiceManager.startService(serviceId, dryRun);
      } else if (action === 'stop') {
        ok = await platformServiceManager.stopService(serviceId, dryRun);
      } else if (action === 'restart') {
        ok = await platformServiceManager.restartService(serviceId, dryRun);
      } else if (action === 'reload') {
        ok = await platformServiceManager.reloadService(serviceId);
      } else if (action === 'repair') {
        ok = await platformServiceManager.repairService(serviceId);
      } else if (action === 'validate') {
        const val = await platformServiceManager.validateService(serviceId);
        return NextResponse.json({ success: val.valid, logs: val.logs });
      }

      return NextResponse.json({ success: ok, serviceId, action });
    }

    // 3. Platform lifecycle
    if (action === 'start') {
      if (!platformRBAC.verify(user, 'platform:start')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.startPlatform(dryRun);
      return NextResponse.json({ success: ok, action });
    }
    if (action === 'stop') {
      if (!platformRBAC.verify(user, 'platform:stop')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.safeShutdown();
      return NextResponse.json({ success: ok, action });
    }
    if (action === 'restart') {
      if (!platformRBAC.verify(user, 'platform:restart')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.restartPlatform(dryRun);
      return NextResponse.json({ success: ok, action });
    }
    if (action === 'pause') {
      if (!platformRBAC.verify(user, 'platform:maintenance')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.pausePlatform();
      return NextResponse.json({ success: ok, action });
    }
    if (action === 'resume') {
      if (!platformRBAC.verify(user, 'platform:maintenance')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.resumePlatform();
      return NextResponse.json({ success: ok, action });
    }
    if (action === 'emergency-stop') {
      if (!platformRBAC.verify(user, 'platform:stop')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await platformLifecycleOrchestrator.emergencyShutdown();
      return NextResponse.json({ success: ok, action });
    }

    return NextResponse.json({ error: `Action '${action}' not supported.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
