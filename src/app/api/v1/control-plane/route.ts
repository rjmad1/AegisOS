// src/app/api/v1/control-plane/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { remoteOperationsServer } from '@/platform/control-plane/RemoteOperationsServer';
import { platformOperationsControlPlane } from '@/platform/control-plane/PlatformOperationsControlPlane';
import { platformLifecycleOrchestrator } from '@/platform/control-plane/PlatformLifecycleOrchestrator';
import { platformRBAC } from '@/platform/control-plane/PlatformRBAC';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await platformOperationsControlPlane.initialize();
    const mode = platformLifecycleOrchestrator.getPlatformMode();
    const rbacContext = platformRBAC.getActiveContext();

    return NextResponse.json({
      status: 'online',
      platformMode: mode,
      rbacRole: rbacContext.role,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command) {
      return NextResponse.json({ error: 'Command parameter is missing.' }, { status: 400 });
    }

    // Ensure control plane is initialized
    await platformOperationsControlPlane.initialize();

    const user = platformRBAC.getActiveContext();
    const rawCmd = command.trim().toLowerCase();

    // Enforce permission checks based on command mapping
    if (rawCmd.includes('start') && !platformRBAC.verify(user, 'platform:start')) {
      return NextResponse.json({ success: false, output: 'Access Refused: Insufficient privileges to start platform.' }, { status: 403 });
    }
    if (rawCmd.includes('stop') && !platformRBAC.verify(user, 'platform:stop')) {
      return NextResponse.json({ success: false, output: 'Access Refused: Insufficient privileges to stop platform.' }, { status: 403 });
    }
    if (rawCmd.includes('restart') && !platformRBAC.verify(user, 'platform:restart')) {
      return NextResponse.json({ success: false, output: 'Access Refused: Insufficient privileges to restart platform.' }, { status: 403 });
    }
    if (rawCmd.includes('security') && !platformRBAC.verify(user, 'security:audit')) {
      return NextResponse.json({ success: false, output: 'Access Refused: Insufficient privileges to scan security rules.' }, { status: 403 });
    }
    if (rawCmd.includes('backup') && !platformRBAC.verify(user, 'backup:create')) {
      return NextResponse.json({ success: false, output: 'Access Refused: Insufficient privileges to create backup.' }, { status: 403 });
    }

    const response = await remoteOperationsServer.executeCommand(command);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
