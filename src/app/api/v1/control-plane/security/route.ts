// src/app/api/v1/control-plane/security/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { securityOperationsManager } from '@/platform/control-plane/SecurityOperationsManager';
import { platformOperationsControlPlane } from '@/platform/control-plane/PlatformOperationsControlPlane';
import { platformRBAC } from '@/platform/control-plane/PlatformRBAC';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await platformOperationsControlPlane.initialize();

    // Verify Auditor or Admin permission
    const user = platformRBAC.getActiveContext();
    if (!platformRBAC.verify(user, 'security:audit')) {
      return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
    }

    const posture = await securityOperationsManager.getSecurityPosture();
    return NextResponse.json({ posture, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await platformOperationsControlPlane.initialize();
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role parameter is missing.' }, { status: 400 });
    }

    platformRBAC.setActiveRole(role);
    return NextResponse.json({ success: true, activeRole: role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
