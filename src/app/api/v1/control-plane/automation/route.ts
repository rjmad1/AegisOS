// src/app/api/v1/control-plane/automation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformAutomationEngine } from '@/platform/control-plane/PlatformAutomationEngine';
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

    const tasks = platformAutomationEngine.getTasks().map(t => ({
      id: t.id,
      name: t.name,
      schedule: t.schedule,
      enabled: t.enabled,
      status: t.status,
      lastRun: t.lastRun,
      nextRun: t.nextRun
    }));
    return NextResponse.json({ tasks, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await platformOperationsControlPlane.initialize();
    const body = await request.json();
    const { action, taskId, enabled } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required.' }, { status: 400 });
    }

    const user = platformRBAC.getActiveContext();
    if (!platformRBAC.verify(user, 'workflow:trigger')) {
      return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
    }

    if (action === 'toggle') {
      const ok = platformAutomationEngine.toggleTask(taskId, enabled);
      return NextResponse.json({ success: ok, taskId, enabled });
    }

    if (action === 'trigger') {
      const success = await platformAutomationEngine.triggerTask(taskId);
      return NextResponse.json({ success, taskId });
    }

    return NextResponse.json({ error: `Action '${action}' not supported.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
