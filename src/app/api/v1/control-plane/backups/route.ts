// src/app/api/v1/control-plane/backups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { backupRecoveryCoordinator } from '@/platform/control-plane/BackupRecoveryCoordinator';
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

    const backups = await backupRecoveryCoordinator.getBackupsList();
    return NextResponse.json({ backups, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await platformOperationsControlPlane.initialize();
    const body = await request.json();
    const { action, backupId, type } = body;
    const user = platformRBAC.getActiveContext();

    if (action === 'create') {
      if (!platformRBAC.verify(user, 'backup:create')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const backup = await backupRecoveryCoordinator.createBackup(type || 'full');
      return NextResponse.json({ success: backup.status === 'success', backup });
    }

    if (action === 'restore') {
      if (!backupId) return NextResponse.json({ error: 'backupId is required to restore.' }, { status: 400 });
      if (!platformRBAC.verify(user, 'backup:restore')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await backupRecoveryCoordinator.restoreFromBackup(backupId);
      return NextResponse.json({ success: ok, backupId });
    }

    if (action === 'delete') {
      if (!backupId) return NextResponse.json({ error: 'backupId is required to delete.' }, { status: 400 });
      if (!platformRBAC.verify(user, 'backup:create')) {
        return NextResponse.json({ error: 'Access Refused: Insufficient privileges.' }, { status: 403 });
      }
      const ok = await backupRecoveryCoordinator.deleteBackup(backupId);
      return NextResponse.json({ success: ok, backupId });
    }

    return NextResponse.json({ error: `Action '${action}' not supported.` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
