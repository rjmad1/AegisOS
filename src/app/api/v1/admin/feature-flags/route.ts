import { NextResponse } from 'next/server';
import { getAdminUser } from '@/platform/auth/adminAuth';
import { adminService } from "@/services/admin.service";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const flags = await adminService.featureFlags.getAllFlags();
  return NextResponse.json(flags);
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, enabled } = body;
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Missing flag ID or enabled status' }, { status: 400 });
    }

    const flag = await adminService.featureFlags.toggleFlag(id, enabled);
    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    await adminService.audit.logEvent(
      admin.username,
      'Toggle Feature Flag',
      'configuration',
      `Feature flag "${flag.name}" was set to: ${enabled ? 'Enabled' : 'Disabled'}`
    );

    return NextResponse.json(flag);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
